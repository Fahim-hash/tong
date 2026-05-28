'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Newspaper, LayoutDashboard, FilePlus2, Users, Settings, ArrowRight, Lock, User, LogOut, Loader2, Trophy } from 'lucide-react';
// Firebase ইম্পোর্ট করুন
import { db } from './lib/firebase'; // আপনার সঠিক পাথ দিন
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface Member {
  id: string;
  name: string;
  pass: string;
  cardsGenerated?: number; 
}

export default function InternalDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userSession, setUserSession] = useState<{ id: string; name: string } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  
  // Login input states
  const [userIdInput, setUserIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Authentication logic on mount
  useEffect(() => {
    const session = localStorage.getItem('tk_user_session');
    if (session) {
      const parsed = JSON.parse(session);
      setUserSession(parsed);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }

    // --- FIREBASE FIRESTORE LIVE LEADERBOARD CONNECTIVITY ---
    // Firestore-এর 'members' কালেকশন থেকে 'cardsGenerated' অনুযায়ী desc অর্ডারে কুয়েরি করা হচ্ছে
    const membersQuery = query(collection(db, 'members'), orderBy('cardsGenerated', 'desc'));

    // onSnapshot রিয়েল-টাইম ডেটা লিসেন করে
    const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
      const memberList: Member[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        memberList.push({
          id: doc.id, // অথবা data.id (আপনার ডেটাবেস ডিজাইন অনুযায়ী)
          name: data.name || 'Unknown',
          pass: data.pass || '',
          cardsGenerated: data.cardsGenerated || 0
        });
      });
      setMembers(memberList);
    }, (error) => {
      console.error("Firebase fetch error: ", error);
    });

    // Component unmount হলে listener বন্ধ করার জন্য cleanup function
    return () => unsubscribe();
  }, []);

  // Handle local login submission matching against Firebase data or static data
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoggingIn(true);

    try {
      // লগইন ভ্যালিডেশন এখনো আপনার স্থানীয় JSON ফাইল থেকে কাজ করবে 
      // (যদি মেম্বারদের পাসওয়ার্ড সিকিউর করতে চান, তবে পরবর্তীতে Firebase Auth ব্যবহার করা ভালো)
      const res = await fetch('/data/info.json');
      if (!res.ok) throw new Error('Failed to load user credentials file.');
      
      const membersList: Member[] = await res.json();
      
      const matchedUser = membersList.find(
        (member) => member.id.toLowerCase() === userIdInput.trim().toLowerCase() && member.pass === passwordInput
      );

      if (matchedUser) {
        const structuralSession = { id: matchedUser.id, name: matchedUser.name };
        localStorage.setItem('tk_user_session', JSON.stringify(structuralSession));
        setUserSession(structuralSession);
        setIsAuthenticated(true);
      } else {
        setErrorMsg('Invalid ID or Password. Access denied.');
      }
    } catch (err) {
      setErrorMsg('System error verifying credentials. Contact administrator.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogoutAction = () => {
    localStorage.removeItem('tk_user_session');
    setUserSession(null);
    setIsAuthenticated(false);
    setUserIdInput('');
    setPasswordInput('');
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#800020] animate-spin mb-2" />
        <p className="text-xs font-mono text-stone-500 tracking-widest uppercase">Verifying Authorization...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
          
          <div className="bg-gradient-to-r from-[#600018] to-[#800020] p-8 text-center text-white flex flex-col items-center">
            <div className="mb-4 transform transition hover:scale-105 duration-200 drop-shadow-md">
              <Image 
                src="/logo2.png" 
                alt="TongerKhobor Logo" 
                width={110} 
                height={110} 
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold tracking-wide">TongerKhobor</h1>
            <p className="text-stone-200 text-xs uppercase tracking-widest mt-1">Gated Internal System</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-5">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
                Internal Member ID
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                  <User className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  required
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  placeholder="e.g., admin01"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-black focus:outline-none focus:border-[#800020] focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
                Secret Access Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-black focus:outline-none focus:border-[#800020] focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#800020] hover:bg-[#600018] disabled:bg-stone-400 text-white font-semibold py-3 rounded-xl shadow-md transition duration-200 flex items-center justify-center space-x-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <span>Authenticate Session</span>
              )}
            </button>
          </form>

          <div className="bg-stone-50 px-6 py-4 border-t border-stone-100 text-center">
            <p className="text-[11px] text-stone-400 leading-normal">
              Private access point. System monitors identity configurations. Unauthorized requests are strictly discarded.
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 flex flex-col">
      
      {/* --- NAVBAR --- */}
      <nav className="bg-[#800020] text-white shadow-lg border-b border-maroon-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-white/10 rounded-lg flex items-center justify-center">
                <Image 
                  src="/logo.png" 
                  alt="TongerKhobor Logo" 
                  width={42} 
                  height={42} 
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-bold text-lg tracking-wide block leading-none">TongerKhobor</span>
                <span className="text-xs text-stone-300 tracking-widest uppercase">Internal Portal</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold tracking-wide text-white">{userSession?.name}</p>
                <p className="text-xs text-stone-300 font-mono">ID: {userSession?.id}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-maroon-800 border border-stone-400 flex items-center justify-center font-bold text-white uppercase shadow-inner">
                {userSession?.name.charAt(0)}
              </div>
              <button
                onClick={handleLogoutAction}
                className="ml-2 p-2 rounded-xl bg-maroon-900/40 hover:bg-red-950/80 transition text-stone-200 hover:text-white"
                title="Log Out Session"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* --- MAIN BODY --- */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="bg-gradient-to-r from-[#600018] to-[#800020] text-white rounded-2xl p-6 sm:p-8 shadow-xl mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Welcome Back, {userSession?.name}! ☕</h1>
          <p className="text-stone-200 text-sm sm:text-base max-w-2xl">
            Access your internal tools, manage upcoming publications, and generate media assets efficiently from this centralized control panel.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
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
            
            <Link href="/newscard">
              <button className="w-full sm:w-auto bg-[#800020] hover:bg-[#600018] text-white font-semibold px-6 py-3 rounded-xl shadow-md transition duration-200 flex items-center justify-center space-x-2 group">
                <span>Generate News Card</span>
                <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border border-stone-200/80 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center space-x-2">
                <LayoutDashboard className="h-5 w-5 text-[#800020]" />
                <span>Quick Actions</span>
              </h3>
              
              <div className="space-y-3">
                <button type="button" className="w-full flex items-center space-x-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-left text-sm font-medium transition">
                  <FilePlus2 className="h-4 w-4 text-stone-600" />
                  <span>Draft New Article</span>
                </button>
                
                <Link href="/team" className="block w-full">
                  <button type="button" className="w-full flex items-center space-x-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-left text-sm font-medium transition">
                    <Users className="h-4 w-4 text-stone-600" />
                    <span>Team Directory</span>
                  </button>
                </Link>

                <button type="button" className="w-full flex items-center space-x-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-left text-sm font-medium transition">
                  <Settings className="h-4 w-4 text-stone-600" />
                  <span>System Settings</span>
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 text-center">
              <span className="text-xs text-stone-400 font-mono">v2.1.0-internal</span>
            </div>
          </div>

          {/* --- LEADERBOARD SECTION WITH LIVE STATS GREEN DOT --- */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-md border border-stone-200/80">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">News Card Creators Leaderboard</h3>
                  <p className="text-stone-500 text-xs">Top ranking internal members by cards generated</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 animate-pulse">
                <span className="w-1.5 h-1.5 mr-1.5 bg-green-500 rounded-full"></span>
                Live Stats
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-400 text-xs uppercase tracking-wider">
                    <th className="pb-3 font-semibold w-16 text-center">Rank</th>
                    <th className="pb-3 font-semibold">Member</th>
                    <th className="pb-3 font-semibold">Member ID</th>
                    <th className="pb-3 font-semibold text-right">Cards Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {members.slice(0, 5).map((member, index) => {
                    const isCurrentUser = member.id === userSession?.id;
                    return (
                      <tr 
                        key={member.id} 
                        className={`group transition ${isCurrentUser ? 'bg-maroon-50/40 font-medium' : 'hover:bg-stone-50'}`}
                      >
                        <td className="py-3.5 text-center font-mono font-bold text-stone-500">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                        </td>
                        <td className="py-3.5 text-stone-900 font-medium">
                          <div className="flex items-center space-x-2">
                            <span>{member.name}</span>
                            {isCurrentUser && (
                              <span className="bg-[#800020] text-white text-[10px] px-1.5 py-0.5 rounded font-sans uppercase">You</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 text-stone-500 font-mono text-xs">{member.id}</td>
                        <td className="py-3.5 text-right font-semibold text-stone-800 pr-4">
                          {member.cardsGenerated}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      <footer className="bg-stone-900 text-stone-400 py-6 text-center text-xs border-t border-stone-800">
        <p>&copy; {new Date().getFullYear()} TongerKhobor. All rights reserved. Internal Use Only.</p>
      </footer>

    </div>
  );
}
