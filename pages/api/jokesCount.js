import fs from "fs";
import path from "path";

export default function handler(req, res) {
	try {
		const filePath = path.join(process.cwd(), "data", "jokes.json");
		const rawData = fs.readFileSync(filePath, "utf-8");
		const jokesData = JSON.parse(rawData);

		const result = Object.entries(jokesData).map(([wallet, jokes]) => ({
			wallet,
			totalJokes: jokes.length,
		}));

		result.sort((a, b) => b.totalJokes - a.totalJokes);

		res.status(200).json(result);
	} catch (error) {
		console.error("API Error:", error);
		res.status(500).json({ error: "Failed to load jokes data" });
	}
}
