'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('tk_user_session');
    if (!session) {
      // Not logged in -> Send back to main portal home page instantly
      router.replace('/');
    } else {
      setVerified(true);
    }
  }, [router]);

  if (!verified) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#800020] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
