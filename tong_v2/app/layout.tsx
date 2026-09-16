import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: { default: 'টং-এর খবর | TongerKhobor', template: '%s | TongerKhobor' },
  description: 'Spreading tea from a tong to the world.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="bn"><body><header className="masthead"><div className="topline"><span>ঢাকা • বাংলাদেশ</span><span>সত্য, দ্রুততা, মানুষের গল্প</span></div><div className="brandrow"><Link href="/" className="brand">টং-এর খবর<span>●</span></Link><nav><Link href="/">হোম</Link><Link href="/category/জাতীয়">জাতীয়</Link><Link href="/category/রাজনীতি">রাজনীতি</Link><Link href="/category/খেলা">খেলা</Link><Link href="/category/বিনোদন">বিনোদন</Link><Link href="/trending">ট্রেন্ডিং</Link></nav><Link href="/search" className="searchlink">⌕ খুঁজুন</Link></div></header><main>{children}</main><footer><div><strong>টং-এর খবর</strong><p>Spreading tea from a tong to the world.</p></div><div><span>© 2026 TongerKhobor</span><br/><a href="mailto:teamtongerkhobor@gmail.com">teamtongerkhobor@gmail.com</a></div></footer></body></html>;
}
