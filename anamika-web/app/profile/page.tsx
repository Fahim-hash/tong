'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '../lib/firebase'; // Ensure this matches your project directory structure
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
  password?: string;
}

export default function ProfilePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reading user authentication metadata from the local storage session payload
    const session = localStorage.getItem('tk_user_session');
    if (!session) {
      window.location.href = '/'; 
      return;
    }
    
    const currentSession = JSON.parse(session);
    if (!currentSession || !currentSession.id) {
      setErrorMsg('Session configuration is missing or corrupted.');
      setIsAuthenticated(false);
      return;
    }

    setIsAuthenticated(true);
    const cleanedUserId = String(currentSession.id).trim().toLowerCase();

    // Fetching user profile document instance from Firebase Firestore
    const fetchProfileFromFirebase = async () => {
      try {
        const memberDocRef = doc(db, 'members', cleanedUserId);
        const memberDocSnap = await getDoc(memberDocRef);

        if (memberDocSnap.exists()) {
          const userData = memberDocSnap.data();
          setProfile({
            id: cleanedUserId,
            name: userData.name || currentSession.name || 'Unknown Member',
            role: userData.role || 'Creative Designer',
            category: userData.category || 'CREATIVE',
            image: userData.image || '/logo.png',
            newsCardCount: userData.newsCardCount || 0,
            email: userData.email || '',
            github: userData.github || '',
            linkedin: userData.linkedin || '',
            website: userData.website || '',
            password: userData.password || ''
          });
        } else {
          // Fallback provisioning scheme to construct records if cloud documents do not exist
          const defaultProfile: UserProfile = {
            id: cleanedUserId,
            name: currentSession.name || "New Member",
            role: "Creative Designer",
            category: "CREATIVE",
            image: "/logo.png",
            newsCardCount: 0,
            email: "",
            github: "",
            linkedin: "",
            website: "",
            password: ""
          };
          await setDoc(memberDocRef, defaultProfile);
          setProfile(defaultProfile);
        }
      } catch (error) {
        console.error("Firebase live data acquisition failure:", error);
        setErrorMsg('System error encountered while connecting to Firestore infrastructure.');
      }
    };

    fetchProfileFromFirebase();
  }, []);

  // Client-side visual optimization engine generating lean Base64 image strings
  const handleImageUploadAction = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setImageUploading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 400; 
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setProfile({ ...profile, image: compressedBase64 });
          setSuccessMsg('Profile image optimized successfully. Please commit changes to save permanently.');
        } else {
          setErrorMsg('Failed to initialize canvas rendering architecture.');
        }
        setImageUploading(false);
      };
    };
  };

  // Synchronizing local mutations directly back into cloud document state
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile || !profile.id) {
      setErrorMsg('Authentication identity state missing.');
      return;
    }
    
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const cleanedId = String(profile.id).trim().toLowerCase();
      const memberDocRef = doc(db, 'members', cleanedId);
      const memberDocSnap = await getDoc(memberDocRef);

      const cleanProfile: Record<string, any> = {
        id: cleanedId,
        name: profile.name ? String(profile.name).trim() : "New Member",
        role: profile.role ? String(profile.role).trim() : "Creative Designer",
        category: profile.category || "CREATIVE",
        image: profile.image || "/logo.png",
        newsCardCount: typeof profile.newsCardCount === 'number' ? profile.newsCardCount : 0,
        email: profile.email ? String(profile.email).trim() : "",
        github: profile.github ? String(profile.github).trim() : "",
        linkedin: profile.linkedin ? String(profile.linkedin).trim() : "",
        website: profile.website ? String(profile.website).trim() : "",
        password: profile.password ? String(profile.password).trim() : ""
      };

      if (memberDocSnap.exists()) {
        await setDoc(memberDocRef, cleanProfile, { merge: true });
      } else {
        await setDoc(memberDocRef, cleanProfile);
      }
      
      setSuccessMsg('Profile information and cloud access credentials successfully synchronized.');
    } catch (error: any) {
      console.error("Firestore database update exception:", error);
      setErrorMsg('Critical failure writing to cloud schema parameters.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isAuthenticated === null || !profile) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#800020] animate-spin mb-2" />
        <p className="text-xs font-mono text-stone-500 tracking-widest uppercase">Fetching Identity Credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 pb-16">
      
      {/* GLOBAL MANAGEMENT NAVBAR */}
      <nav className="bg-[#800020] text-white shadow-lg sticky top-0 z-50 px-4 py-4 border-b border-stone-700">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="p-2 bg-stone-900/40 hover:bg-stone-900 rounded-xl transition text-stone-200 border border-stone-700/50">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2 tracking-wide">
                <Sparkles className="h-5 w-5 text-amber-400" /> Account Settings
              </h1>
            </div>
          </div>
        </div>
      </nav>

      {/* CORE CONTROL PROFILE FORM */}
      <main className="max-w-3xl mx-auto px-4 mt-10">
        <form onSubmit={handleProfileSave} className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-3 rounded-xl font-medium">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* AVATAR IDENTITY & QUANTUM ANALYTICS PANEL */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
            <div className="flex items-center space-x-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border border-stone-300 bg-stone-100 shadow-inner">
                <Image 
                  src={profile.image || "/logo.png"} 
                  alt="User Avatar" 
                  fill
                  sizes="64px"
                  className="object-cover"
                  priority 
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">{profile.name}</h3>
                <p className="text-xs text-stone-400 font-mono">System ID Node: {profile.id}</p>
              </div>
            </div>
            
            <div className="bg-stone-50 border border-stone-200 px-5 py-3 rounded-xl text-center sm:text-right shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">News Cards Generated</p>
              <p className="text-2xl font-black text-[#800020] mt-0.5">{profile.newsCardCount} Units</p>
            </div>
          </div>

          {/* CONTENT PARAMETERS MATRIX */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Display Name</label>
              <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-black focus:outline-none focus:border-[#800020] focus:bg-white transition" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Professional Designation / Role</label>
              <input type="text" value={profile.role} onChange={e => setProfile({...profile, role: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-black focus:outline-none focus:border-[#800020] focus:bg-white transition" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Avatar Media Upload</label>
              <input type="file" ref={fileInputRef} onChange={handleImageUploadAction} accept="image/*" className="hidden" />
              <button
                type="button"
                disabled={imageUploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-stone-50 border border-dashed border-stone-300 hover:border-[#800020] rounded-xl p-3 text-sm text-stone-500 hover:text-stone-900 transition flex items-center justify-center space-x-2 text-left focus:outline-none"
              >
                {imageUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#800020]" />
                    <span>Processing visual buffer...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-stone-400" />
                    <span>Upload New Image Asset</span>
                  </>
                )}
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Functional Segment Category</label>
              <select value={profile.category} onChange={e => setProfile({...profile, category: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-black focus:outline-none focus:border-[#800020] focus:bg-white transition">
                <option value="MANAGEMENT">MANAGEMENT</option>
                <option value="EDITORIAL">EDITORIAL</option>
                <option value="CREATIVE">CREATIVE</option>
                <option value="TECH">TECH</option>
              </select>
            </div>
          </div>

          {/* PRIVACY & SYSTEM CREDENTIAL SECURITY SECURITY */}
          <div className="pt-4 border-t border-stone-100 space-y-4">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#800020]" /> Security Gate Infrastructure
            </h4>
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Update Credentials Password</label>
              <input 
                type="password" 
                placeholder="Assign secure system interface password" 
                value={profile.password || ''} 
                onChange={e => setProfile({...profile, password: e.target.value})} 
                className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl p-3 text-sm text-black focus:outline-none focus:border-[#800020] focus:bg-white transition" 
              />
            </div>
          </div>

          {/* NETWORKING MATRIX NODES */}
          <div className="pt-4 border-t border-stone-100 space-y-4">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Communication Grid Nodes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="email" placeholder="Corporate Email Address" value={profile.email || ''} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-black focus:outline-none focus:border-[#800020] focus:bg-white transition" />
              <input type="text" placeholder="GitHub Repository Endpoint" value={profile.github || ''} onChange={e => setProfile({...profile, github: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-black focus:outline-none focus:border-[#800020] focus:bg-white transition" />
              <input type="text" placeholder="LinkedIn Professional Node" value={profile.linkedin || ''} onChange={e => setProfile({...profile, linkedin: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-black focus:outline-none focus:border-[#800020] focus:bg-white transition" />
              <input type="text" placeholder="External Portfolio URL" value={profile.website || ''} onChange={e => setProfile({...profile, website: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-black focus:outline-none focus:border-[#800020] focus:bg-white transition" />
            </div>
          </div>

          {/* COMMIT EXECUTION ACTION */}
          <button 
            type="submit" 
            disabled={isSaving || imageUploading} 
            className="w-full bg-[#800020] hover:bg-[#600018] disabled:bg-stone-400 text-white font-bold py-3.5 rounded-xl shadow-md transition duration-200 flex items-center justify-center space-x-2"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            <span>Commit System Configurations</span>
          </button>
        </form>
      </main>
    </div>
  );
}
