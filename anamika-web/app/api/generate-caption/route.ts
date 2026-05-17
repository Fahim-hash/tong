import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    
    if (!body || !body.headline) {
      return NextResponse.json({ error: 'Headline missing' }, { status: 400 });
    }

    const { headline, subHeadline, image } = body;
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

    // ২. প্রম্পট
    const prompt = `
      নিচের নিউজ হেডলাইন এবং সাব-হেডলাইনটি বিশ্লেষণ করো।
      ১. ইন্টারনেট (Google Search) ব্যবহার করে এই খবরের মূল সত্যতা এবং লেটেস্ট আপডেট জেনে নাও।
      ২. তথ্যের ওপর ভিত্তি করে ফেসবুক বা সোশ্যাল মিডিয়ার জন্য একটি আকর্ষণীয় ও চমৎকার বাংলা ক্যাপশন তৈরি করো।
      ৩. ক্যাপশনের নিচে ৪-৫টি প্রাসঙ্গিক ও ট্রেন্ডিং হ্যাশট্যাগ যোগ করো।

      ইনপুট ডেটা:
      - হেডলাইন: "${headline}"
      - সাব-হেডলাইন: "${subHeadline || ''}"
    `;
    contents.push(prompt);

    // ৩. এপিআই কল (মডেলের নাম এবং কনফিগারেশন ফিক্সড)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // নতুন SDK-এর জন্য পারফেক্ট এবং আপ-টু-ডেট মডেল
      contents: contents,
      config: {
        // নতুন @google/genai SDK-তে গুগল সার্চ এনাবল করার সঠিক নিয়ম
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
