// pages/api/rate.js
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const dataFile = path.join(process.cwd(), "data/gold.json");
const jokesFile = path.join(process.cwd(), "data/jokes.json");

// === Gold Data Helpers ===
function loadData() {
	if (!fs.existsSync(dataFile)) return {};
	return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
}

function saveData(data) {
	fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// === Remove Jokes Helper ===
function removeJokes(address, joke) {
	if (!fs.existsSync(jokesFile)) return false;

	let jokesData;
	try {
		jokesData = JSON.parse(fs.readFileSync(jokesFile, "utf-8"));
	} catch (err) {
		console.error("Failed to read jokes.json:", err);
		return false;
	}

	const normalizedAddress = address;
	const normalizedJoke = joke.toLowerCase();

	// Cari jokes untuk wallet
	const jokesForWallet = jokesData[normalizedAddress];
	if (!jokesForWallet || jokesForWallet.length === 0) return false;

	// Filter keluar joke yg dimaksud
	const updatedJokes = jokesForWallet.filter(
		(j) => j.toLowerCase() !== normalizedJoke
	);

	// Kalau sama panjang berarti ga ketemu
	if (updatedJokes.length === jokesForWallet.length) return false;

	// Update
	if (updatedJokes.length > 0) {
		jokesData[normalizedAddress] = updatedJokes;
	} else {
		delete jokesData[normalizedAddress]; // hapus wallet kalau kosong
	}

	try {
		fs.writeFileSync(jokesFile, JSON.stringify(jokesData, null, 2), "utf-8");
		console.log(`Removed joke for ${normalizedAddress}: "${normalizedJoke}"`);
		return true;
	} catch (err) {
		console.error("Failed to write jokes.json:", err);
		return false;
	}
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { wallet, joke } = req.body;
	if (!wallet) {
		return res.status(400).json({ error: "Wallet required" });
	}

	try {
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
3. Only generate rating and response (gold will be assigned by server).
Return ONLY JSON (no markdown, no backticks):
{"rating": number, "response": "royal feedback"}
Joke: "${joke}"
    `;

		const completion = await openai.chat.completions.create({
			model: "gpt-4.1-nano",
			messages: [{ role: "user", content: prompt }],
			temperature: 0.7,
		});

		let text = completion.choices[0].message.content.trim();
		if (text.startsWith("```")) {
			text = text.replace(/```json|```/g, "").trim();
		}

		let parsed;
		try {
			parsed = JSON.parse(text);
			// throw new Error("Invalid response structure");
		} catch (e) {
			// ❌ Parsing gagal → remove joke
			removeJokes(wallet, joke);
			return res.status(500).json({
				error: "Failed to parse OpenAI response, joke removed",
				raw: text,
			});
		}

		let { rating, response } = parsed;

		// === Gold calculation ===
		let data = loadData();
		let today = new Date().toISOString().split("T")[0];
		if (!data[wallet]) {
			data[wallet] = { dailyGold: 0, lastUpdated: today, totalGold: 0 };
		}
		if (data[wallet].lastUpdated !== today) {
			data[wallet].dailyGold = 0;
			data[wallet].lastUpdated = today;
		}

		let gold = 0;
		if (data[wallet].totalGold >= 200) {
			gold = 0; // cap reached
		} else if (data[wallet].dailyGold >= 100) {
			// reduced scheme
			if (rating <= 3) gold = 1;
			else if (rating <= 7) gold = 2;
			else gold = 3;
		} else {
			// normal scheme
			if (rating === 1) gold = 1;
			else if (rating === 2) gold = 2;
			else if (rating === 3) gold = 3;
			else if (rating === 4) gold = 5;
			else if (rating === 5) gold = 10;
			else if (rating === 6) gold = 13;
			else if (rating === 7) gold = 18;
			else if (rating === 8) gold = 25;
			else if (rating === 9) gold = 35;
			else if (rating === 10) gold = 45;
		}

		data[wallet].dailyGold += gold;
		data[wallet].totalGold += gold;
		saveData(data);

		if (gold > 0) {
			response = response.replace(/\d+\s*ATK Gold/, `${gold} ATK Gold`);
		} else {
			response =
				"You have reached the daily maximum limit. No more ATK Gold can be awarded today.";
		}

		res.status(200).json({
			rating,
			response,
			gold,
			dailyGold: data[wallet].dailyGold,
			totalGold: data[wallet].totalGold,
		});
	} catch (error) {
		// ❌ OpenAI request gagal → remove joke
		removeJokes(wallet, joke);
		res.status(500).json({
			error: "OpenAI request failed, joke removed",
			details: error.message,
		});
	}
}
