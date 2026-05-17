'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Download, RefreshCw, Eye, Image as ImageIcon, Sparkles, Copy, Check } from 'lucide-react';

type Category = 'NATIONAL' | 'INTERNATIONAL' | 'SPORTS' | 'POLITICS' | 'ECONOMY' | 'SOCIAL';
type Variant = 'white' | 'black' | 'general' | 'tong';

export default function NewsCardGenerator() {
  // Input Form States
  const [category, setCategory] = useState<Category>('NATIONAL');
  const [headline, setHeadline] = useState('এখানে আপনার ব্রেকিং নিউজ বা আকর্ষণীয় মূল হেডলাইনটি লিখুন');
  const [subHeadline, setSubHeadline] = useState('এখানে সংবাদের বিস্তারিত বা একটি ছোট উপ-শিরোনাম যোগ করুন যা সংবাদের মূল বিষয়বস্তুকে ফুটিয়ে তুলবে।');
  const [photoCredit, setPhotoCredit] = useState('ছবি: টংয়েরখবর');
  const [selectedVariant, setSelectedVariant] = useState<Variant>('black');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // AI Caption States
  const [generatedCaption, setGeneratedCaption] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // Helper function to get current date in Bengali
  const getBanglaDate = () => {
    const date = new Date();
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

  // Safe Canvas Base-Download Engine (Fix for html-to-image failure)
  const handleDownloadCard = () => {
    setIsExporting(true);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    // Set standard High-Res dimensions matching your element frame
    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;

    // 1. Draw Fallback/Base Background
    ctx.fillStyle = selectedVariant === 'white' ? '#ffffff' : '#090d14';
    ctx.fillRect(0, 0, W, H);

    const drawTextAndLayers = () => {
      // 2. Draw Bottom Mask Gradient (Matches standard layout overlay)
      const grad = ctx.createLinearGradient(0, H - 900, 0, H);
      if (selectedVariant === 'white') {
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(1, '#ffffff');
      } else {
        grad.addColorStop(0, 'rgba(9, 13, 20, 0)');
        grad.addColorStop(0.3, 'rgba(9, 13, 20, 0.95)');
        grad.addColorStop(1, '#090d14');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, H - 900, W, 900);

      // Top Shadow Overlay
      const topGrad = ctx.createLinearGradient(0, 0, 0, 160);
      topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
      topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, W, 160);

      // 3. Render Photo Credits (Top Left Box Overlay)
      if (photoCredit) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.font = '500 20px Arial, sans-serif';
        const textWidth = ctx.measureText(photoCredit).width;
        
        // Draw small background for text
        ctx.beginPath();
        ctx.roundRect(40, 40, textWidth + 32, 45, 8);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(photoCredit, 56, 70);
      }

      // 4. Content Typography Data Calculations
      const margin = 56;
      let textY = 910;

      // Category Block
      ctx.fillStyle = '#c1121f';
      ctx.font = '900 36px Arial, sans-serif';
      ctx.fillText(getCategoryLabel(category), margin, textY);

      // Date Block
      textY += 55;
      ctx.fillStyle = selectedVariant === 'white' ? '#444444' : '#94a3b8';
      ctx.font = '500 22px Arial, sans-serif';
      ctx.fillText(getBanglaDate(), margin, textY);

      // Headline Engine with multi-line auto-wrap tracking
      textY += 95;
      ctx.fillStyle = selectedVariant === 'white' ? '#0c0a09' : '#ffffff';
      const hSize = 52;
      ctx.font = `800 ${hSize}px Arial, sans-serif`;

      const wrapText = (text: string, maxWidth: number) => {
        const words = text.split(' ');
        let lines = [];
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

      const headlineLines = wrapText(headline || 'শিরোনাম অনুপস্থিত...', W - (margin * 2));
      headlineLines.forEach((line) => {
        ctx.fillText(line, margin, textY);
        textY += hSize * 1.3;
      });

      // Subheadline System
      textY += 15;
      ctx.fillStyle = selectedVariant === 'white' ? '#292524' : '#cbd5e1';
      ctx.font = '400 24px Arial, sans-serif';
      const subLines = wrapText(subHeadline, W - (margin * 2));
      subLines.slice(0, 3).forEach((line) => { // Maximum 3 vertical line clamp
        ctx.fillText(line, margin, textY);
        textY += 38;
      });

      // Bottom Metadata Row Base Line
      ctx.strokeStyle = 'rgba(120, 120, 120, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin, H - 120);
      ctx.lineTo(W - margin, H - 120);
      ctx.stroke();

      // Meta Network Branding Text
      ctx.fillStyle = '#a8a29e';
      ctx.font = '600 18px monospace';
      ctx.fillText("TONGERKHOBOR DIGITAL NETWORK", margin, H - 70);

      // 5. Draw Dynamic Branding Assets / Logos Safely
      const logoImg = new window.Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.src = "/logo2.png";
      logoImg.onload = () => {
        // Create an offscreen canvas to process filters/invert adjustments
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = logoImg.width;
        offscreenCanvas.height = logoImg.height;
        const oCtx = offscreenCanvas.getContext('2d');
        
        if (oCtx) {
          oCtx.drawImage(logoImg, 0, 0);
          if (selectedVariant === 'black') {
            // Apply programmatical layout invert rules for clear white matching
            oCtx.globalCompositeOperation = 'difference';
            oCtx.fillStyle = 'white';
            oCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
          }
          
          const logoW = 192;
          const logoH = 56;
          ctx.drawImage(offscreenCanvas, W - margin - logoW, H - 98, logoW, logoH);
        }

        // Finalize Download Event Dispatcher
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `TongerKhobor-${category}-${Date.now()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExporting(false);
      };

      logoImg.onerror = () => {
        // In case logo path misses or gives 404, download still completes securely
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `TongerKhobor-${category}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        setIsExporting(false);
      };
    };

    // Process main cover photo rendering with precise cover cropping metrics
    if (imagePreview) {
      const mainImg = new window.Image();
      mainImg.src = imagePreview;
      mainImg.onload = () => {
        const imgRatio = mainImg.width / mainImg.height;
        const canvasRatio = W / H;
        let dW = W, dH = H, sx = 0, sy = 0;

        if (imgRatio > canvasRatio) {
          dW = H * imgRatio;
          sx = (dW - W) / 2;
        } else {
          dH = W / imgRatio;
        }

        ctx.drawImage(mainImg, -sx, 0, dW, dH);
        drawTextAndLayers();
      };
    } else {
      drawTextAndLayers();
    }
  };

  // AI Caption Generator Function
  const handleGenerateCaption = async () => {
    if (!headline || headline === 'এখানে আপনার ব্রেকিং নিউজ বা আকর্ষণীয় মূল হেডলাইনটি লিখুন') {
      alert('দয়া করে আগে একটি নিউজ হেডলাইন লিখুন।');
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
        }),
      });

      const data = await res.json();
      if (data.caption) {
        setGeneratedCaption(data.caption);
      } else {
        setGeneratedCaption('ক্যাপশন জেনারেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
    } catch (error) {
      console.error(error);
      setGeneratedCaption('সার্ভার ত্রুটি! আবার চেষ্টা করুন।');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyCaption = () => {
    if (!generatedCaption) return;
    navigator.clipboard.writeText(generatedCaption);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getCategoryLabel = (cat: Category) => {
    const labels = {
      NATIONAL: 'জাতীয়',
      INTERNATIONAL: 'আন্তর্জাতিক',
      SPORTS: 'খেলাধুলা',
      POLITICS: 'রাজনীতি',
      ECONOMY: 'অর্থনীতি',
      SOCIAL: 'সমাজ'
    };
    return labels[cat];
  };

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-800 pb-12">
      {/* Top Header Controls bar */}
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
          
          {/* --- LEFT COL: FORM INTERFACES CONTROLS --- */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-5">
            <h2 className="text-sm font-bold text-stone-900 tracking-wider uppercase border-b border-stone-100 pb-3">Card Customizer</h2>
            
            {/* Template Variant Switcher */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Card Style Template</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVariant('white')}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition ${selectedVariant === 'white' ? 'bg-[#800020] text-white border-[#800020]' : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'}`}
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
                  className="py-2 px-3 text-xs font-medium rounded-xl border bg-stone-50 text-stone-400 border-stone-200 cursor-not-allowed flex items-center justify-center space-x-1"
                >
                  <span>General Mode (OFF)</span>
                </button>
                <button
                  type="button"
                  disabled
                  className="py-2 px-3 text-xs font-medium rounded-xl border bg-stone-50 text-stone-400 border-stone-200 cursor-not-allowed flex items-center justify-center space-x-1"
                >
                  <span>Tong Version (OFF)</span>
                </button>
              </div>
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">News Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#800020]"
              >
                <option value="NATIONAL">National (জাতীয়)</option>
                <option value="INTERNATIONAL">International (আন্তর্জাতিক)</option>
                <option value="SPORTS">Sports (খেলাধুলা)</option>
                <option value="POLITICS">Politics (রাজনীতি)</option>
                <option value="ECONOMY">Economy (অর্থনীতি)</option>
                <option value="SOCIAL">Social (সমাজ)</option>
              </select>
            </div>

            {/* Media Image upload */}
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

            {/* Headline Input */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Headline Text</label>
              <textarea
                rows={3}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={140}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#800020] leading-relaxed resize-none"
              />
            </div>

            {/* Subhead Input */}
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

            {/* Photo Credit */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Photo Credit</label>
              <input
                type="text"
                value={photoCredit}
                onChange={(e) => setPhotoCredit(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#800020]"
              />
            </div>

            {/* --- AI CAPTION GENERATOR BUTTON & DISPLAY --- */}
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

          {/* --- RIGHT COL: LIVE CANVAS ENGINE PREVIEW --- */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="w-full flex flex-col items-center">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center space-x-2 mb-3 self-start lg:ml-12">
                <Eye className="h-3.5 w-3.5 text-[#800020]" />
                <span>Live Scaled Canvas Preview (4:5 Ratio)</span>
              </span>

              <div className="w-[360px] h-[450px] relative border border-stone-300 rounded-2xl shadow-2xl overflow-hidden bg-stone-900">
                
                <div 
                  ref={cardRef}
                  className="w-[1080px] h-[1350px] absolute top-0 left-0 origin-top-left flex flex-col justify-end select-none bg-stone-950"
                  style={{ transform: 'scale(0.333333)' }}
                >
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="News graphic" 
                      className="absolute inset-0 w-full h-full object-cover object-top"
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
                    className={`w-full pt-80 pb-16 px-14 relative z-10 flex flex-col justify-end ${
                      selectedVariant === 'white' 
                        ? 'bg-gradient-to-t from-white via-white/95 to-transparent text-stone-950' 
                        : 'bg-gradient-to-t from-[#090d14] via-[#090d14]/95 to-transparent text-white'
                    }`}
                  >
                    <div className="text-[#c1121f] font-black text-4xl uppercase tracking-wider mb-3">
                      {getCategoryLabel(category)}
                    </div>
                    
                    <div className="text-xl font-medium tracking-wide mb-6 opacity-70">
                      {getBanglaDate()}
                    </div>

                    <h2 className="text-[52px] font-extrabold leading-[1.25] tracking-wide text-left mb-6 font-sans">
                      {headline || 'শিরোনাম অনুপস্থিত...'}
                    </h2>

                    <p className="text-2xl leading-relaxed text-left opacity-80 font-normal line-clamp-3 mb-10">
                      {subHeadline}
                    </p>

                    <div className="flex items-center justify-between pt-8 border-t border-stone-500/30">
                      <span className="text-lg font-semibold text-stone-400 font-mono uppercase tracking-widest">
                        TongerKhobor Digital Network
                      </span>
                      
                      <div className="relative h-14 w-48">
                        <Image 
                          src="/logo2.png" 
                          alt="Layout Branding Asset" 
                          fill
                          priority
                          unoptimized
                          className={`object-contain ${selectedVariant === 'black' ? 'brightness-0 invert' : ''}`}
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
