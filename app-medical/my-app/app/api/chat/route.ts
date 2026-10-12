import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

// Initialize the Gemini SDK
// Make sure to set GEMINI_API_KEY in your .env.local file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: `You are Medinex AI, a helpful medical assistant by Medinex World.
You understand and can respond in Hindi, English, Hinglish, and other Indian regional languages.
If the user writes in Hindi or any Indian language, respond in that same language.
Always keep the JSON keys in English but the values should be in the user's language.

Do NOT give strict medical prescriptions.
Always suggest consulting a real doctor.
Give safe, general advice only.

You MUST respond strictly in the following JSON format:
{
  "causes": ["cause 1", "cause 2"],
  "remedies": ["remedy 1", "remedy 2"],
  "specialist": "Must be EXACTLY one of: General Physician, Cardiologist, Dermatologist, ENT Specialist, Pediatrician, Orthopedic, Gynecologist, Neurologist, Dentist, Psychiatrist",
  "disclaimer": "This is a simulated AI analysis, not a medical diagnosis. Please consult a doctor immediately if symptoms are severe."
}`
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: message }] }],
      generationConfig: { 
        responseMimeType: "application/json" 
      }
    });

    const reply = result.response.text();
    const jsonReply = reply ? JSON.parse(reply) : { error: "Failed to parse response" };

    return NextResponse.json(jsonReply);
    
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: error.message || "Failed to communicate with AI" }, { status: 500 });
  }
}
