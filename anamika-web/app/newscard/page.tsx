'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Download, RefreshCw, Eye, Image as ImageIcon, Sparkles, Copy, Check, Type, Italic } from 'lucide-react';

type Category = 'NATIONAL' | 'INTERNATIONAL' | 'SPORTS' | 'POLITICS' | 'ECONOMY' | 'SOCIAL';
type Variant = 'white' | 'black' | 'general' | 'tong';
type LangMode = 'BN' | 'EN';

export default function NewsCardGenerator() {
  // Input Form States
  const [langMode, setLangMode] = useState<LangMode>('BN'); 
  const [category, setCategory] = useState<Category>('NATIONAL');
  const [headline, setHeadline] = useState('এখানে আপনার [b]ব্রেকিং নিউজ[/b] বা আকর্ষণীয় মূল হেডলাইনটি লিখুন');
  const [subHeadline, setSubHeadline] = useState('এখানে সংবাদের বিস্তারিত বা একটি ছোট উপ-শিরোনাম যোগ করুন যা সংবাদের মূল বিষয়বস্তুকে ফুটিয়ে তুলবে।');
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

  // FIXED: English mode sync issue by sending langMode to the backend
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
        // Added langMode to body payload
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

  // FIXED: Copy Text Fallback System for absolute cross-browser & mobile support
  const handleCopyCaption = async () => {
    if (!generatedCaption) return;

    // Try modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(generatedCaption);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        return;
      } catch (err) {
        console.warn('Modern clipboard API failed, rolling back to text-area simulation...', err);
      }
    }

    // Fallback Method for HTTP environments, embedded webviews, and strict mobile browsers
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
      } else {
        alert(langMode === 'EN' ? 'Failed to copy text. Please copy manually.' : 'টেক্সট কপি করা যায়নি। দয়া করে ম্যানুয়ালি কপি করুন।');
      }
      document.body.removeChild(textArea);
    } catch (err) {
      console.error('Fallback copy engine critical error: ', err);
      alert(langMode === 'EN' ? 'Could not copy text automatically.' : 'অটোমেটিক কপি করা সম্ভব হয়নি।');
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
        return <span key={idx} className={selectedVariant === 'white' ? "font-extrabold text-amber-600 drop-shadow-sm" : "font-extrabold text-amber-400 drop-shadow-sm"}>{token.replace('[b]', '').replace('[/b]', '')}</span>;
      }
      if (token.startsWith('[i]') && token.endsWith('[/i]')) {
        return <em key={idx} className={selectedVariant === 'white' ? "italic font-extrabold text-stone-700" : "italic font-extrabold text-stone-200"}>{token.replace('[i]', '').replace('[/i]', '')}</em>;
      }
      return token;
    });
  };

  const getCategoryLabel = (cat: Category) => {
    if (langMode === 'EN') return cat;

    const labels = {
      NATIONAL: 'জাতীয়',
      INTERNATIONAL: 'আন্তর্জাতিক',
      SPORTS: 'খেলাধুলা',
      POLITICS: 'রাজনীতি',
      ECONOMY: 'অর্থনীতি',
      SOCIAL: 'সমাজ'
    };
    return labels[cat];
  };

  // Fixed Export Canvas Engine
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
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = selectedVariant === 'white' ? '#ffffff' : '#090d14';
    ctx.fillRect(0, 0, W, H);

    const drawTextAndLayers = () => {
      const gradientStartPoint = H - 980; 
      const grad = ctx.createLinearGradient(0, gradientStartPoint, 0, H);
      
      if (selectedVariant === 'white') {
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.98)');
        grad.addColorStop(0.5, '#ffffff');
        grad.addColorStop(1, '#ffffff');
      } else {
        grad.addColorStop(0, 'rgba(9, 13, 20, 0)');
        grad.addColorStop(0.35, 'rgba(9, 13, 20, 0.98)');
        grad.addColorStop(0.5, '#090d14');
        grad.addColorStop(1, '#090d14');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, gradientStartPoint, W, H - gradientStartPoint);

      const topGrad = ctx.createLinearGradient(0, 0, 0, 160);
      topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
      topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, W, 160);

      if (photoCredit) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.font = '500 20px SolaimanLipi, SiyamRupali, Arial, sans-serif';
        const textWidth = ctx.measureText(photoCredit).width;
        
        ctx.beginPath();
        ctx.roundRect(40, 40, textWidth + 32, 45, 8);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textBaseline = 'middle';
        ctx.fillText(photoCredit, 56, 62);
      }

      const margin = 56;
      let textY = 820; 

      ctx.fillStyle = '#c1121f';
      ctx.font = langMode === 'EN' 
        ? '900 36px Inter, system-ui, sans-serif'
        : '900 40px SolaimanLipi, SiyamRupali, Arial, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(getCategoryLabel(category), margin, textY);

      textY += 60;
      ctx.fillStyle = selectedVariant === 'white' ? '#444444' : '#94a3b8';
      ctx.font = '500 22px SolaimanLipi, SiyamRupali, Arial, sans-serif';
      ctx.fillText(getDynamicDate(), margin, textY);

      textY += 55;
      const hSize = 52;
      const maxLineWidth = W - (margin * 2);

      const renderRichHeadline = (text: string, startY: number) => {
        const tokens = text.trim().split(/(\[b\].*?\[\/b\]|\[i\].*?\[\/i\]|\s+)/g).filter(Boolean);
        
        let lines: any[][] = [[]];
        let currentLineWidth = 0;
        let currentLineIndex = 0;

        const getFontForType = (type: 'bold' | 'italic' | 'regular') => {
          const base = langMode === 'EN' ? "Inter, system-ui, sans-serif" : "SolaimanLipi, SiyamRupali, Arial, sans-serif";
          if (type === 'bold') return `800 ${hSize}px ${base}`; 
          if (type === 'italic') return `italic 800 ${hSize}px ${base}`;
          return `800 ${hSize}px ${base}`;
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
              ? (word.type === 'bold' ? '#c1121f' : '#0c0a09') 
              : (word.type === 'bold' ? '#fbbf24' : '#ffffff'); 
            
            ctx.fillText(word.text, offsetX, currentY);
            offsetX += word.width;
          });
          currentY += hSize * 1.35;
        });

        return currentY;
      };

      textY = renderRichHeadline(headline || (langMode === 'EN' ? 'Headline missing...' : 'শিরোনাম অনুপস্থিত...'), textY);

      const wrapPlainText = (text: string, maxWidth: number) => {
        const words = text.trim().split(/\s+/);
        if (words.length === 0 || words[0] === "") return [];
        let lines: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
          let testLine = currentLine + " " + words[i];
          if (ctx.measureText(testLine).width < maxWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = words[i];
          }
        }
        lines.push(currentLine);
        return lines;
      };

      textY += 10;
      ctx.fillStyle = selectedVariant === 'white' ? '#292524' : '#cbd5e1';
      ctx.font = langMode === 'EN' ? '400 24px Inter, system-ui, sans-serif' : '400 25px SolaimanLipi, SiyamRupali, Arial, sans-serif';
      
      const subLines = wrapPlainText(subHeadline, maxLineWidth);
      subLines.slice(0, 2).forEach((line) => {
        ctx.fillText(line, margin, textY);
        textY += 42;
      });

      // Footer Line
      ctx.strokeStyle = selectedVariant === 'white' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin, H - 120);
      ctx.lineTo(W - margin, H - 120);
      ctx.stroke();

      // Logo Drawing Layer
      const logoImg = new window.Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.src = "/logo2.png";
      logoImg.onload = () => {
        const targetHeight = 52; 
        const aspectRatio = logoImg.width / logoImg.height;
        const targetWidth = targetHeight * aspectRatio; 

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = logoImg.width;
        offscreenCanvas.height = logoImg.height;
        const oCtx = offscreenCanvas.getContext('2d');
        
        if (oCtx) {
          oCtx.drawImage(logoImg, 0, 0);
          oCtx.globalCompositeOperation = 'source-in';
          if (selectedVariant === 'white') {
            oCtx.fillStyle = '#0c0a09'; 
          } else {
            oCtx.fillStyle = '#ffffff'; 
          }
          oCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
          
          ctx.drawImage(
            offscreenCanvas, 
            W - margin - targetWidth, 
            H - 95, 
            targetWidth, 
            targetHeight
          );
        }
        finalizeDownload();
      };

      logoImg.onerror = () => {
        finalizeDownload();
      };

      function finalizeDownload() {
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        const timestamp = Date.now();
        link.download = `TongerKhobor-${category}-${timestamp}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExporting(false);
      }
    };

    if (imagePreview) {
      const mainImg = new window.Image();
      mainImg.src = imagePreview;
      mainImg.onload = () => {
        const imgRatio = mainImg.width / mainImg.height;
        const canvasRatio = W / H;
        let sx = 0, sy = 0, sWidth = mainImg.width, sHeight = mainImg.height;

        if (imgRatio > canvasRatio) {
          sWidth = mainImg.height * canvasRatio;
          sx = (mainImg.width - sWidth) / 2;
        } else {
          sHeight = mainImg.width / canvasRatio;
          sy = (mainImg.height - sHeight) / 2;
        }

        ctx.drawImage(mainImg, sx, sy, sWidth, sHeight, 0, 0, W, H);
        drawTextAndLayers();
      };
    } else {
      drawTextAndLayers();
    }
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
              <h1 className="text-xl font-bold text-stone-900">News Card Generator</h1>
              <p className="text-xs text-stone-500">Fixed HD Ratio: 1080 × 1350 px</p>
            </div>
          </div>
          
          <button
            onClick={handleDownloadCard}
            disabled={isExporting}
            className="bg-[#800020] hover:bg-[#600018] disabled:bg-stone-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition flex items-center space-x-2"
          >
            {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>{isExporting ? 'Generating...' : 'Download HD Card'}</span>
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COL */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-5">
            <h2 className="text-sm font-bold text-stone-900 tracking-wider uppercase border-b border-stone-100 pb-3">Card Customizer</h2>
            
            {/* LANGUAGE MODE SELECTOR */}
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

            {/* TEMPLATE VARIANT SELECTOR */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Card Style Template</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
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
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition ${selectedVariant === 'black' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'}`}
                >
                  Black Version
                </button>
                
                <button
                  type="button"
                  disabled
                  className="py-2 px-3 text-xs font-medium rounded-xl border bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60"
                  title="Temporarily Disabled"
                >
                  General Version (Off)
                </button>
                <button
                  type="button"
                  disabled
                  className="py-2 px-3 text-xs font-medium rounded-xl border bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60"
                  title="Temporarily Disabled"
                >
                  Tong Version (Off)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">News Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#800020]"
              >
                <option value="NATIONAL">National {langMode === 'BN' ? '(জাতীয়)' : ''}</option>
                <option value="INTERNATIONAL">International {langMode === 'BN' ? '(আন্তর্জাতিক)' : ''}</option>
                <option value="SPORTS">Sports {langMode === 'BN' ? '(খেলাধুলা)' : ''}</option>
                <option value="POLITICS">Politics {langMode === 'BN' ? '(রাজনীতি)' : ''}</option>
                <option value="ECONOMY">Economy {langMode === 'BN' ? '(অর্থনীতি)' : ''}</option>
                <option value="SOCIAL">Social {langMode === 'BN' ? '(সমাজ)' : ''}</option>
              </select>
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
                    title="Highlight Selected Text Color"
                  >
                    <Type className="h-3.5 w-3.5 text-amber-500 stroke-[3]" />
                    <span className="text-[10px] font-bold text-stone-500">Color</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyStyleToSelection('i')}
                    className="p-1.5 rounded-md hover:bg-white text-stone-700 transition"
                    title="Make Selection Italic"
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
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#800020] leading-relaxed resize-none font-mono text-xs"
                placeholder="Highlight words and click Color or Italic to style..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Sub-Headline Text / Summary</label>
              <textarea
                rows={3}
                value={subHeadline}
                onChange={(e) => setSubHeadline(e.target.value)}
                maxLength={200}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#800020] leading-relaxed resize-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Photo Credit</label>
              <input
                type="text"
                value={photoCredit}
                onChange={(e) => setPhotoCredit(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#800020]"
              />
            </div>

            <div className="border-t border-stone-200 pt-4 space-y-3">
              <button
                type="button"
                onClick={handleGenerateCaption}
                disabled={isAiLoading}
                className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 disabled:from-stone-400 disabled:to-stone-400 text-white py-3 px-4 rounded-xl font-semibold text-sm shadow-md transition flex items-center justify-center space-x-2"
              >
                {isAiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>{isAiLoading ? 'AI Searching & Writing...' : 'Generate AI Caption (Live Search)'}</span>
              </button>

              {generatedCaption && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 relative group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-purple-700 tracking-wider uppercase flex items-center space-x-1">
                      <Sparkles className="h-3 w-3" /> <span>AI Generated Caption</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCaption}
                      className="p-1.5 bg-white text-purple-600 hover:bg-purple-100 rounded-lg transition border border-purple-200 shadow-sm"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-stone-700 whitespace-pre-line leading-relaxed">
                    {generatedCaption}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COL: LIVE CANVAS PREVIEW */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="w-full flex flex-col items-center">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center space-x-2 mb-3 self-start lg:ml-12">
                <Eye className="h-3.5 w-3.5 text-[#800020]" />
                <span>Live Scaled Canvas Preview (4:5 Ratio)</span>
              </span>

              <div className="w-[360px] h-[450px] relative border border-stone-300 rounded-2xl shadow-2xl overflow-hidden bg-stone-900">
                <div 
                  className="w-[1080px] h-[1350px] absolute top-0 left-0 origin-top-left flex flex-col justify-end select-none bg-stone-950"
                  style={{ transform: 'scale(0.333333)' }}
                >
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="News graphic" 
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-600 font-mono text-2xl space-y-4">
                      <ImageIcon className="h-24 w-24 text-stone-800 stroke-[1]" />
                      <span>NO COVER IMAGE LOADED</span>
                    </div>
                  )}

                  {photoCredit && (
                    <div className="absolute top-10 left-10 z-20 text-white/80 text-xl font-medium tracking-wide drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] bg-black/30 px-4 py-1.5 rounded-lg backdrop-blur-sm">
                      {photoCredit}
                    </div>
                  )}

                  <div 
                    className={`w-full pt-96 pb-16 px-14 relative z-10 flex flex-col justify-end ${
                      selectedVariant === 'white' 
                        ? 'bg-gradient-to-t from-white via-white/98 to-transparent text-stone-950' 
                        : 'bg-gradient-to-t from-[#090d14] via-[#090d14]/98 to-transparent text-white'
                    }`}
                  >
                    <div className="text-[#c1121f] font-black text-4xl uppercase tracking-wider mb-3">
                      {getCategoryLabel(category)}
                    </div>
                    
                    <div className="text-xl font-medium tracking-wide mb-6 opacity-70">
                      {getDynamicDate()}
                    </div>

                    <h2 className="text-[52px] font-extrabold leading-[1.35] tracking-wide text-left mb-6 font-sans whitespace-pre-wrap">
                      {renderStyledPreviewText(headline)}
                    </h2>

                    <p className="text-2xl leading-relaxed text-left opacity-80 font-normal line-clamp-2 mb-10">
                      {subHeadline}
                    </p>

                    <div className="flex items-center justify-end pt-6 border-t border-stone-500/30">
                      <div className="relative h-14 w-full flex justify-end">
                        <img 
                          src="/logo2.png" 
                          alt="Layout Branding Asset" 
                          className={`h-14 object-contain ${
                            selectedVariant === 'white' 
                              ? 'brightness-0 opacity-90' 
                              : 'brightness-0 invert'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />
                </div>
              </div>

              <p className="text-center text-xs text-stone-400 font-mono mt-4">
                Output Frame Matrix: 1080 × 1350 pixels (Standard 4:5 Feed Layout)
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
