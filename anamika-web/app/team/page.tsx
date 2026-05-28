'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail, Search, Sparkles, Globe, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase'; // Ensure this matches your project structure
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

type RoleCategory = 'ALL' | 'EDITORIAL' | 'CREATIVE' | 'TECH' | 'MANAGEMENT';

interface TeamMember {
  id: string;
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
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- FIREBASE FIRESTORE REAL-TIME DATA ACQUISITION ---
  useEffect(() => {
    const membersQuery = query(collection(db, 'members'), orderBy('newsCardCount', 'desc'));

    const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
      const memberList: TeamMember[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        memberList.push({
          id: doc.id,
          name: data.name || 'Anonymous Contributor',
          role: data.role || 'Team Member',
          category: (data.category?.toUpperCase() as RoleCategory) || 'MANAGEMENT',
          image: data.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400',
          email: data.email || '',
          github: data.github || '',
          linkedin: data.linkedin || '',
          website: data.website || ''
        });
      });
      
      setTeamMembers(memberList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error executing live database sync: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredMembers = teamMembers.filter(member => {
    const matchesTab = activeTab === 'ALL' || member.category === activeTab;
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          member.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabs: { id: RoleCategory; label: string }[] = [
    { id: 'ALL', label: 'All Personnel' },
    { id: 'MANAGEMENT', label: 'Management' },
    { id: 'EDITORIAL', label: 'Editorial' },
    { id: 'CREATIVE', label: 'Creative Studio' },
    { id: 'TECH', label: 'Engineering' },
  ];

  return (
    <div className="min-h-screen bg-[#090d14] font-sans text-stone-200 pb-16 selection:bg-[#c1121f] selection:text-white">
      
      {/* HEADER ARCHITECTURE */}
      <div className="bg-[#090d14]/90 border-b border-stone-800 sticky top-0 z-50 px-4 py-4 sm:px-6 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="p-2 bg-stone-900 hover:bg-stone-800 rounded-xl transition text-stone-400 hover:text-white border border-stone-800">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2 font-sans tracking-wide">
                <Sparkles className="h-5 w-5 text-[#c1121f]" /> Team Directory
              </h1>
              <p className="text-xs text-stone-400 font-mono tracking-wider uppercase">The Minds Behind TongerKhobor Network</p>
            </div>
          </div>
          
          {/* CORPORATE BRAND LOGO */}
          <div className="relative h-10 w-28 hidden sm:block">
            <Image src="/logo2.png" alt="TongerKhobor Logo" fill className="object-contain brightness-0 invert" priority />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* CONTROL AND FILTERING INTERFACE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-950 p-4 rounded-2xl border border-stone-800 shadow-xl mb-10">
          
          {/* SEGMENTATION TABS */}
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

          {/* DYNAMIC SEARCH UNIT */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
            <input
              type="text"
              placeholder="Search by name or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#c1121f] transition-all font-sans"
            />
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-[#c1121f] animate-spin mb-3" />
            <p className="text-xs font-mono text-stone-500 tracking-widest uppercase">Fetching Live Team Data...</p>
          </div>
        ) : filteredMembers.length > 0 ? (
          /* PERSONNEL MATRIX GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMembers.map((member) => (
              <div 
                key={member.id} 
                className="bg-stone-950 border border-stone-800 hover:border-stone-700 rounded-2xl overflow-hidden shadow-2xl hover:shadow-[#c1121f]/5 transition-all duration-300 group flex flex-col items-center p-6 text-center relative"
              >
                {/* HEADSHOT OPTIMIZED HOUSING */}
                <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden p-1 border-2 border-dashed border-stone-700 group-hover:border-[#c1121f] transition-all duration-300 bg-stone-900">
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      sizes="96px"
                      className="object-cover filter grayscale-[30%] group-hover:grayscale-0 transition-all duration-300"
                      unoptimized
                    />
                  </div>
                </div>

                {/* PROFILE METADATA */}
                <h3 className="text-base font-extrabold text-white group-hover:text-[#fbbf24] transition-all duration-200">
                  {member.name}
                </h3>
                <p className="text-xs font-medium text-stone-400 mt-1.5 min-h-[32px] flex items-center justify-center px-2">
                  {member.role}
                </p>

                {/* SIGNATURE TAXONOMY BADGES */}
                <span className={`mt-4 px-3 py-0.5 text-[10px] font-black tracking-widest uppercase rounded-md border ${
                  member.category === 'TECH' ? 'bg-blue-950/40 text-blue-400 border-blue-900/50' :
                  member.category === 'CREATIVE' ? 'bg-amber-950/40 text-amber-400 border-amber-900/50' :
                  member.category === 'MANAGEMENT' ? 'bg-purple-950/40 text-purple-400 border-purple-900/50' :
                  'bg-red-950/40 text-red-400 border-red-900/50'
                }`}>
                  {member.category}
                </span>

                {/* NETWORKING INFRASTRUCTURE SLOTS */}
                <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-stone-900 w-full text-stone-500">
                  {member.email && (
                    <a href={`mailto:${member.email}`} className="hover:text-white transition-colors duration-200" title="Email Communications">
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  {member.github && (
                    <a href={member.github} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200" title="GitHub Repository">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </a>
                  )}
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors duration-200" title="LinkedIn Executive Network">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                  )}
                  {member.website && (
                    <a href={member.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#c1121f] transition-colors duration-200" title="Personal Portfolio Site">
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* NULL SEARCH RESOLUTION */
          <div className="text-center py-20 bg-stone-950 border border-stone-800 rounded-2xl shadow-inner">
            <p className="text-stone-500 text-sm font-medium font-sans">No matching organizational personnel identified within this parameter.</p>
          </div>
        )}

      </main>
    </div>
  );
}
