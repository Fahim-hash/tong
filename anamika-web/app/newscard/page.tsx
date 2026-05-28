'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { db } from '../lib/firebase'; 
import { doc, updateDoc, increment } from 'firebase/firestore'; 
import { ArrowLeft, Download, RefreshCw, Eye, Image as ImageIcon, Sparkles, Copy, Check, Type, Italic } from 'lucide-react';

type Category = 'NATIONAL' | 'INTERNATIONAL' | 'SPORTS' | 'POLITICS' | 'ECONOMY' | 'SOCIAL';
type Variant = 'white' | 'black';
type LangMode = 'BN' | 'EN';

export default function NewsCardGenerator() {
  // Input Form States
  const [langMode, setLangMode] = useState<LangMode>('BN');  
  const [category, setCategory] = useState<Category>('NATIONAL');
  const [headline, setHeadline] = useState('এখানে আপনার মূল শিরোনাম লিখুন');
  const [subHeadline, setSubHeadline] = useState('এখানে সংবাদের বিস্তারিত বা একটি ছোট উপ-শিরোনাম যোগ করুন');
  const [photoCredit, setPhotoCredit] = useState('ছবি: সংগৃহীত');
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

  // --- AI CAPTION GENERATION INTEGRATION ---
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
        body: JSON.stringify({ 
          headline, 
          subHeadline, 
          image: imagePreview, 
          langMode 
        }),
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
    try {
      await navigator.clipboard.writeText(generatedCaption);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
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
  };

  const renderStyledPreviewText = (rawText: string) => {
    if (!rawText) return '';
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

  const trackFirebaseNewsCount = async () => {
    try {
      const session = localStorage.getItem('tk_user_session');
      if (!session) return;
      const currentSession = JSON.parse(session);
      const userId = currentSession.id.toLowerCase().trim();
      const memberDocRef = doc(db, "members", userId);
      await updateDoc(memberDocRef, { newsCardCount: increment(1) });
    } catch (err) {
      console.error("Firebase tracking error:", err);
    }
  };

  // --- ADVANCED CANVAS EXPORT WITH SUBHEADLINE INTEGRATION ---
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
    const splitY = 560; // টেক্সট প্যানেলের ডায়নামিক স্পেস রেটিও
    canvas.width = W;
    canvas.height = H;

    // ১. টপ প্যানেল সেটআপ
    ctx.fillStyle = selectedVariant === 'white' ? '#ffffff' : '#111111';
    ctx.fillRect(0, 0, W, splitY);

    // ২. বটম ইমেজ এরিয়া ডিফল্ট সলিড ব্যাকগ্রাউন্ড
    ctx.fillStyle = selectedVariant === 'white' ? '#e5e5e5' : '#b23b3b';
    ctx.fillRect(0, splitY, W, H - splitY);

    const margin = 70;
    
    // ৩. ডেট রেন্ডারিং
    ctx.fillStyle = selectedVariant === 'white' ? '#555555' : '#bbbbbb';
    ctx.font = '700 30px Arial, SolaimanLipi, sans-serif';
    ctx.fillText(getDynamicDate(), margin, 75);

    // ৪. রিচ হেডলাইন জেনারেটর (Wrap + Custom Color tags support)
    const hSize = 54;
    const maxLineWidth = W - (margin * 2);
    let nextTextY = 155;

    const tokens = headline.trim().split(/(\[b\].*?\[\/b\]|\[i\].*?\[\/i\]|\s+)/g).filter(Boolean);
    let lines: any[][] = [[]];
    let currentLineWidth = 0;
    let currentLineIndex = 0;

    const getFontForType = (type: 'bold' | 'italic' | 'regular') => {
      const fontBase = "Arial, SolaimanLipi, sans-serif";
      if (type === 'bold') return `800 ${hSize}px ${fontBase}`;
      if (type === 'italic') return `italic 700 ${hSize}px ${fontBase}`;
      return `700 ${hSize}px ${fontBase}`;
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

    lines.forEach((line) => {
      let offsetX = margin;
      line.forEach((word) => {
        ctx.font = getFontForType(word.type);
        ctx.fillStyle = selectedVariant === 'white' 
          ? (word.type === 'bold' ? '#dfa100' : '#111111') 
          : (word.type === 'bold' ? '#f59e0b' : '#ffffff'); 
        
        ctx.fillText(word.text, offsetX, nextTextY);
        offsetX += word.width;
      });
      nextTextY += hSize * 1.35;
    });

    // ৫. সাব-হেডলাইন রেন্ডারিং ইন্টিগ্রেশন (Multi-line Wrap Engine)
    if (subHeadline && subHeadline.trim() !== '') {
      nextTextY += 15; // হেডলাইন থেকে সামান্য মার্জিন স্পেস
      ctx.fillStyle = selectedVariant === 'white' ? '#444444' : '#aaaaaa';
      ctx.font = '500 32px Arial, SolaimanLipi, sans-serif';
      
      const subWords = subHeadline.split(' ');
      let currentSubLine = '';
      const subLineHeight = 44;

      for (let n = 0; n < subWords.length; n++) {
        let testLine = currentSubLine + subWords[n] + ' ';
        let testWidth = ctx.measureText(testLine).width;
        if (testWidth > maxLineWidth && n > 0) {
          ctx.fillText(currentSubLine, margin, nextTextY);
          currentSubLine = subWords[n] + ' ';
          nextTextY += subLineHeight;
        } else {
          currentSubLine = testLine;
        }
      }
      ctx.fillText(currentSubLine, margin, nextTextY);
    }

    // ৬. ইমেজ লেয়ার এবং ফুটার রেন্ডারিং
    const finishCanvasDrawing = () => {
      // ফটো ক্রেডিট (Bottom Left)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '500 24px Arial, SolaimanLipi, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(photoCredit, margin, H - 65);

      // ব্র্যান্ড ওয়াটারমার্ক (Bottom Right)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '700 28px Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('tongerkhobor', W - margin, H - 65);

      // ডাউনলোড প্রসেস এক্সপোর্ট
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `TongerKhobor-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      trackFirebaseNewsCount();
      setIsExporting(false);
    };

    if (imagePreview) {
      const img = new window.Image();
      img.src = imagePreview;
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, splitY, W, H - splitY);
        ctx.clip();

        const imgRatio = img.width / img.height;
        const targetW = W;
        const targetH = H - splitY;
        const targetRatio = targetW / targetH;

        let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
        if (imgRatio > targetRatio) {
          sWidth = img.height * targetRatio;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / targetRatio;
          sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, splitY, targetW, targetH);
        ctx.restore();
        finishCanvasDrawing();
      };
    } else {
      finishCanvasDrawing();
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-800 pb-12">
      {/* TOP HEADER */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-50 px-4 py-4 sm:px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="p-2 bg-stone-50 hover:bg-stone-200 rounded-xl transition text-stone-600">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Split Card Template Generator</h1>
              <p className="text-xs text-stone-500">Subheadline & AI Caption Integrated</p>
            </div>
          </div>
          
          <button
            onClick={handleDownloadCard}
            disabled={isExporting}
            className="bg-[#800020] hover:bg-[#600018] disabled:bg-stone-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition flex items-center space-x-2"
          >
            {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>{isExporting ? 'Generating...' : 'Download Card'}</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT FORM FIELDS */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-5">
            <h2 className="text-sm font-bold text-stone-900 tracking-wider uppercase border-b border-stone-100 pb-3">Card Controller</h2>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLangMode('BN')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition ${langMode === 'BN' ? 'bg-amber-500 text-stone-950 border-amber-500' : 'bg-stone-50 text-stone-700 border-stone-200'}`}
              >
                🇧🇩 বাংলা মোড
              </button>
              <button
                type="button"
                onClick={() => setLangMode('EN')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition ${langMode === 'EN' ? 'bg-amber-500 text-stone-950 border-amber-500' : 'bg-stone-50 text-stone-700 border-stone-200'}`}
              >
                🇬🇧 English
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Theme Design</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVariant('white')}
                  className={`py-2 px-3 text-xs rounded-xl border transition ${selectedVariant === 'white' ? 'bg-stone-200 font-bold border-stone-400' : 'bg-white'}`}
                >
                  White Variant
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVariant('black')}
                  className={`py-2 px-3 text-xs rounded-xl border transition ${selectedVariant === 'black' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white'}`}
                >
                  Black Variant
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Select Image</label>
              <div className="relative border-2 border-dashed border-stone-200 hover:border-[#800020] rounded-xl bg-stone-50 p-3 text-center cursor-pointer">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <span className="text-xs text-stone-500 font-medium">Click to upload photo</span>
              </div>
            </div>

            {/* MAIN HEADLINE */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider">Main Headline</label>
                <div className="flex space-x-1 bg-stone-100 p-0.5 rounded-md border text-xs scale-90">
                  <button type="button" onClick={() => applyStyleToSelection('b')} className="px-1.5 py-0.5 font-bold text-amber-500">Color</button>
                  <button type="button" onClick={() => applyStyleToSelection('i')} className="px-1.5 py-0.5 italic">Italic</button>
                </div>
              </div>
              <textarea
                ref={headlineRef}
                rows={2}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            {/* SUB HEADLINE FIELD */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">Sub Headline</label>
              <textarea
                rows={2}
                value={subHeadline}
                onChange={(e) => setSubHeadline(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                placeholder="সংবাদের উপ-শিরোনাম বা বর্ণনা এখানে দিন..."
              />
            </div>

            {/* PHOTO CREDIT FIELD */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">Photo Credit</label>
              <input
                type="text"
                value={photoCredit}
                onChange={(e) => setPhotoCredit(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            {/* AI CAPTION INTEGRATION COMPONENT */}
            <div className="border-t border-stone-200 pt-4">
              <button
                type="button"
                onClick={handleGenerateCaption}
                disabled={isAiLoading}
                className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white py-2.5 px-4 rounded-xl font-semibold text-sm shadow-md flex items-center justify-center space-x-2"
              >
                {isAiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>{isAiLoading ? 'AI Generating Caption...' : 'Generate AI Caption'}</span>
              </button>

              {generatedCaption && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3.5 mt-3 relative">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-purple-700 uppercase flex items-center space-x-1">
                      <Sparkles className="h-3 w-3" /> <span>AI Response Facebook Caption</span>
                    </span>
                    <button type="button" onClick={handleCopyCaption} className="p-1 bg-white hover:bg-purple-100 rounded-md border">
                      {isCopied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-stone-500" />}
                    </button>
                  </div>
                  <p className="text-xs text-stone-700 whitespace-pre-line leading-relaxed">{generatedCaption}</p>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT PREVIEW CONTAINER */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 self-start lg:ml-12">
              Live Preview
            </span>

            {/* 4:5 Aspect Ratio Display Box */}
            <div className="w-[360px] h-[450px] relative border border-stone-300 rounded-2xl shadow-2xl overflow-hidden bg-stone-900">
              <div 
                className="w-[1080px] h-[1350px] absolute top-0 left-0 origin-top-left flex flex-col"
                style={{ transform: 'scale(0.333333)' }}
              >
                
                {/* Top Section */}
                <div className={`w-full h-[560px] px-16 pt-16 flex flex-col justify-start relative ${
                  selectedVariant === 'white' ? 'bg-white text-stone-950' : 'bg-[#111111] text-white'
                }`}>
                  <div className={`text-3xl font-bold tracking-wide mb-5 ${selectedVariant === 'white' ? 'text-stone-500' : 'text-stone-400'}`}>
                    {getDynamicDate()}
                  </div>
                  <h2 className="text-[54px] font-extrabold leading-[1.35] tracking-wide text-left mb-4 whitespace-pre-wrap">
                    {renderStyledPreviewText(headline)}
                  </h2>
                  {subHeadline && (
                    <p className={`text-[32px] font-medium leading-[1.4] text-left whitespace-pre-wrap ${
                      selectedVariant === 'white' ? 'text-stone-600' : 'text-stone-400'
                    }`}>
                      {subHeadline}
                    </p>
                  )}
                </div>

                {/* Bottom Image Section */}
                <div className={`w-full h-[790px] relative flex flex-col items-center justify-center ${
                  selectedVariant === 'white' ? 'bg-[#e5e5e5]' : 'bg-[#b23b3b]'
                }`}>
                  {imagePreview && (
                    <img src={imagePreview} alt="News Source" className="absolute inset-0 w-full h-full object-cover" />
                  )}

                  {/* Photo Credit Layer */}
                  <div className="absolute bottom-16 left-16 z-20 font-medium text-[24px] text-white/90 drop-shadow-sm">
                    {photoCredit}
                  </div>

                  {/* Brand Watermark Identity */}
                  <div className="absolute bottom-16 right-16 z-20 font-bold text-[28px] text-white/90 drop-shadow-sm">
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
