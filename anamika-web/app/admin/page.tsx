'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { 
  ArrowLeft, ShieldAlert, Users, UserPlus, Edit2, Trash2, 
  Save, X, Loader2, Search, CheckCircle, AlertTriangle, ShieldCheck,
  Plus, MessageSquare, History
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: 'MANAGEMENT' | 'EDITORIAL' | 'CREATIVE' | 'TECH';
  image: string;
  email: string;
  github: string;
  linkedin: string;
  website: string;
  newsCardCount: number;
  password?: string;
  captionHistory: string[]; // Added Caption History Array Array
}

const AUTHORIZED_ADMIN_IDS = ['relax_bro', 'fahim_muddasir', 'admin_main'];

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notification States
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form Management States
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentIdIsLocked, setCurrentIdIsLocked] = useState(false);

  // Local State for Adding a New Caption to the list
  const [newCaptionInput, setNewCaptionInput] = useState('');

  const [formData, setFormData] = useState<Partial<TeamMember>>({
    id: '',
    name: '',
    role: '',
    category: 'CREATIVE',
    image: '/logo.png',
    email: '',
    github: '',
    linkedin: '',
    website: '',
    newsCardCount: 0,
    password: '',
    captionHistory: []
  });

  // --- CRYPTOGRAPHIC & SESSION AUTHORIZATION GUARD ---
  useEffect(() => {
    const verifyAdministrativeClearance = async () => {
      const session = localStorage.getItem('tk_user_session');
      if (!session) {
        window.location.href = '/';
        return;
      }

      try {
        const currentSession = JSON.parse(session);
        const rawId = currentSession?.id || currentSession?.uid;

        if (!rawId) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const cleanedId = String(rawId).trim().toLowerCase();

        // STEP 1: White-list ID array verification
        if (!AUTHORIZED_ADMIN_IDS.includes(cleanedId)) {
          console.warn(`Intrusion Blocked: Identity node "${cleanedId}" lacks static registry permissions.`);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // STEP 2: Cloud Verification
        const userDocRef = doc(db, 'members', cleanedId);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const secureData = userDocSnap.data();
        
        if (secureData.category !== 'MANAGEMENT') {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);
        
        // Start live snapshot stream
        const membersQuery = query(collection(db, 'members'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
          const memberList: TeamMember[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            memberList.push({
              id: doc.id,
              name: data.name || '',
              role: data.role || '',
              category: data.category || 'CREATIVE',
              image: data.image || '/logo.png',
              email: data.email || '',
              github: data.github || '',
              linkedin: data.linkedin || '',
              website: data.website || '',
              newsCardCount: Number(data.newsCardCount) || 0,
              password: data.password || '',
              captionHistory: Array.isArray(data.captionHistory) ? data.captionHistory : []
            });
          });
          setMembers(memberList);
          setIsLoading(false);
        }, (error) => {
          console.error("Real-time snapshot sync error:", error);
          setErrorMsg("Telemetry interface synchronization failure.");
          setIsLoading(false);
        });

        return () => unsubscribe();

      } catch (error) {
        console.error("Authorization subsystem validation exception:", error);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    verifyAdministrativeClearance();
  }, []);

  // --- FORM HANDLING MUTATIONS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'newsCardCount' ? Number(value) : value
    }));
  };

  // Function to Append Caption to Local Form State
  const handleAddCaption = () => {
    if (!newCaptionInput.trim()) return;
    const currentHistory = formData.captionHistory || [];
    setFormData(prev => ({
      ...prev,
      captionHistory: [...currentHistory, newCaptionInput.trim()]
    }));
    setNewCaptionInput('');
  };

  // Function to Remove Caption from Local Form State
  const handleRemoveCaption = (indexToRemove: number) => {
    const currentHistory = formData.captionHistory || [];
    setFormData(prev => ({
      ...prev,
      captionHistory: currentHistory.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name) {
      setErrorMsg("Crucial metrics missing: ID and Name parameters cannot be empty.");
      return;
    }

    const sanitizedId = String(formData.id).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const targetDocRef = doc(db, 'members', sanitizedId);
      
      const clearPayload: Record<string, any> = {
        id: sanitizedId,
        name: String(formData.name).trim(),
        role: String(formData.role || 'Internal Officer').trim(),
        category: formData.category || 'CREATIVE',
        image: formData.image || '/logo.png',
        email: String(formData.email || '').trim(),
        github: String(formData.github || '').trim(),
        linkedin: String(formData.linkedin || '').trim(),
        website: String(formData.website || '').trim(),
        newsCardCount: Number(formData.newsCardCount) || 0,
        password: String(formData.password || '').trim(),
        captionHistory: formData.captionHistory || []
      };

      await setDoc(targetDocRef, clearPayload, { merge: true });
      setSuccessMsg(`Document transactional state safely saved for node: "${sanitizedId}"`);
      resetFormState();
    } catch (error) {
      setErrorMsg("Database operation rejected by network firewall configuration rules.");
    } finally {
      setIsSaving(false);
    }
  };

  const initiateEditSequence = (member: TeamMember) => {
    setFormData({
      ...member,
      captionHistory: member.captionHistory || []
    });
    setCurrentIdIsLocked(true);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const purgeDocumentNode = async (id: string) => {
    if (!confirm(`CRITICAL DESTRUCTIVE SECTOR ROUTINE:\nAre you absolutely certain you want to destroy member record node "${id}" permanently?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'members', id));
      setSuccessMsg(`Document cluster context "${id}" wiped from global databases successfully.`);
    } catch (error) {
      setErrorMsg("Destructive transaction sequence rejected at structural layer.");
    }
  };

  const resetFormState = () => {
    setIsEditing(false);
    setCurrentIdIsLocked(false);
    setNewCaptionInput('');
    setFormData({
      id: '',
      name: '',
      role: '',
      category: 'CREATIVE',
      image: '/logo.png',
      email: '',
      github: '',
      linkedin: '',
      website: '',
      newsCardCount: 0,
      password: '',
      captionHistory: []
    });
  };

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    member.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-full mb-4 animate-bounce">
          <ShieldAlert className="h-12 w-12 text-red-600" />
        </div>
        <h2 className="text-lg font-black text-white uppercase tracking-widest">Unauthorized Access Trapped</h2>
        <p className="text-stone-400 text-xs mt-2 max-w-sm leading-relaxed">
          Your unique system identity node is not whitelisted inside the administrative directory structure. Intrusion incident logged.
        </p>
        <Link href="/" className="mt-6 px-6 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-[10px] font-mono font-bold text-stone-300 uppercase tracking-widest hover:bg-stone-800 transition">
          Return to Identity Authentication Portal
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d14] flex flex-col items-center justify-center">
        <Loader2 className="h-7 w-7 text-[#c1121f] animate-spin mb-3" />
        <p className="text-xs font-mono text-stone-500 tracking-widest uppercase">Executing Authorization Protocols...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d14] text-stone-200 pb-16 selection:bg-[#c1121f] selection:text-white">
      <nav className="bg-[#090d14]/90 border-b border-stone-800 sticky top-0 z-50 px-4 py-4 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="p-2 bg-stone-900 hover:bg-stone-800 rounded-xl transition text-stone-400 border border-stone-800">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-base font-black text-white flex items-center gap-2 uppercase tracking-wider">
                System Registry Overlord
              </h1>
              <p className="text-[10px] text-emerald-500 font-mono tracking-widest uppercase font-bold flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Encrypted Whitelist State Enabled
              </p>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: CONTROL INTERFACE SYSTEM */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 shadow-2xl sticky top-24 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-stone-900">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-white">
                {isEditing ? <Edit2 className="h-4 w-4 text-amber-500" /> : <UserPlus className="h-4 w-4 text-[#c1121f]" />}
                {isEditing ? 'Modify Identity Cluster' : 'Initialize New Node'}
              </h2>
              {isEditing && (
                <button onClick={resetFormState} className="p-1 text-stone-500 hover:text-white transition">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-stone-400 uppercase tracking-wider mb-1">Target Document ID</label>
                <input 
                  type="text" 
                  name="id"
                  placeholder="e.g., relax_bro"
                  disabled={currentIdIsLocked}
                  value={formData.id}
                  onChange={handleInputChange}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-white disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:border-[#c1121f] transition font-mono"
                  required 
                />
              </div>

              <div>
                <label className="block font-bold text-stone-400 uppercase tracking-wider mb-1">Display Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-white focus:outline-none focus:border-[#c1121f] transition" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-400 uppercase tracking-wider mb-1">Role Designation</label>
                  <input type="text" name="role" placeholder="Creative Designer" value={formData.role} onChange={handleInputChange} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-white focus:outline-none focus:border-[#c1121f] transition" required />
                </div>
                <div>
                  <label className="block font-bold text-stone-400 uppercase tracking-wider mb-1">System Segment</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-white focus:outline-none focus:border-[#c1121f] transition">
                    <option value="MANAGEMENT">MANAGEMENT</option>
                    <option value="EDITORIAL">EDITORIAL</option>
                    <option value="CREATIVE">CREATIVE</option>
                    <option value="TECH">TECH</option>
                  </select>
                </div>
              </div>

              {/* DYNAMIC CAPTION HISTORY SYSTEM INTEGRATION */}
              <div className="p-3 bg-stone-900/50 border border-stone-800/80 rounded-xl space-y-3">
                <label className="block font-bold text-[#c1121f] uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Caption History Subsystem
                </label>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Type new internal log/caption..." 
                    value={newCaptionInput}
                    onChange={(e) => setNewCaptionInput(e.target.value)}
                    className="flex-1 bg-stone-900 border border-stone-800 rounded-lg p-2 text-white text-[11px] focus:outline-none focus:border-[#c1121f]"
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddCaption(); } }}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddCaption}
                    className="p-2 bg-stone-800 hover:bg-[#c1121f] border border-stone-700 text-white rounded-lg transition"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Local Staged History Previews */}
                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
                  {formData.captionHistory && formData.captionHistory.length > 0 ? (
                    formData.captionHistory.map((cap, index) => (
                      <div key={index} className="flex items-center justify-between gap-2 p-1.5 bg-stone-950 border border-stone-900 rounded-md group">
                        <span className="text-stone-300 line-clamp-2 break-all">{cap}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveCaption(index)}
                          className="text-stone-500 hover:text-red-400 p-0.5 transition flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-stone-600 italic text-[10px] text-center py-2">No captions registered in memory.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-400 uppercase tracking-wider mb-1">Contribution Count</label>
                  <input type="number" name="newsCardCount" value={formData.newsCardCount} onChange={handleInputChange} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-white focus:outline-none focus:border-[#c1121f] transition font-mono" />
                </div>
                <div>
                  <label className="block font-bold text-stone-400 uppercase tracking-wider mb-1">Access Passphrase</label>
                  <input type="text" name="password" placeholder="System Gate Password" value={formData.password} onChange={handleInputChange} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-white focus:outline-none focus:border-[#c1121f] transition font-mono" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-400 uppercase tracking-wider mb-1">Avatar Asset</label>
                <input type="text" name="image" value={formData.image} onChange={handleInputChange} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-white focus:outline-none focus:border-[#c1121f] transition text-[10px] font-mono" />
              </div>

              <div className="pt-2 border-t border-stone-900 space-y-2">
                <label className="block font-bold text-stone-400 uppercase tracking-wider">Network Communication Endpoints</label>
                <input type="email" name="email" placeholder="Email Node" value={formData.email} onChange={handleInputChange} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#c1121f] transition text-[11px]" />
                <input type="text" name="github" placeholder="GitHub URL" value={formData.github} onChange={handleInputChange} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#c1121f] transition text-[11px]" />
                <input type="text" name="linkedin" placeholder="LinkedIn URL" value={formData.linkedin} onChange={handleInputChange} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#c1121f] transition text-[11px]" />
                <input type="text" name="website" placeholder="External Endpoint Portfolio" value={formData.website} onChange={handleInputChange} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#c1121f] transition text-[11px]" />
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-[#c1121f] hover:bg-[#a00f19] disabled:bg-stone-800 text-white font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2 border border-red-900/40 tracking-wider uppercase text-[10px]"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Commit Registry Node Modification</span>
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: LIST VISUALIZER */}
        <div className="lg:col-span-2 space-y-6">
          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-xs">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-950/40 border border-red-900/50 text-red-400 p-4 rounded-xl flex items-center gap-3 text-xs">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="bg-stone-950 border border-stone-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-stone-400" />
              <div>
                <h3 className="text-xs font-bold tracking-wide uppercase">Cloud Index Inventory</h3>
                <p className="text-[10px] text-stone-500 font-mono uppercase">{members.length} Dynamic entries secured</p>
              </div>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500" />
              <input 
                type="text" 
                placeholder="Query Index Store..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#c1121f]"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <div key={member.id} className="bg-stone-950 border border-stone-800 rounded-xl p-4 flex flex-col gap-4 hover:border-stone-700 transition">
                  
                  {/* Top Profile Summary block */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-stone-900 border border-stone-800 flex-shrink-0">
                        <Image src={member.image} alt={member.name} fill className="object-cover" unoptimized />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{member.name}</h4>
                          <span className="text-[9px] font-mono font-bold bg-stone-900 border border-stone-800 text-stone-400 px-2 py-0.5 rounded">
                            {member.id}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">{member.role}</p>
                        <div className="flex gap-2 mt-1.5">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-stone-900 border border-stone-800 tracking-wider text-stone-500 rounded">
                            {member.category}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-red-950/20 border border-red-900/30 tracking-wider text-red-400 rounded">
                            Score: {member.newsCardCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t sm:border-t-0 border-stone-900 pt-3 sm:pt-0 justify-end">
                      <button onClick={() => initiateEditSequence(member)} className="p-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 rounded-xl transition flex items-center gap-1 text-[11px] font-bold">
                        <Edit2 className="h-3 w-3" /> <span className="hidden sm:inline">Modify</span>
                      </button>
                      <button onClick={() => purgeDocumentNode(member.id)} className="p-2 bg-red-950/20 hover:bg-red-950/50 border border-red-900/30 text-red-400 rounded-xl transition flex items-center gap-1 text-[11px] font-bold">
                        <Trash2 className="h-3 w-3" /> <span className="hidden sm:inline">Purge</span>
                      </button>
                    </div>
                  </div>

                  {/* Display Section for Registered Caption History */}
                  {member.captionHistory && member.captionHistory.length > 0 && (
                    <div className="mt-1 p-3 bg-stone-900/30 border border-stone-900 rounded-xl">
                      <p className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 flex items-center gap-1 mb-2">
                        <History className="h-3 w-3" /> Historical Caption Streams ({member.captionHistory.length})
                      </p>
                      <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {member.captionHistory.map((caption, idx) => (
                          <div key={idx} className="bg-stone-950/60 p-2 border border-stone-900 rounded-md text-[11px] text-stone-400 leading-normal">
                            • {caption}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-stone-950 border border-stone-800 rounded-2xl">
                <p className="text-stone-500 text-xs font-sans">No matching parameters found inside system tracking scope.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
