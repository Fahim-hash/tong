'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '../lib/firebase'; 
import { doc, updateDoc, increment } from 'firebase/firestore'; 
import { ArrowLeft, Download, RefreshCw, Eye, Image as ImageIcon, Sparkles, Copy, Check, Type, Italic } from 'lucide-react';

type Category = 'NATIONAL' | 'INTERNATIONAL' | 'SPORTS' | 'POLITICS' | 'ECONOMY' | 'SOCIAL';
type Variant = 'white' | 'black' | 'general' | 'tong';
type LangMode = 'BN' | 'EN';

export default function NewsCardGenerator() {
  // Input Form States
  const [langMode, setLangMode] = useState<LangMode>('BN');  
  const [category, setCategory] = useState<Category>('NATIONAL');
  const [headline, setHeadline] = useState('Enter a headline');
  const [subHeadline, setSubHeadline] = useState('এখানে সংবাদের বিস্তারিত বা একটি ছোট উপ-শিরোনাম যোগ করুন');
  const [photoCredit, setPhotoCredit] = useState('ছবি: টংয়েরখবর');
  const [selectedVariant, setSelectedVariant] = useState<Variant>('black');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // AI Caption States
  const [generatedCaption, setGeneratedCaption] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const headlineRef = useRef<HTMLTextAreaElement>(null);

  // Dynamic Date Engine
  const getDynamicDate = () => {
    const date = new Date();
    
    if (langMode === 'EN') {
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    const months = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    
    const engToBngDigits = (str: string) => {
      const convert: { [key: string]: string } = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', 
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
      };
      return str.split('').map(d => convert[d] || d).join('');
    };

    const day = engToBngDigits(date.getDate().toString());
    const month = months[date.getMonth()];
    const year = engToBngDigits(date.getFullYear().toString());

    return `${month} ${day}, ${year}`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateCaption = async () => {
    if (!headline || headline.trim() === '') {
      alert(langMode === 'EN' ? 'Please enter a headline first.' : 'দয়া করে আগে একটি নিউজ হেডলাইন লিখুন।');
      return;
    }
    setIsAiLoading(true);
    setGeneratedCaption('');
    try {
      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline, subHeadline, image: imagePreview, langMode }),
      });
      const data = await res.json();
      if (data.caption) {
        setGeneratedCaption(data.caption);
      } else {
        setGeneratedCaption(
          langMode === 'EN' 
            ? 'Failed to generate caption. Please try again.' 
            : 'ক্যাপশন জেনারেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
        );
      }
    } catch (error) {
      console.error(error);
      setGeneratedCaption(
        langMode === 'EN' 
          ? 'Server error! Please try again.' 
          : 'সার্ভার ত্রুটি! আবার চেষ্টা করুন।'
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyCaption = async () => {
    if (!generatedCaption) return;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(generatedCaption);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        return;
      } catch (err) {
        console.warn('Modern clipboard API failed...', err);
      }
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = generatedCaption;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      if (successful) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
      document.body.removeChild(textArea);
    } catch (err) {
      console.error(err);
    }
  };

  const applyStyleToSelection = (styleType: 'b' | 'i') => {
    const textarea = headlineRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start === end) return;

    const selectedText = headline.substring(start, end);
    const openTag = `[${styleType}]`;
    const closeTag = `[/${styleType}]`;

    let newText = '';
    if (selectedText.startsWith(openTag) && selectedText.endsWith(closeTag)) {
      const stripped = selectedText.substring(openTag.length, selectedText.length - closeTag.length);
      newText = headline.substring(0, start) + stripped + headline.substring(end);
    } else {
      newText = headline.substring(0, start) + openTag + selectedText + closeTag + headline.substring(end);
    }

    setHeadline(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + newText.length - headline.length + (end - start));
    }, 50);
  };

  const renderStyledPreviewText = (rawText: string) => {
    if (!rawText) return langMode === 'EN' ? 'Headline missing...' : 'শিরোনাম অনুপস্থিত...';
    const tokens = rawText.split(/(\[b\].*?\[\/b\]|\[i\].*?\[\/i\])/g);
    return tokens.map((token, idx) => {
      if (token.startsWith('[b]') && token.endsWith('[/b]')) {
        return <span key={idx} className="font-extrabold text-amber-500">{token.replace('[b]', '').replace('[/b]', '')}</span>;
      }
      if (token.startsWith('[i]') && token.endsWith('[/i]')) {
        return <em key={idx} className="italic font-bold">{token.replace('[i]', '').replace('[/i]', '')}</em>;
      }
      return token;
    });
  };

  const getCategoryLabel = (cat: Category) => {
    if (langMode === 'EN') return cat;
    const labels = { NATIONAL: 'জাতীয়', INTERNATIONAL: 'আন্তর্জাতিক', SPORTS: 'খেলাধুলা', POLITICS: 'রাজনীতি', ECONOMY: 'অর্থনীতি', SOCIAL: 'সমাজ' };
    return labels[cat];
  };

  const trackFirebaseNewsCount = async () => {
    try {
      const session = localStorage.getItem('tk_user_session');
      if (!session) return;
      
      const currentSession = JSON.parse(session);
      const userId = currentSession.id.toLowerCase().trim();

      const memberDocRef = doc(db, "members", userId);
      await updateDoc(memberDocRef, {
        newsCardCount: increment(1)
      });
    } catch (err) {
      console.error("Failed to track news count on Firebase:", err);
    }
  };

  // --- FIXED DOWNLOAD CANVAS ENGINE FOR NEW LAYOUT ---
  const handleDownloadCard = () => {
    setIsExporting(true);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    const W = 1080;
    const H = 1350;
    const splitY = 540; // স্যাম্পল ইমেজ অনুযায়ী টপ সেকশন ৫৪০px উচ্চতার রাখা হয়েছে
    canvas.width = W;
    canvas.height = H;

    // ১. টপ প্যানেল ব্যাকগ্রাউন্ড ডিজাইন
    ctx.fillStyle = selectedVariant === 'white' ? '#ffffff' : '#111111';
    ctx.fillRect(0, 0, W, splitY);

    // ২. বটম প্যানেল (ফটো ব্যাকগ্রাউন্ড) কালার সেটআপ
    ctx.fillStyle = selectedVariant === 'white' ? '#c0c0c0' : '#b23b3b';
    ctx.fillRect(0, splitY, W, H - splitY);

    const drawContentLayers = () => {
      const margin = 70;
      
      // ৩. টপ সেকশনের তারিখ (Date) রেন্ডারিং
      ctx.fillStyle = selectedVariant === 'white' ? '#111111' : '#bbbbbb';
      ctx.font = '700 32px Playfair Display, Georgia, SolaimanLipi, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(getDynamicDate(), margin, 65);

      // ৪. টপ সেকশনের মেইন হেডলাইন টেক্সট রেন্ডারিং
      const hSize = 58;
      const maxLineWidth = W - (margin * 2);
      let textY = 145;

      const renderRichCanvasHeadline = (text: string, startY: number) => {
        const tokens = text.trim().split(/(\[b\].*?\[\/b\]|\[i\].*?\[\/i\]|\s+)/g).filter(Boolean);
        let lines: any[][] = [[]];
        let currentLineWidth = 0;
        let currentLineIndex = 0;

        const getFontForType = (type: 'bold' | 'italic' | 'regular') => {
          const base = "Playfair Display, Georgia, SolaimanLipi, sans-serif";
          if (type === 'bold') return `800 ${hSize}px ${base}`;
          if (type === 'italic') return `italic 700 ${hSize}px ${base}`;
          return `700 ${hSize}px ${base}`;
        };

        tokens.forEach((token) => {
          let type: 'bold' | 'italic' | 'regular' = 'regular';
          let cleanText = token;

          if (token.startsWith('[b]') && token.endsWith('[/b]')) {
            type = 'bold';
            cleanText = token.replace('[b]', '').replace('[/b]', '');
          } else if (token.startsWith('[i]') && token.endsWith('[/i]')) {
            type = 'italic';
            cleanText = token.replace('[i]', '').replace('[/i]', '');
          }

          ctx.font = getFontForType(type);
          const tokenWidth = ctx.measureText(cleanText).width;

          if (currentLineWidth + tokenWidth > maxLineWidth && token !== ' ') {
            lines.push([]);
            currentLineIndex++;
            currentLineWidth = 0;
          }

          if (!(token === ' ' && currentLineWidth === 0)) {
            lines[currentLineIndex].push({ text: cleanText, type, width: tokenWidth });
            currentLineWidth += tokenWidth;
          }
        });

        let currentY = startY;
        lines.forEach((line) => {
          let offsetX = margin;
          line.forEach((word) => {
            ctx.font = getFontForType(word.type);
            ctx.fillStyle = selectedVariant === 'white' 
              ? (word.type === 'bold' ? '#dfa100' : '#111111') 
              : (word.type === 'bold' ? '#f59e0b' : '#ffffff'); 
            
            ctx.fillText(word.text, offsetX, currentY);
            offsetX += word.width;
          });
          currentY += hSize * 1.3;
        });
        return currentY;
      };

      renderRichCanvasHeadline(headline, textY);

      // ৫. বটম রাইট কর্নারে ওয়াটারমার্ক ব্র্যান্ডিং টেক্সট "tongerkhobor"
      ctx.fillStyle = selectedVariant === 'white' ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.55)';
      ctx.font = '700 28px Arial, Helvetica, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('tongerkhobor', W - margin, H - 75);
      ctx.textAlign = 'left'; // Reset back align default

      // ৬. ইমেজ আপলোড করা থাকলে তা ড্রয়িং করা
      if (imagePreview) {
        const mainImg = new window.Image();
        mainImg.src = imagePreview;
        mainImg.onload = () => {
          ctx.save();
          // শুধুমাত্র বটম সেকশনের এরিয়া ক্লিপ করে ইমেজ বসানো
          ctx.beginPath();
          ctx.rect(0, splitY, W, H - splitY);
          ctx.clip();

          const imgRatio = mainImg.width / mainImg.height;
          const targetW = W;
          const targetH = H - splitY;
          const targetRatio = targetW / targetH;
          
          let sx = 0, sy = 0, sWidth = mainImg.width, sHeight = mainImg.height;
          if (imgRatio > targetRatio) {
            sWidth = mainImg.height * targetRatio;
            sx = (mainImg.width - sWidth) / 2;
          } else {
            sHeight = mainImg.width / targetRatio;
            sy = (mainImg.height - sHeight) / 2;
          }

          ctx.drawImage(mainImg, sx, sy, sWidth, sHeight, 0, splitY, targetW, targetH);
          ctx.restore();
          finalizeExport();
        };
        mainImg.onerror = () => finalizeExport();
      } else {
        // ইমেজ না থাকলে ডামি টেক্সট "Upload a photo" জেনারেট করা
        ctx.fillStyle = selectedVariant === 'white' ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.25)';
        ctx.font = '400 36px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Upload a photo', W / 2, splitY + (H - splitY) / 2);
        ctx.textAlign = 'left';
        finalizeExport();
      }

      async function finalizeExport() {
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `TongerKhobor-SplitCard-${Date.now()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        await trackFirebaseNewsCount();
        setIsExporting(false);
      }
    };

    drawContentLayers();
  };

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-800 pb-12">
      <div className="bg-white border-b border-stone-200 sticky top-0 z-50 px-4 py-4 sm:px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="p-2 bg-stone-50 hover:bg-stone-200 rounded-xl transition text-stone-600">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Split Card Template Generator</h1>
              <p className="text-xs text-stone-500">Perfect 2-Layer Layout Sync</p>
            </div>
          </div>
          
          <button
            onClick={handleDownloadCard}
            disabled={isExporting}
            className="bg-[#800020] hover:bg-[#600018] disabled:bg-stone-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition flex items-center space-x-2"
          >
            {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>{isExporting ? 'Generating...' : 'Download Split Card'}</span>
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT CUSTOMIZER FORM */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-5">
            <h2 className="text-sm font-bold text-stone-900 tracking-wider uppercase border-b border-stone-100 pb-3">Card Customizer</h2>
            
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Card Language (ভাষা)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLangMode('BN')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition ${langMode === 'BN' ? 'bg-amber-500 text-stone-950 border-amber-500' : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'}`}
                >
                  🇧🇩 বাংলা মোড (Bangla)
                </button>
                <button
                  type="button"
                  onClick={() => setLangMode('EN')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition ${langMode === 'EN' ? 'bg-amber-500 text-stone-950 border-amber-500' : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'}`}
                >
                  🇬🇧 English Mode
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Card Style Template</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVariant('white')}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition ${selectedVariant === 'white' ? 'bg-stone-200 text-stone-900 border-stone-400 font-bold' : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'}`}
                >
                  White Version
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVariant('black')}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition ${selectedVariant === 'black' ? 'bg-stone-900 text-white border-stone-900 font-bold' : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'}`}
                >
                  Black Version
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Cover Image File</label>
              <div className="relative border-2 border-dashed border-stone-200 hover:border-[#800020] rounded-xl transition bg-stone-50 p-4 text-center cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
                <div className="flex flex-col items-center space-y-1 text-stone-500">
                  <ImageIcon className="h-6 w-6 text-stone-400" />
                  <span className="text-xs font-medium">Click to select news image</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider">Headline Text</label>
                <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                  <button
                    type="button"
                    onClick={() => applyStyleToSelection('b')}
                    className="p-1.5 rounded-md hover:bg-white text-stone-700 transition flex items-center space-x-1"
                  >
                    <Type className="h-3.5 w-3.5 text-amber-500 stroke-[3]" />
                    <span className="text-[10px] font-bold text-stone-500">Color</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyStyleToSelection('i')}
                    className="p-1.5 rounded-md hover:bg-white text-stone-700 transition"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                ref={headlineRef}
                rows={3}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={200}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#800020] font-mono text-xs"
                placeholder="Type your news banner headline here..."
              />
            </div>

            <div className="border-t border-stone-200 pt-4">
              <button
                type="button"
                onClick={handleGenerateCaption}
                disabled={isAiLoading}
                className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white py-3 px-4 rounded-xl font-semibold text-sm shadow-md flex items-center justify-center space-x-2"
              >
                {isAiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>{isAiLoading ? 'AI Searching...' : 'Generate AI Caption'}</span>
              </button>

              {generatedCaption && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mt-3 relative">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-purple-700 uppercase flex items-center space-x-1">
                      <Sparkles className="h-3 w-3" /> <span>AI Caption</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCaption}
                      className="p-1.5 bg-white text-purple-600 hover:bg-purple-100 rounded-lg border border-purple-200"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-stone-700 whitespace-pre-line leading-relaxed">{generatedCaption}</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT LIVE CONTAINER PREVIEW */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center space-x-2 mb-3 self-start lg:ml-12">
              <Eye className="h-3.5 w-3.5 text-[#800020]" />
              <span>Split Layout Live View</span>
            </span>

            {/* ৪:৫ অ্যাসপেক্ট রেশিও কন্টেইনার */}
            <div className="w-[360px] h-[450px] relative border border-stone-300 rounded-2xl shadow-2xl overflow-hidden bg-stone-900">
              <div 
                className="w-[1080px] h-[1350px] absolute top-0 left-0 origin-top-left flex flex-col select-none"
                style={{ transform: 'scale(0.333333)' }}
              >
                
                {/* টপ টেক্সট সেকশন প্যানেল */}
                <div className={`w-full h-[540px] px-16 pt-16 flex flex-col justify-start relative ${
                  selectedVariant === 'white' ? 'bg-white text-stone-950' : 'bg-[#111111] text-white'
                }`}>
                  <div className={`text-3xl font-bold tracking-wide mb-6 ${selectedVariant === 'white' ? 'text-stone-950' : 'text-stone-300'}`}>
                    {getDynamicDate()}
                  </div>
                  <h2 className="text-[58px] font-extrabold leading-[1.3] tracking-wide text-left font-sans whitespace-pre-wrap">
                    {renderStyledPreviewText(headline)}
                  </h2>
                </div>

                {/* বটম ইমেজ সেকশন প্যানেল */}
                <div className={`w-full h-[810px] relative flex flex-col items-center justify-center ${
                  selectedVariant === 'white' ? 'bg-[#c0c0c0]' : 'bg-[#b23b3b]'
                }`}>
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Uploaded visual news background" 
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className={`flex flex-col items-center space-y-3 font-mono text-xl ${selectedVariant === 'white' ? 'text-stone-600' : 'text-white/40'}`}>
                      <span className="text-2xl tracking-wider font-semibold">Upload a photo</span>
                    </div>
                  )}

                  {/* ওয়াটারমার্ক ব্র্যান্ড আইডেন্টিটি টেক্সট */}
                  <div className={`absolute bottom-16 right-16 z-20 font-bold text-[28px] tracking-wide ${
                    selectedVariant === 'white' ? 'text-white/85 drop-shadow-sm' : 'text-white/60'
                  }`}>
                    tongerkhobor
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
