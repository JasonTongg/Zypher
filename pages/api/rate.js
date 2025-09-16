// pages/api/rate.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { joke } = req.body;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Rate this joke from 1 (very bad) to 10 (very funny). Only return the number.\nJoke: "${joke}"`;

        const result = await model.generateContent(prompt);
        const rating = result.response.text().trim();

        res.status(200).json({ rating }); // <- jangan pakai backtick atau tanda ``` di sini
    } catch (error) {
        res.status(500).json({ error: "Gemini request failed", details: error.message });
    }
}
