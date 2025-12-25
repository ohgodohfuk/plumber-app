// app/api/transcribe/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No audio file received" }, { status: 400 });
    }

    console.log("Transcribing audio...", file.size, file.type);

    // Convert the file to a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a File object that OpenAI can read
    // We cast to 'any' to avoid TypeScript issues with Node.js File types vs Web File types
    const fileObj = new File([buffer], "audio.webm", { type: file.type });

    const transcription = await openai.audio.transcriptions.create({
      file: fileObj,
      model: "whisper-1",
      language: "en",
      prompt: "Plumbing log. Technical terms: PEX, PVC, HVAC, PSI, coupler, flange, soldering.", 
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error: any) {
    console.error("Transcription Error:", error);
    return NextResponse.json({ error: error.message || "Transcription failed" }, { status: 500 });
  }
}