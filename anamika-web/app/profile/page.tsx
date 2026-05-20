'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { db } from '../lib/firebase'; 
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ArrowLeft, Save, Sparkles, Loader2, Upload, Lock } from 'lucide-react';

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
  newsCardCount: number;
  password?: string; // ফায়ারবেসে কাস্টম পাসওয়ার্ড সেভ রাখার জন্য
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // ১. কারেন্ট লগইন সেশন ভেরিফিকেশন
    const session = localStorage.getItem('tk_user_session');
    if (!session) {
      window.location.href = '/dashboard'; 
      return;
    }
    const currentSession = JSON.parse(session);
    const userId = currentSession.id.toLowerCase();

    // ২. Firebase Firestore থেকে লাইভ প্রোফাইল ডাটা রিড করা
    const fetchProfileFromFirebase = async () => {
      try {
        const docRef = doc(db, "members", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // ডেটাবেসে প্রথমবার এন্ট্রি হলে ডিফল্ট অবজেক্ট জেনারেট হবে
          const defaultProfile: UserProfile = {
            id: userId,
            name: currentSession.name || "New Member",
            role: "Creative Designer",
            category: "CREATIVE",
            image: "/logo.png",
            newsCardCount: 0,
          };
          await setDoc(docRef, defaultProfile);
          setProfile(defaultProfile);
        }
      } catch (error) {
        console.error("Firebase fetch error:", error);
        setErrorMsg('ফায়ারবেস থেকে ডাটা লোড করতে সমস্যা হচ্ছে।');
      }
    };

    fetchProfileFromFirebase();
  }, []);

  // ৩. ছবিকে Base64 টেক্সট স্ট্রিং বানিয়ে সরাসরি Firestore-এ সেভ করার লজিক (No Storage Required)
  const handleImageUploadAction = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // ১ মেগাবাইটের বেশি বড় ছবি হলে রিজেক্ট করবে (Firestore ডকুমেন্ট লিমিট ১ মেগাবাইট)
    if (file.size > 1024 * 1024) {
      setErrorMsg("ফ্রি প্ল্যানে প্রোফাইল ছবির সাইজ ১ মেগাবাইটের কম হতে হবে!");
      setSuccessMsg('');
      return;
    }

    setImageUploading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      
      // ছবিটিকে টেক্সট আকারে স্টেট-এ সেট করা
      setProfile({ ...profile, image: base64String });
      setSuccessMsg('ছবি প্রসেস হয়েছে! প্রোফাইলটি সম্পূর্ণ সেভ করুন।');
      setImageUploading(false);
    };
    reader.onerror = (error) => {
      console.error("Error converting image:", error);
      setErrorMsg('ছবি প্রসেস করতে সমস্যা হয়েছে।');
      setImageUploading(false);
    };
  };

  // ৪. ফর্ম সাবমিশন এবং Firestore ডকুমেন্ট মার্জিং আপডেট
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // Firestore-এ মেম্বার আইডি অনুযায়ী ডেটা রাইট করা
      await setDoc(doc(db, "members", profile.id.toLowerCase()), profile, { merge: true });
      setSuccessMsg('প্রোফাইল এবং সিকিউরিটি সেটিংস সফলভাবে ক্লাউডে আপডেট হয়েছে!');
    } catch (error) {
      console.error("Firebase write error:", error);
      setErrorMsg('ডাটা সেভ করতে সমস্যা হয়েছে। Rules চেক করুন।');
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#090d14] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#c1121f] animate-spin mb-2" />
        <p className="text-xs font-mono text-stone-500 tracking-widest uppercase">Connecting Firebase Infrastructure...</p>
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
                <Sparkles className="h-5 w-5 text-[#c1121f]" /> প্রোফাইল সেটিংস
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

          {errorMsg && (
            <div className="bg-rose-950/50 border border-rose-800 text-rose-400 text-sm px-4 py-3 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* অবতার ভিউ এবং রিয়েল-টাইম নিউজ কার্ড কাউন্টার প্যানেল */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-900">
            <div className="flex items-center space-x-4">
              <img src={profile.image || "/logo.png"} alt="Profile" className="w-16 h-16 rounded-full object-cover border border-stone-700 bg-stone-900" />
              <div>
                <h3 className="text-lg font-bold text-white">{profile.name}</h3>
                <p className="text-xs text-stone-500 font-mono">Member ID: {profile.id}</p>
              </div>
            </div>
            
            {/* লাইভ অ্যানালিটিক্স ডিসপ্লে */}
            <div className="bg-stone-900 border border-stone-800 px-5 py-3 rounded-xl text-center sm:text-right">
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">News Cards Generated</p>
              <p className="text-2xl font-black text-[#fbbf24] mt-0.5">{profile.newsCardCount || 0}টি</p>
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

            {/* ছবি আপলোড বাটন */}
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">প্রোফাইল পিকচার (সর্বোচ্চ 1MB)</label>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUploadAction} 
                accept="image/*" 
                className="hidden" 
              />
              <button
                type="button"
                disabled={imageUploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-stone-900 border border-dashed border-stone-700 hover:border-[#c1121f] rounded-xl p-3 text-sm text-stone-400 hover:text-white transition flex items-center justify-center space-x-2 text-left focus:outline-none"
              >
                {imageUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#c1121f]" />
                    <span>ছবি প্রোসেস হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-stone-500" />
                    <span>{profile.image && profile.image !== '/logo.png' ? 'ছবি পরিবর্তন করুন' : 'ডিভাইস থেকে ছবি আপলোড'}</span>
                  </>
                )}
              </button>
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

          {/* সিকিউরিটি সেকশন (পাসওয়ার্ড চেঞ্জ) */}
          <div className="pt-4 border-t border-stone-900 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#c1121f]" /> অ্যাকাউন্ট সিকিউরিটি
            </h4>
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">নতুন পাসওয়ার্ড সেট করুন</label>
              <input 
                type="password" 
                placeholder="নতুন পাসওয়ার্ড লিখুন (ফাঁকা রাখলে আগের ডিফল্ট পাসওয়ার্ড কাজ করবে)" 
                value={profile.password || ''} 
                onChange={e => setProfile({...profile, password: e.target.value})} 
                className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#c1121f]" 
              />
            </div>
          </div>

          {/* সোশ্যাল লিংকস */}
          <div className="pt-4 border-t border-stone-900 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">যোগাযোগ ও সোশ্যাল লিংকস</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="email" placeholder="ইমেইল এড্রেস" value={profile.email || ''} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#c1121f]" />
              <input type="text" placeholder="গিটহাব লিংক" value={profile.github || ''} onChange={e => setProfile({...profile, github: e.target.value})} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#c1121f]" />
              <input type="text" placeholder="লিংকডইন লিংক" value={profile.linkedin || ''} onChange={e => setProfile({...profile, linkedin: e.target.value})} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#c1121f]" />
              <input type="text" placeholder="পার্সোনাল ওয়েবসাইট" value={profile.website || ''} onChange={e => setProfile({...profile, website: e.target.value})} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#c1121f]" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSaving || imageUploading} 
            className="w-full bg-[#c1121f] hover:bg-red-700 disabled:bg-stone-800 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-[#c1121f]/10"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            <span>প্রোফাইল ও ডেটা সেভ করুন</span>
          </button>
        </form>
      </main>
    </div>
  );
}
