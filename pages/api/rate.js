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

		const prompt = `
You are a mighty king giving royal feedback to jokers.
Instructions:
1. Rate the joke from 1 (very poor) to 10 (most splendid).
2. Give feedback in a kingly tone, max 65 characters and min 40 characters.
   - Use varied medieval words (quip, folly, riddle, humor, tale, banter).
   - Do NOT always use the word "jest".
   - Ensure responses are creative and not repetitive.
   - Always include the exact ATK Gold amount inside the feedback.
   - Example:
     "Thy quip is bold, thou art granted 120 ATK Gold!"
     "A weak riddle, yet still thou receiveth 40 ATK Gold."
3. Assign ATK Gold between 1 and 300 based on funniness:
   - Poor: 1–50
   - Average: 51–150
   - Great: 151–300
Return ONLY JSON (no markdown, no backticks):
{"rating": number, "response": "royal feedback", "gold": number}

Joke: "${joke}"
        `;

		const result = await model.generateContent(prompt);

		let text = result.response.text().trim();

		// Clean ```json ... ``` if Gemini still adds it
		if (text.startsWith("```")) {
			text = text.replace(/```json|```/g, "").trim();
		}

		let parsed;
		try {
			parsed = JSON.parse(text);
		} catch (e) {
			return res
				.status(500)
				.json({ error: "Failed to parse Gemini response", raw: text });
		}

		res.status(200).json(parsed);
	} catch (error) {
		res
			.status(500)
			.json({ error: "Gemini request failed", details: error.message });
	}
}
