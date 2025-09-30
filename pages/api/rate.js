import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const dataFile = path.join(process.cwd(), "data/gold.json");
const jokesFile = path.join(process.cwd(), "data/jokes.json");

function loadData() {
	if (!fs.existsSync(dataFile)) return {};
	return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
}

function saveData(data) {
	fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

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

	const jokesForWallet = jokesData[normalizedAddress];
	if (!jokesForWallet || jokesForWallet.length === 0) return false;

	const updatedJokes = jokesForWallet.filter(
		(j) => j.toLowerCase() !== normalizedJoke
	);

	if (updatedJokes.length === jokesForWallet.length) return false;

	if (updatedJokes.length > 0) {
		jokesData[normalizedAddress] = updatedJokes;
	} else {
		delete jokesData[normalizedAddress];
	}

	try {
		fs.writeFileSync(jokesFile, JSON.stringify(jokesData, null, 2), "utf-8");
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
		let data = loadData();
		let today = new Date().toISOString().split("T")[0];

		if (!data[wallet]) {
			data[wallet] = {
				dailyGold: 0,
				lastUpdated: today,
				totalGold: 0,
				dailyAttempts: 0,
			};
		}

		if (data[wallet].lastUpdated !== today) {
			data[wallet].dailyGold = 0;
			data[wallet].lastUpdated = today;
			data[wallet].totalGold = 0;
			data[wallet].dailyAttempts = 0;
		}

		if (data[wallet].dailyAttempts >= 10) {
			return res.status(200).json({
				rating: 0,
				response: "I have enough for today, come back to me tomorrow !",
				gold: 0,
				dailyGold: data[wallet].dailyGold,
				totalGold: data[wallet].totalGold,
				dailyAttempts: data[wallet].dailyAttempts,
			});
		}

		const prompt = `
You are a mighty king giving royal feedback to jokers.
Instructions:
1. Rate the joke from 1 (very poor) to 10 (most splendid).
2. Give feedback in a kingly tone, max 65 characters and min 40 characters.
   - Use varied medieval words (quip, folly, riddle, humor, tale, banter).
   - Do NOT always use the word "jest".
   - Ensure responses are creative and not repetitive.
   - Always include the exact TGG Gold amount inside the feedback.
   - Can change the position of the TGG Gold amount in the sentence, dont always in the end.
   - Example:
	 "Behold! 120 TGG Gold for thy quip that stirreth mirth!"
	 "Thy riddle earns 80 TGG Gold, though it falters in wit."
	 "For thy humble folly, I grant thee 60 TGG Gold, knave!"
	 "A fair 150 TGG Gold shall be thine for such lively humor."
	 "Take 40 TGG Gold, for thy banter barely pleased the hall."
	 "Thou claim 200 TGG Gold, for thy tale doth truly delight!"
	 "Merriment is thine! Receive 90 TGG Gold for thy sharp quip."
	 "Lo! 55 TGG Gold be granted, though thy riddle be feeble."
	 "For wit most radiant, 170 TGG Gold floweth to thy purse!"
	 "With but mild humor, 45 TGG Gold is still thy reward."
	 "The court doth cheer, thus 125 TGG Gold is thy rightful prize."
	 "In my mercy, I gift thee 30 TGG Gold for thy weak folly."
	 "Thou hast stirred a chuckle; 140 TGG Gold hence is thine!"
	 "A splendid quip! Thou receiveth 180 TGG Gold this eve."
	 "Even thy dull banter shall fetch thee 35 TGG Gold, fool."
   - Make sure you DO NOT response like this, or similar like this, make sure you return number:
     "Your joke is bad, you get {GOLD} TGG Gold."
     "Your joke is bad, you get <GOLD> TGG Gold."
	
3. Only generate rating and response (gold will be assigned by server).
Return ONLY JSON (no markdown, no backticks):
{"rating": number, "response": "royal feedback"}
Joke: "${joke}"
		`;

		const completion = await openai.chat.completions.create({
			model: "gpt-5-nano",
			messages: [{ role: "user", content: prompt }],
			temperature: 1,
		});

		let text = completion.choices[0].message.content.trim();
		if (text.startsWith("```")) {
			text = text.replace(/```json|```/g, "").trim();
		}

		let parsed;
		try {
			parsed = JSON.parse(text);
		} catch (e) {
			removeJokes(wallet, joke);
			return res.status(500).json({
				error: "Failed to parse OpenAI response, joke removed",
				raw: text,
			});
		}

		let { rating, response } = parsed;

		let gold = 0;
		if (data[wallet].totalGold >= 200) {
			gold = 0;
		} else if (data[wallet].dailyGold >= 100) {
			if (rating <= 3) gold = 1;
			else if (rating <= 7) gold = 2;
			else gold = 3;
		} else {
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
		data[wallet].dailyAttempts += 1;
		saveData(data);

		if (gold > 0) {
			response = response.replace(/\{GOLD\}/g, `${gold}`);
			response = response.replace(/\d+\s*TGG Gold/, `${gold} TGG Gold`);
		} else {
			response =
				"You have reached the daily maximum limit. No more TGG Gold can be awarded today.";
		}

		res.status(200).json({
			rating,
			response,
			gold,
			dailyGold: data[wallet].dailyGold,
			totalGold: data[wallet].totalGold,
			dailyAttempts: data[wallet].dailyAttempts,
		});
	} catch (error) {
		removeJokes(wallet, joke);
		res.status(500).json({
			error: "OpenAI request failed, joke removed",
			details: error.message,
		});
	}
}
