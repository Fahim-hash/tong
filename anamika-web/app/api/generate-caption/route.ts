// app/api/generate-caption/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    const { headline, subHeadline, image } = await request.json();

    if (!headline) {
      return NextResponse.json({ error: 'Headline is required' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const contents: any[] = [];

    // যদি ইমেজ থাকে (Base64 ফরম্যাটে আসবে), তবে সেটি জেমিনিকে পাঠানো হবে
    if (image) {
      const base64Data = image.split(',')[1] || image;
      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg',
        },
      });
    }

    // প্রম্পট ডিজাইন
    const prompt = `
      নিচের নিউজের হেডলাইন, সাব-হেডলাইন এবং ছবিটি বিশ্লেষণ করো।
      ১. প্রথমে ইন্টারনেট (Google Search) ব্যবহার করে এই খবরের সত্যতা এবং বিস্তারিত তথ্য জেনে নাও।
      ২. তারপর সেই তথ্যের ওপর ভিত্তি করে ফেসবুক বা সোশ্যাল মিডিয়ার জন্য একটি চমৎকার ও আকর্ষণীয় বাংলা ক্যাপশন এবং ৪-৫টি ট্রেন্ডিং হ্যাশট্যাগ তৈরি করো।
      
      হেডলাইন: "${headline}"
      সাব-হেডলাইন: "${subHeadline || ''}"
    `;
    contents.push(prompt);

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents,
      config: {
        tools: [{ googleSearch: {} }], // গুগল সার্চ এনাবল করা হলো
      },
    });

    return NextResponse.json({ caption: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
