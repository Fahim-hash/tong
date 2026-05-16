// app/page.tsx
import React from 'react';
import Link from 'next/link';
import { Newspaper, LayoutDashboard, FilePlus2, Users, Settings, ArrowRight } from 'lucide-react';

export default function InternalDashboard() {
  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 flex flex-col">
      
      {/* --- NAVBAR --- */}
      <nav className="bg-[#800020] text-white shadow-lg border-b border-maroon-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo Section */}
            <div className="flex items-center space-x-3">
              <div className="bg-white text-[#800020] p-2 rounded-lg font-black text-xl tracking-tighter shadow-inner">
                TK
              </div>
              <div>
                <span className="font-bold text-lg tracking-wide block leading-none">TongerKhobor</span>
                <span className="text-xs text-stone-300 tracking-widest uppercase">Internal Portal</span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">Internal Member</p>
                <p className="text-xs text-stone-300">Desk Editor</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-maroon-800 border border-stone-400 flex items-center justify-center font-bold text-white">
                M
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* --- MAIN BODY --- */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#600018] to-[#800020] text-white rounded-2xl p-6 sm:p-8 shadow-xl mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Welcome Back, Team! ☕</h1>
          <p className="text-stone-200 text-sm sm:text-base max-w-2xl">
            Access your internal tools, manage upcoming publications, and generate media assets efficiently from this centralized control panel.
          </p>
        </div>

        {/* --- MAIN ACTION SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Highlighted Tool: News Card Generator */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-md border border-stone-200/80 flex flex-col justify-between transform transition duration-300 hover:shadow-lg">
            <div>
              <div className="h-12 w-12 bg-[#800020]/10 rounded-xl flex items-center justify-center text-[#800020] mb-4">
                <Newspaper className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-stone-900 mb-2">News Card Generator</h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-6">
                Instantly generate automated news banners or graphical social media cards. Add your custom title, headline graphics, and backgrounds effortlessly within seconds.
              </p>
            </div>
            
            {/* Button directing to generator page */}
            <Link href="/newscard">
              <button className="w-full sm:w-auto bg-[#800020] hover:bg-[#600018] text-white font-semibold px-6 py-3 rounded-xl shadow-md transition duration-200 flex items-center justify-center space-x-2 group">
                <span>Generate News Card</span>
                <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>

          {/* Quick Shortcuts / Info Panel */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-stone-200/80 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center space-x-2">
                <LayoutDashboard className="h-5 w-5 text-[#800020]" />
                <span>Quick Actions</span>
              </h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-left text-sm font-medium transition">
                  <FilePlus2 className="h-4 w-4 text-stone-600" />
                  <span>Draft New Article</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-left text-sm font-medium transition">
                  <Users className="h-4 w-4 text-stone-600" />
                  <span>Team Directory</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-left text-sm font-medium transition">
                  <Settings className="h-4 w-4 text-stone-600" />
                  <span>System Settings</span>
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 text-center">
              <span className="text-xs text-stone-400 font-mono">v2.1.0-internal</span>
            </div>
          </div>

        </div>

      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-stone-900 text-stone-400 py-6 text-center text-xs border-t border-stone-800">
        <p>&copy; {new Date().getFullYear()} TongerKhobor. All rights reserved. Internal Use Only.</p>
      </footer>

    </div>
  );
}
