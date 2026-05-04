import { GoogleGenAI, Type } from "@google/genai";
import { GPMState, GPMResponse } from "../types";
import { SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateGPMResponse(state: GPMState): Promise<GPMResponse> {
  const prompt = `Architect a complete GPM session based on this state context: ${JSON.stringify(state, null, 2)}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          optionA: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              masterStyleVector: { type: Type.STRING },
              lyricScript: { type: Type.STRING },
              geniusNotes: { type: Type.STRING },
            },
            required: ["title", "masterStyleVector", "lyricScript", "geniusNotes"],
          },
          optionB: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              masterStyleVector: { type: Type.STRING },
              lyricScript: { type: Type.STRING },
              geniusNotes: { type: Type.STRING },
            },
            required: ["title", "masterStyleVector", "lyricScript", "geniusNotes"],
          },
          sessionMap: {
            type: Type.OBJECT,
            properties: {
              chords: { type: Type.STRING },
              mastering: { type: Type.STRING },
              inspiration: { type: Type.STRING },
            },
            required: ["chords", "mastering", "inspiration"],
          },
        },
        required: ["optionA", "optionB", "sessionMap"],
      },
    },
  });

  return JSON.parse(response.text);
}

export async function sendChatMessage(state: GPMState, message: string, history: any[]): Promise<string> {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: CHAT_SYSTEM_PROMPT,
    },
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    })),
  });

  const context = `CURRENT BOARD STATE CONTEXT:\n${JSON.stringify(state, null, 2)}\n\nUSER MESSAGE: ${message}`;
  const response = await chat.sendMessage({ message: context });
  return response.text;
}


