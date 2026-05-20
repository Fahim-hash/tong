'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, User, Mail, Globe, Sparkles, Loader2 } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  role: string;
  category: string;
  image: string;
  email?: string;
  github?: string;
  linkedin?: string;
  website?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // ১. কারেন্ট লগইন সেশন চেক
    const session = localStorage.getItem('tk_user_session');
    if (!session) {
      window.location.href = '/dashboard'; // লগইন না থাকলে ড্যাশবোর্ডে রিডাইরেক্ট
      return;
    }
    const currentSession = JSON.parse(session);

    // ২. লোকাল স্টোরেজ বা মাস্টার লিস্ট থেকে এই ইউজারের ডিটেইল প্রোফাইল রিড করা
    const storedTeam = localStorage.getItem('tk_dynamic_team');
    if (storedTeam) {
      const teamList: UserProfile[] = JSON.parse(storedTeam);
      const userProfile = teamList.find(m => m.id.toLowerCase() === currentSession.id.toLowerCase());
      if (userProfile) setProfile(userProfile);
    } else {
      // যদি লোকাল স্টোরেজে না থাকে, মাস্টার info.json থেকে ফেচ করবে
      fetch('/data/info.json')
        .then(res => res.json())
        .then((data: UserProfile[]) => {
          localStorage.setItem('tk_dynamic_team', JSON.stringify(data));
          const userProfile = data.find(m => m.id.toLowerCase() === currentSession.id.toLowerCase());
          if (userProfile) setProfile(userProfile);
        });
    }
  }, []);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    setSuccessMsg('');

    // মাস্টার টিম লিস্ট আপডেট করা
    const storedTeam = localStorage.getItem('tk_dynamic_team');
    if (storedTeam) {
      const teamList: UserProfile[] = JSON.parse(storedTeam);
      const updatedTeam = teamList.map(member => 
        member.id.toLowerCase() === profile.id.toLowerCase() ? profile : member
      );
      localStorage.setItem('tk_dynamic_team', JSON.stringify(updatedTeam));
    }

    setTimeout(() => {
      setIsSaving(false);
      setSuccessMsg('প্রোফাইল সফলভাবে আপডেট করা হয়েছে এবং টিম ডিরেক্টরিতে সেভ হয়েছে!');
    }, 800);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#090d14] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#c1121f] animate-spin mb-2" />
        <p className="text-xs font-mono text-stone-500 tracking-widest uppercase">Loading Profile Data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d14] font-sans text-stone-200 pb-16">
      <div className="bg-[#090d14]/90 border-b border-stone-800 sticky top-0 z-50 px-4 py-4 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="p-2 bg-stone-900 hover:bg-stone-800 rounded-xl transition text-stone-400 border border-stone-800">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#c1121f]" /> নিজের প্রোফাইল এডিট
              </h1>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 mt-10">
        <form onSubmit={handleProfileSave} className="bg-stone-950 border border-stone-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {successMsg && (
            <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-400 text-sm px-4 py-3 rounded-xl font-medium">
              {successMsg}
            </div>
          )}

          {/* অবতার ভিউ */}
          <div className="flex items-center space-x-4 pb-4 border-b border-stone-900">
            <img src={profile.image || "/logo.png"} alt="Profile" className="w-16 h-16 rounded-full object-cover border border-stone-700 bg-stone-900" />
            <div>
              <h3 className="text-lg font-bold text-white">{profile.name}</h3>
              <p className="text-xs text-stone-500 font-mono">Member ID: {profile.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">পুরো নাম</label>
              <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#c1121f]" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">পদবি / রোল</label>
              <input type="text" value={profile.role} onChange={e => setProfile({...profile, role: e.target.value})} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#c1121f]" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">প্রোফাইল ইমেজ ইউআরএল (URL)</label>
              <input type="text" value={profile.image} onChange={e => setProfile({...profile, image: e.target.value})} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#c1121f]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">ক্যাটাগরি</label>
              <select value={profile.category} onChange={e => setProfile({...profile, category: e.target.value})} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#c1121f]">
                <option value="MANAGEMENT">MANAGEMENT</option>
                <option value="EDITORIAL">EDITORIAL</option>
                <option value="CREATIVE">CREATIVE</option>
                <option value="TECH">TECH</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-900 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">যোগাযোগ ও সোশ্যাল লিংকস</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="email" placeholder="ইমেইল এড্রেস" value={profile.email || ''} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#c1121f]" />
              <input type="text" placeholder="গিটহাব লিংক" value={profile.github || ''} onChange={e => setProfile({...profile, github: e.target.value})} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#c1121f]" />
              <input type="text" placeholder="লিংকডইন লিংক" value={profile.linkedin || ''} onChange={e => setProfile({...profile, linkedin: e.target.value})} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#c1121f]" />
              <input type="text" placeholder="পার্সোনাল ওয়েবসাইট" value={profile.website || ''} onChange={e => setProfile({...profile, website: e.target.value})} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#c1121f]" />
            </div>
          </div>

          <button type="submit" disabled={isSaving} className="w-full bg-[#c1121f] hover:bg-red-700 disabled:bg-stone-800 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-[#c1121f]/10">
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            <span>প্রোফাইল সেভ করুন</span>
          </button>
        </form>
      </main>
    </div>
  );
}
