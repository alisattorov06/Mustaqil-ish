import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface PaperData {
  fullName: string;
  subject: string;
  topic: string;
  plans: string[];
  authorInfo: string;
  abstract: string;
  keywords: string;
  fontSize: number;
  fontFamily: string;
  lineSpacing: number;
  pageCount: number;
}

export async function generatePaper(data: PaperData) {
  const prompt = `
    Siz professional akademik yozuvchisiz. Quyidagi ma'lumotlar asosida O'zbekiston oliy ta'lim muassasalari standartlariga mos keladigan "Mustaqil ish" yozib bering.
    
    Talaba: ${data.fullName}
    Fan: ${data.subject}
    Mavzu: ${data.topic}
    Muallif haqida ma'lumot: ${data.authorInfo}
    Annotatsiya: ${data.abstract}
    Kalit so'zlar: ${data.keywords}
    Sahifalar soni: ${data.pageCount} sahifa (Har bir sahifa taxminan 300-400 so'zdan iborat bo'lishi kerak)
    Reja:
    ${data.plans.map((p, i) => `${i + 1}. ${p}`).join('\n')}
    
    MUHIM TALABLAR:
    1. FAQAT ODDIY MATN (PLAIN TEXT) QAYTARILSIN. Markdown belgilari (#, ##, **, _, [ ], etc.) va HTML elementlarini ISHLATMANG.
    2. Sarlavhalarni katta harflar bilan va alohida qatorda yozing (masalan: KIRISH, ASOSIY QISM, XULOSA).
    3. Hujjat hajmi ${data.pageCount} sahifaga mos bo'lishi uchun matnni yetarlicha kengaytiring. Har bir reja bandi bo'yicha batafsil va ilmiy tahliliy ma'lumot bering.
    4. Hujjat tarkibi:
       - Sarlavha (Mavzu, talaba va fan ma'lumotlari)
       - Annotatsiya va Kalit so'zlar
       - Kirish
       - Asosiy qism (Rejadagi har bir band bo'yicha)
       - Xulosa
       - Foydalanilgan adabiyotlar

    Formatlash talablari:
    - Shrift: ${data.fontFamily}
    - Shrift o'lchami: ${data.fontSize}pt
    - Qatorlar oralig'i (Interval): ${data.lineSpacing}
    
    Matn professional, ilmiy va imlo xatolarisiz bo'lsin.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });

  return response.text;
}
