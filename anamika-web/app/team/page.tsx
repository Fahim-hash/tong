'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Github, Linkedin, Globe, Mail, Search, Sparkles } from 'lucide-react';

type RoleCategory = 'ALL' | 'EDITORIAL' | 'CREATIVE' | 'TECH' | 'MANAGEMENT';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  category: RoleCategory;
  image: string;
  email?: string;
  github?: string;
  linkedin?: string;
  website?: string;
}

export default function TongerKhoborTeam() {
  const [activeTab, setActiveTab] = useState<RoleCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // টংয়েরখবর টিম মেম্বার ডেটা
  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: 'Syed Fahim Muddasir',
      role: 'Lead Developer & Creative Director',
      category: 'TECH',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400',
      email: 'fahim@tongerkhobor.com',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      website: 'https://portfolio.com'
    },
    {
      id: 2,
      name: 'Shahela (Meghboti)',
      role: 'Chief Management & PR Executive',
      category: 'MANAGEMENT',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400&h=400',
      email: 'shahela@tongerkhobor.com',
      linkedin: 'https://linkedin.com'
    },
    {
      id: 3,
      name: 'Rahat Ahmed',
      role: 'Senior Graphic UI Designer',
      category: 'CREATIVE',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400',
      email: 'rahat@tongerkhobor.com',
      linkedin: 'https://linkedin.com'
    },
    {
      id: 4,
      name: 'Ahsan Habib',
      role: 'Head of Content & Editorial',
      category: 'EDITORIAL',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400&h=400',
      email: 'ahsan@tongerkhobor.com'
    }
  ];

  const filteredMembers = teamMembers.filter(member => {
    const matchesTab = activeTab === 'ALL' || member.category === activeTab;
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          member.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabs: { id: RoleCategory; label: string }[] = [
    { id: 'ALL', label: 'সকল মেম্বার' },
    { id: 'MANAGEMENT', label: 'ম্যানেজমেন্ট' },
    { id: 'EDITORIAL', label: 'এডিটরিয়াল' },
    { id: 'CREATIVE', label: 'ক্রিয়েটিভ টিম' },
    { id: 'TECH', label: 'টেক ও ডেভ' },
  ];

  return (
    <div className="min-h-screen bg-[#090d14] font-sans text-stone-200 pb-16 selection:bg-[#c1121f] selection:text-white">
      
      {/* টংয়েরখবর স্টাইল হেডার */}
      <div className="bg-[#090d14]/90 border-b border-stone-800 sticky top-0 z-50 px-4 py-4 sm:px-6 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="p-2 bg-stone-900 hover:bg-stone-800 rounded-xl transition text-stone-400 hover:text-white border border-stone-800">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2 font-sans tracking-wide">
                <Sparkles className="h-5 w-5 text-[#c1121f]" /> টংয়েরখবর টিম ডিরেক্টরি
              </h1>
              <p className="text-xs text-stone-400 font-mono tracking-wider uppercase">The Minds Behind TongerKhobor Network</p>
            </div>
          </div>
          
          {/* ব্র্যান্ড লোগো */}
          <img src="/logo2.png" alt="TongerKhobor Logo" className="h-10 object-contain brightness-0 invert" />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* ফিল্টারিং এবং কন্ট্রোল প্যানেল */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-950 p-4 rounded-2xl border border-stone-800 shadow-xl mb-10">
          
          {/* ক্যাটাগরি ট্যাব */}
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[#c1121f] text-white shadow-lg shadow-[#c1121f]/20'
                    : 'bg-stone-900 text-stone-400 border border-stone-800 hover:bg-stone-800 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* লাইভ সার্চ বার */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
            <input
              type="text"
              placeholder="মেম্বার বা রোল খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#c1121f] transition-all font-sans"
            />
          </div>
        </div>

        {/* ডার্ক থিম মেম্বার গ্রিড */}
        {filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMembers.map((member) => (
              <div 
                key={member.id} 
                className="bg-stone-950 border border-stone-800 hover:border-stone-700 rounded-2xl overflow-hidden shadow-2xl hover:shadow-[#c1121f]/5 transition-all duration-300 group flex flex-col items-center p-6 text-center relative"
              >
                {/* প্রোফাইল ইমেজ গ্লো ইফেক্ট সহ */}
                <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden p-1 border-2 border-dashed border-stone-700 group-hover:border-[#c1121f] transition-all duration-300 bg-stone-900">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover rounded-full filter grayscale-[30%] group-hover:grayscale-0 transition-all duration-300"
                  />
                </div>

                {/* টাইটেল এবং মেম্বার ইনফো */}
                <h3 className="text-base font-extrabold text-white group-hover:text-[#fbbf24] transition-all duration-200">
                  {member.name}
                </h3>
                <p className="text-xs font-medium text-stone-400 mt-1.5 min-h-[32px] flex items-center justify-center px-2">
                  {member.role}
                </p>

                {/* টংয়েরখবর সিগনেচার কালার ব্যাজ */}
                <span className={`mt-4 px-3 py-0.5 text-[10px] font-black tracking-widest uppercase rounded-md border ${
                  member.category === 'TECH' ? 'bg-blue-950/40 text-blue-400 border-blue-900/50' :
                  member.category === 'CREATIVE' ? 'bg-amber-950/40 text-amber-400 border-amber-900/50' :
                  member.category === 'MANAGEMENT' ? 'bg-purple-950/40 text-purple-400 border-purple-900/50' :
                  'bg-red-950/40 text-red-400 border-red-900/50'
                }`}>
                  {member.category}
                </span>

                {/* সোশ্যাল কন্টাক্ট বার */}
                <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-stone-900 w-full text-stone-500">
                  {member.email && (
                    <a href={`mailto:${member.email}`} className="hover:text-white transition-colors duration-200" title="Email">
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  {member.github && (
                    <a href={member.github} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200" title="GitHub">
                      <Github className="h-4 w-4" />
                    </a>
                  )}
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors duration-200" title="LinkedIn">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {member.website && (
                    <a href={member.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#c1121f] transition-colors duration-200" title="Website">
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* নো রেজাল্ট ফাউন্ড */
          <div className="text-center py-20 bg-stone-950 border border-stone-800 rounded-2xl shadow-inner">
            <p className="text-stone-500 text-sm font-medium font-sans">এই ফিল্টারে টংয়েরখবরের কোনো মেম্বার খুঁজে পাওয়া যায়নি।</p>
          </div>
        )}

      </main>
    </div>
  );
}
