'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User, Lock, UserPlus, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
// Firebase ইম্পোর্ট
import { db } from '../lib/firebase'; // আপনার সঠিক পাথ নিশ্চিত করুন
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function RegisterMember() {
  const router = useRouter();
  const [memberId, setMemberId] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    // সাধারণ ভ্যালিডেশন
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('Password should be at least 4 characters long.');
      return;
    }

    const cleanedId = memberId.trim().toLowerCase();
    if (!cleanedId) {
      setErrorMsg('Please enter a valid Member ID.');
      return;
    }

    setIsLoading(true);

    try {
      // ১. চেক করা হচ্ছে এই আইডি দিয়ে অলরেডি কেউ রেজিস্টার্ড কি না
      const memberRef = doc(db, 'members', cleanedId);
      const memberSnap = await getDoc(memberRef);

      if (memberSnap.exists()) {
        setErrorMsg('This Member ID is already taken. Please choose another.');
        setIsLoading(false);
        return;
      }

      // ২. নতুন মেম্বার ডেটা ফায়ারবেসে পুশ করা হচ্ছে (আপনার ফিল্ড স্কিমা অনুযায়ী)
      await setDoc(memberRef, {
        name: fullName.trim(),
        password: password, // আপনার ফিল্ড স্কিমা অনুযায়ী 'password'
        newsCardCount: 0    // নতুন মেম্বারের জন্য ডিফোল্ট কাউন্টার ০
      });

      setIsSuccess(true);
      
      // ৩ সেকেন্ড পর লগইন বা ড্যাশবোর্ড পেজে রিডাইরেক্ট করবে
      setTimeout(() => {
        router.push('/'); // আপনার ড্যাশবোর্ড পাথ দিন
      }, 2500);

    } catch (err) {
      console.error('Registration error:', err);
      setErrorMsg('Failed to register member. Please check database permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
        
        {/* Header section */}
        <div className="bg-gradient-to-r from-[#600018] to-[#800020] p-6 text-center text-white flex flex-col items-center relative">
          <Link href="/" className="absolute left-4 top-6 text-stone-200 hover:text-white transition flex items-center space-x-1 text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          
          <div className="mb-2 transform transition hover:scale-105 duration-200 drop-shadow-md">
            <Image 
              src="/logo2.png" 
              alt="TongerKhobor Logo" 
              width={80} 
              height={80} 
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-bold tracking-wide">Register New Member</h1>
          <p className="text-stone-200 text-[11px] uppercase tracking-widest mt-0.5">Add to Internal Registry</p>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-4 my-6 animate-fade-in">
            <div className="h-16 w-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center border border-green-200 shadow-sm">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Registration Successful!</h2>
              <p className="text-stone-500 text-sm mt-1">
                <span className="font-mono font-semibold text-[#800020]">{memberId.toLowerCase()}</span> has been added to the system.
              </p>
            </div>
            <p className="text-xs text-stone-400 font-mono flex items-center space-x-1 pt-4">
              <Loader2 className="h-3 w-3 animate-spin text-stone-400" />
              <span>Redirecting to portal...</span>
            </p>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g.,tongerkhobor"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-black focus:outline-none focus:border-[#800020] focus:bg-white transition"
                />
              </div>
            </div>

            {/* Custom Member ID */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
                Desired Member ID (Unique)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                  <span className="text-xs font-mono font-bold">@</span>
                </span>
                <input
                  type="text"
                  required
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value.replace(/\s+/g, ''))} // স্পেস রিমুভ করবে স্বয়ংক্রিয়ভাবে
                  placeholder="e.g., tong member"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-black focus:outline-none focus:border-[#800020] focus:bg-white transition"
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">This will be used as the login username.</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-black focus:outline-none focus:border-[#800020] focus:bg-white transition"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-black focus:outline-none focus:border-[#800020] focus:bg-white transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#800020] hover:bg-[#600018] disabled:bg-stone-400 text-white font-semibold py-3 rounded-xl shadow-md transition duration-200 flex items-center justify-center space-x-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registering Member...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="bg-stone-50 px-6 py-4 border-t border-stone-100 text-center flex justify-between items-center text-[11px] text-stone-400">
          <span>TongerKhobor Security</span>
          <Link href="/" className="text-[#800020] font-medium hover:underline">
            Already have an account?
          </Link>
        </div>

      </div>
    </div>
  );
}
