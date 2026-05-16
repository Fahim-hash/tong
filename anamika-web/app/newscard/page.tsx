'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Download, RefreshCw, Eye, Image as ImageIcon } from 'lucide-react';
import { toPng } from 'html-to-image';

type Category = 'NATIONAL' | 'INTERNATIONAL' | 'SPORTS' | 'POLITICS' | 'ECONOMY' | 'SOCIAL';
type Variant = 'white' | 'black' | 'general' | 'tong';

export default function NewsCardGenerator() {
  // Input Form States
  const [category, setCategory] = useState<Category>('NATIONAL');
  const [headline, setHeadline] = useState('এখানে আপনার ব্রেকিং নিউজ বা আকর্ষণীয় মূল হেডলাইনটি লিখুন');
  const [subHeadline, setSubHeadline] = useState('এখানে সংবাদের বিস্তারিত বা একটি ছোট উপ-শিরোনাম যোগ করুন যা সংবাদের মূল বিষয়বস্তুকে ফুটিয়ে তুলবে।');
  const [photoCredit, setPhotoCredit] = useState('ছবি: টংয়েরখবর');
  const [selectedVariant, setSelectedVariant] = useState<Variant>('black');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  const handleDownloadCard = async () => {
    if (cardRef.current === null) return;
    setIsExporting(true);
    
    try {
      // 1080x1350 output render profile
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 1, // 1080x1350 output relies directly on raw block metrics now
      });
      
      const link = document.createElement('a');
      link.download = `TongerKhobor-${category}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Oops, something went wrong with compression!', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getCategoryLabel = (cat: Category) => {
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
                <option value="NATIONAL">National (জাতীয়)</option>
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
          </div>

          {/* --- RIGHT COL: LIVE CANVAS ENGINE PREVIEW (Responsive Scale Grid) --- */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="w-full flex flex-col items-center">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center space-x-2 mb-3 self-start lg:ml-12">
                <Eye className="h-3.5 w-3.5 text-[#800020]" />
                <span>Live Scaled Canvas Preview (4:5 Ratio)</span>
              </span>

              {/* Viewport scaling wrapper to cleanly hold 1080x1350 node inside web viewport grids */}
              <div className="w-[360px] h-[450px] relative border border-stone-300 rounded-2xl shadow-2xl overflow-hidden bg-stone-900">
                
                {/* Real Output Canvas Node: Absolute 1080x1350 scaled to 0.3333 match viewports */}
                <div 
                  ref={cardRef}
                  className="w-[1080px] h-[1350px] absolute top-0 left-0 origin-top-left flex flex-col justify-end select-none bg-stone-950"
                  style={{ transform: 'scale(0.333333)' }}
                >
                  {/* Photo Cover Asset Layer */}
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

                  {/* Top-Left Absolute Credit Tag */}
                  {photoCredit && (
                    <div className="absolute top-10 left-10 z-20 text-white/80 text-xl font-medium tracking-wide drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] bg-black/30 px-4 py-1.5 rounded-lg backdrop-blur-sm">
                      {photoCredit}
                    </div>
                  )}

                  {/* Dynamic Dark Gradient Backdrop Cover for Text visibility */}
                  <div 
                    className={`w-full pt-80 pb-16 px-14 relative z-10 flex flex-col justify-end ${
                      selectedVariant === 'white' 
                        ? 'bg-gradient-to-t from-white via-white/95 to-transparent text-stone-950' 
                        : 'bg-gradient-to-t from-[#090d14] via-[#090d14]/95 to-transparent text-white'
                    }`}
                  >
                    {/* Category Label */}
                    <div className="text-[#c1121f] font-black text-4xl uppercase tracking-wider mb-3">
                      {getCategoryLabel(category)}
                    </div>
                    
                    {/* Time Stamp */}
                    <div className="text-xl font-medium tracking-wide mb-6 opacity-70">
                      {getBanglaDate()}
                    </div>

                    {/* Bold Standard News Headline */}
                    <h2 className="text-[52px] font-extrabold leading-[1.25] tracking-wide text-left mb-6 font-sans">
                      {headline || 'শিরোনাম অনুপস্থিত...'}
                    </h2>

                    {/* Subhead Context Lines */}
                    <p className="text-2xl leading-relaxed text-left opacity-80 font-normal line-clamp-3 mb-10">
                      {subHeadline}
                    </p>

                    {/* Footer Identity row layout */}
                    <div className="flex items-center justify-between pt-8 border-t border-stone-500/30">
                      <span className="text-lg font-semibold text-stone-400 font-mono uppercase tracking-widest">
                        TongerKhobor Digital Network
                      </span>
                      
                      {/* Brand Dynamic Asset */}
                      <div className="relative h-14 w-48">
                        <Image 
                          src="/logo2.png" 
                          alt="Layout Branding Asset" 
                          fill
                          priority
                          className={`object-contain ${selectedVariant === 'black' ? 'brightness-0 invert' : ''}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Top blend bar shadow */}
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
