import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    
    if (!body || !body.headline) {
      return NextResponse.json({ error: 'Headline missing' }, { status: 400 });
    }

    // ফ্রন্টএন্ডের স্টেট অনুযায়ী langMode রিসিভ করা হচ্ছে (Default: 'BN')
    const { headline, subHeadline, image, langMode = 'BN' } = body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key Missing' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const contents: any[] = [];

    // ১. ইমেজ হ্যান্ডেলিং (যদি থাকে)
    if (image && typeof image === 'string' && image.startsWith('data:image')) {
      try {
        const parts = image.split(',');
        const base64Data = parts[1];
        const mimeType = parts[0].split(';')[0].split(':')[1] || 'image/jpeg';
        
        if (base64Data) {
          contents.push({
            inlineData: { data: base64Data, mimeType }
          });
        }
      } catch (imgErr) {
        console.error("Image parse error, skipping image:", imgErr);
      }
    }

    // ২. langMode ('EN' vs 'BN') এর ওপর ভিত্তি করে ডাইনামিক প্রম্পট কন্ডিশন
    const isEnglish = langMode === 'EN';
    
    const languageInstruction = isEnglish 
      ? `২. তথ্যের ওপর ভিত্তি করে ফেসবুক বা সোশ্যাল মিডিয়ার জন্য একটি অত্যন্ত আকর্ষণীয়, প্রফেশনাল ও এনগেজিং ইংরেজি (English) ক্যাপশন তৈরি করো। ক্যাপশনে মানানসই ইমোজি ব্যবহার করবে।
         ৩. ক্যাপশনের নিচে ৪-৫টি প্রাসঙ্গিক ও ট্রেন্ডিং ইংরেজি হ্যাশট্যাগ (#) যোগ করো।`
      : `২. তথ্যের ওপর ভিত্তি করে ফেসবুক বা সোশ্যাল মিডিয়ার জন্য একটি আকর্ষণীয় ও চমৎকার বাংলা (Bangla) ক্যাপশন তৈরি করো। ক্যাপশনে মানানসই ইমোজি ব্যবহার করবে।
         ৩. ক্যাপশনের নিচে ৪-৫টি প্রাসঙ্গিক ও ট্রেন্ডিং বাংলা হ্যাশট্যাগ (#) যোগ করো।`;

    const prompt = `
      নিচের নিউজ হেডলাইন এবং সাব-হেডলাইনটি বিশ্লেষণ করো।
      ১. ইন্টারনেট (Google Search) ব্যবহার করে এই খবরের মূল সত্যতা এবং লেটেস্ট আপডেট জেনে নাও।
      ${languageInstruction}

      ইনপুট ডেটা:
      - হেডলাইন: "${headline}"
      - সাব-হেডলাইন: "${subHeadline || ''}"
    `;
    
    // SDK স্ট্রাকচার ঠিক রাখতে অবজেক্ট আকারে টেক্সট পুশ করা হলো
    contents.push({ text: prompt });

    // ৩. এপিআই কল (gemini-2.5-flash এবং লাইভ গুগল সার্চ এনাবলড)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: contents,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    if (!response || !response.text) {
      throw new Error("Gemini returned empty text");
    }

    return NextResponse.json({ caption: response.text });

  } catch (error: any) {
    console.error('--- GEMINI API ERROR LOG ---', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message || String(error) }, 
      { status: 500 }
    );
  }
}
