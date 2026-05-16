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
  const [headline, setHeadline] = useState('এখানে আপনার ব্রেকিং নিউজ বা আকর্ষণীয় হেডলাইনটি লিখুন');
  const [photoCredit, setPhotoCredit] = useState('ছবি: টংয়েরখবর');
  const [selectedVariant, setSelectedVariant] = useState<Variant>('white');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // Handle local system image upload for news asset
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

  // Trigger HTML to PNG Image download trigger
  const handleDownloadCard = async () => {
    if (cardRef.current === null) return;
    setIsExporting(true);
    
    try {
      // Ensure local dynamic image styles process cleanly 
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // Retains high fidelity density matching template mockups
      });
      
      const link = document.createElement('a');
      link.download = `TongerKhobor-${category}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Oops, something went wrong with element compression!', error);
    } finally {
      setIsExporting(false);
    }
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
              <p className="text-xs text-stone-500">Create automated internal social banners</p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- LEFT COL: FORM INTERFACES CONTROLS (5 Cols) --- */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-6">
            <h2 className="text-sm font-bold text-stone-900 tracking-wider uppercase border-b border-stone-100 pb-3">Card Customizer</h2>
            
            {/* Card Variant Template Mode Switcher */}
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
                  title="Under maintenance"
                >
                  <span>General Mode</span>
                  <span className="text-[9px] bg-stone-200 px-1.5 py-0.2 rounded text-stone-500 font-mono">OFF</span>
                </button>
                <button
                  type="button"
                  disabled
                  className="py-2 px-3 text-xs font-medium rounded-xl border bg-stone-50 text-stone-400 border-stone-200 cursor-not-allowed flex items-center justify-center space-x-1"
                  title="Under maintenance"
                >
                  <span>Tong Version</span>
                  <span className="text-[9px] bg-stone-200 px-1.5 py-0.2 rounded text-stone-500 font-mono">OFF</span>
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

            {/* Media Asset Image upload */}
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
                  <span className="text-xs font-medium">Click to select file content image</span>
                  <span className="text-[10px] text-stone-400 font-mono">PNG, JPG, WEBP assets</span>
                </div>
              </div>
            </div>

            {/* Headline input field */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Headline Banner Text</label>
              <textarea
                rows={3}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={140}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#800020] leading-relaxed resize-none"
                placeholder="শিরোনামটি টাইপ করুন..."
              />
              <span className="text-[10px] text-stone-400 font-mono float-right mt-1">{headline.length}/140 characters</span>
            </div>

            {/* Image Credit string input field */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Photo Credit Attribution</label>
              <input
                type="text"
                value={photoCredit}
                onChange={(e) => setPhotoCredit(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#800020]"
                placeholder="যেমন, ছবি: সংগৃহীত"
              />
            </div>
          </div>

          {/* --- RIGHT COL: LIVE CANVAS ENGINE PREVIEW (7 Cols) --- */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full max-w-md sticky top-24">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center space-x-2 mb-3">
                <Eye className="h-3.5 w-3.5 text-[#800020]" />
                <span>Live WYSIWYG Canvas Preview</span>
              </span>

              {/* Render Wrapper Node targeted by html-to-image converter */}
              <div 
                ref={cardRef}
                className={`w-[450px] h-[580px] flex flex-col justify-between shadow-2xl overflow-hidden relative font-sans transition-all duration-300 select-none bg-white`}
                style={{ minWidth: '450px', minHeight: '580px' }}
              >
                
                {/* UP-SECTION: Asset Image Area Cover box config */}
                <div className="w-full h-[330px] relative bg-stone-900 overflow-hidden flex items-center justify-center group">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="News visual setup" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="text-stone-500 text-xs font-mono tracking-wider flex flex-col items-center space-y-2">
                      <ImageIcon className="h-10 w-10 text-stone-700 stroke-[1.2]" />
                      <span>NO COVER IMAGE SELECTED</span>
                    </div>
                  )}

                  {/* Dynamic Photo Credit absolute indicator inside graphic */}
                  {photoCredit && (
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded text-[10px] font-medium tracking-wide">
                      {photoCredit}
                    </div>
                  )}
                </div>

                {/* BOTTOM-SECTION: Theme Custom dynamic content card structure */}
                <div 
                  className={`w-full h-[250px] p-6 flex flex-col justify-between relative border-t-4 ${
                    selectedVariant === 'black' 
                      ? 'bg-[#121212] border-[#800020] text-white' 
                      : 'bg-white border-[#800020] text-stone-950'
                  }`}
                >
                  {/* Category string text flag configuration mapping */}
                  <div>
                    <span className="text-[11px] font-black tracking-widest text-[#800020] bg-[#800020]/10 px-2.5 py-1 rounded-md uppercase">
                      {category}
                    </span>
                    
                    {/* Render targeted Bangla input layout text headline */}
                    <h2 className="text-xl font-bold leading-snug mt-4 text-justify tracking-wide font-sans line-clamp-4">
                      {headline || 'শিরোনাম অনুপস্থিত...'}
                    </h2>
                  </div>

                  {/* Brand signature branding assets baseline anchor */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/20">
                    <span className="text-[10px] font-semibold text-stone-400 font-mono uppercase tracking-widest">
                      Internal Wire Network
                    </span>
                    
                    {/* Secondary PNG branding configuration requested structure */}
                    <div className="relative h-7 w-24">
                      <Image 
                        src="/logo2.png" 
                        alt="TongerKhobor Layout Asset" 
                        fill
                        priority
                        className={`object-contain ${selectedVariant === 'black' ? 'brightness-0 invert' : ''}`}
                      />
                    </div>
                  </div>
                </div>

              </div>
              <p className="text-center text-xs text-stone-400 font-mono mt-4">Canvas Target Spec: 450x580 pixels (High Density DPI output)</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
