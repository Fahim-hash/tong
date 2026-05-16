"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Camera, Sliders, Type, RotateCcw, LayoutDashboard } from 'lucide-react';

export default function TongerKhoborEnglishUI() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // --- Content States (Supports Bangla/English) ---
  const [headline, setHeadline] = useState('টংগেরখবর-এর নতুন এআই ভিত্তিক নিউজ জেনারেটর এখন সবার জন্য উন্মুক্ত');
  const [subHeadline, setSubHeadline] = useState('উন্নত গ্রাফিক্স এবং কাস্টমাইজেশন ফিচারের মাধ্যমে এখন যেকোনো সংবাদ মুহূর্তেই কার্ড আকারে প্রকাশ করা সম্ভব।');
  const [category, setCategory] = useState('আন্তর্জাতিক');
  const [date, setDate] = useState('মে ১৪, ২০২৬');
  const [credit, setCredit] = useState('ছবি: সংগৃহীত/টংগেরখবর');
  
  // --- Image Configuration States ---
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);
  const [imgConfig, setImgConfig] = useState({ zoom: 1.1, x: 0, y: 0, bright: 100 });

  // --- Canvas Rendering Engine ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Standard High-Res Portrait Aspect Ratio (4:5)
    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;

    // 1. Dark Base Background Color
    ctx.fillStyle = '#0a0f1d'; 
    ctx.fillRect(0, 0, W, H);

    // 2. Main Image Rendering (Top Area)
    const imgHeight = 920; 
    if (imgObj) {
      ctx.save();
      ctx.rect(0, 0, W, imgHeight);
      ctx.clip();
      
      ctx.filter = `brightness(${imgConfig.bright}%)`;
      const ratio = imgObj.width / imgObj.height;
      let dW = W * imgConfig.zoom;
      let dH = (W / ratio) * imgConfig.zoom;
      
      ctx.drawImage(imgObj, (W - dW) / 2 + imgConfig.x, (imgHeight - dH) / 2 + imgConfig.y, dW, dH);
      ctx.restore();

      // 3. Smooth Dense Gradient Overlay (For clear typography readability)
      const grad = ctx.createLinearGradient(0, 450, 0, imgHeight);
      grad.addColorStop(0, 'rgba(10, 15, 29, 0)');
      grad.addColorStop(0.6, 'rgba(10, 15, 29, 0.8)');
      grad.addColorStop(1, '#0a0f1d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 450, W, imgHeight - 450 + 5);
    }

    // 4. Photo Credits
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '24px Arial, "SolaimanLipi", sans-serif';
    ctx.fillText(credit, 50, 60);

    // 5. Typography Layout Engine (Fully optimized for Bangla vowel signs/Kar-phola)
    const margin = 70;
    let textY = 930;

    // Category Badge
    ctx.fillStyle = '#f43f5e'; 
    ctx.font = 'bold 42px Arial, "SolaimanLipi", sans-serif';
    ctx.fillText(category, margin, textY);

    // Date
    textY += 60;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '32px Arial, "SolaimanLipi", sans-serif';
    ctx.fillText(date, margin, textY);

    // Headline (Auto-wrapping multi-line calculation)
    textY += 100;
    ctx.fillStyle = '#ffffff';
    const hSize = 72;
    ctx.font = `bold ${hSize}px Arial, "SolaimanLipi", sans-serif`;
    
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

    const headlineLines = wrapText(headline, W - (margin * 2));
    headlineLines.forEach((line) => {
      ctx.fillText(line, margin, textY);
      textY += hSize * 1.3; // Added extra line-height spacing for complex Bangla characters
    });

    // Subheadline / Summary Text
    textY += 20;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '38px Arial, "SolaimanLipi", sans-serif';
    const subLines = wrapText(subHeadline, W - (margin * 2));
    subLines.forEach((line) => {
      ctx.fillText(line, margin, textY);
      textY += 58;
    });

  }, [headline, subHeadline, category, date, credit, imgObj, imgConfig]);

  useEffect(() => { draw(); }, [draw]);

  // --- Handlers ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImgObj(img);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `tongerkhobor-card-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export Error:", err);
      alert("Something went wrong while exporting the image. Please try again.");
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans antialiased text-slate-200">
      
      {/* --- Control Sidebar (Full English UI) --- */}
      <aside className="w-[450px] bg-zinc-900 border-r border-zinc-800 p-8 flex flex-col gap-8 overflow-y-auto select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center font-black text-white shadow-md shadow-rose-600/20">TK</div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none">TONGER KHOBOR</h1>
            <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">Creator Studio Pro</span>
          </div>
        </div>

        {/* Section: Editorial Data */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <Type size={14}/> <span>Editorial Content</span>
          </div>
          
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">Category</label>
            <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700/60 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-rose-600 transition-all text-sm font-medium" placeholder="e.g., আন্তর্জাতিক" />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">Date Stamp</label>
            <input type="text" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700/60 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-rose-600 transition-all text-sm font-medium" placeholder="e.g., মে ১৪, ২০২৬" />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">Main Headline</label>
            <textarea value={headline} onChange={e => setHeadline(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700/60 p-3 rounded-xl text-white outline-none h-28 text-sm font-bold tracking-wide resize-none focus:ring-2 focus:ring-rose-600 transition-all" placeholder="Enter headline in Bangla or English..." />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">Sub-headline / Summary</label>
            <textarea value={subHeadline} onChange={e => setSubHeadline(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700/60 p-3 rounded-xl text-zinc-300 outline-none h-24 text-sm resize-none focus:ring-2 focus:ring-rose-600 transition-all" placeholder="Enter sub-headline context..." />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">Photo Credits</label>
            <input type="text" value={credit} onChange={e => setCredit(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700/60 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-rose-600 transition-all text-sm" placeholder="e.g., ছবি: সংগৃহীত" />
          </div>
        </div>

        {/* Section: Media Controls */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <LayoutDashboard size={14}/> <span>Media Controls</span>
          </div>
          
          <button onClick={() => fileInput.current?.click()} className="w-full bg-white text-black py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-md">
            <Camera size={18}/> UPLOAD COVER PHOTO
          </button>
          <input type="file" ref={fileInput} hidden accept="image/*" onChange={handleImageUpload} />

          {imgObj && (
            <div className="bg-zinc-800/40 p-5 rounded-2xl border border-zinc-800 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-400 font-bold tracking-wide">
                  <span>CANVAS ZOOM</span>
                  <span className="text-rose-500">{Math.round(imgConfig.zoom * 100)}%</span>
                </div>
                <input type="range" min="0.5" max="3" step="0.01" value={imgConfig.zoom} onChange={e => setImgConfig(s => ({...s, zoom: parseFloat(e.target.value)}))} className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-rose-600" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-400 font-bold tracking-wide">
                  <span>BRIGHTNESS</span>
                  <span className="text-amber-500">{imgConfig.bright}%</span>
                </div>
                <input type="range" min="50" max="150" value={imgConfig.bright} onChange={e => setImgConfig(s => ({...s, bright: parseInt(e.target.value)}))} className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button 
          onClick={triggerDownload}
          className="mt-auto w-full bg-rose-600 text-white py-4 rounded-xl font-extrabold text-base tracking-wide shadow-lg shadow-rose-950/40 hover:bg-rose-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Download size={18}/> EXPORT ULTRA HD IMAGE
        </button>
      </aside>

      {/* --- Real-Time Studio Canvas Preview Area --- */}
      <main className="flex-1 bg-[#05060e] flex items-center justify-center p-12 relative">
        <div className="absolute top-6 left-6 flex items-center gap-2 bg-zinc-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-800">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Live Studio Monitor</span>
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-4 bg-rose-600/5 rounded-[3rem] blur-3xl group-hover:bg-rose-600/10 transition-all duration-1000"></div>
          <div className="relative bg-zinc-900 p-2.5 rounded-[2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] border border-zinc-800">
            <canvas 
              ref={canvasRef} 
              style={{ width: '430px', height: 'auto', aspectRatio: '1080/1350' }}
              className="rounded-[1.4rem]"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
