import {getArticle,articles} from '../../lib/data';
import Link from 'next/link';
import {notFound} from 'next/navigation';
export function generateStaticParams(){return articles.map(a=>({slug:a.slug}))}
export default async function Article({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const a=getArticle(slug);if(!a)notFound();return <div className="wrap"><article className="article"><Link className="back" href="/">← সব খবর</Link><div className="tag" style={{marginTop:28}}>{a.category}</div><h1>{a.title}</h1><p className="dek">{a.subtitle}</p><div className="meta">{a.author} • {a.date}</div><div className="articlebody">{a.body.map((p,i)=><p key={i}>{p}</p>)}</div><div className="notice">টং-এর খবর — স্থানীয় গল্প থেকে বিশ্বের খবর। তথ্য যাচাই করে প্রকাশ করাই আমাদের লক্ষ্য।</div></article></div>}
