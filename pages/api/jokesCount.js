import fs from "fs";
import path from "path";

export default function handler(req, res) {
	try {
		const filePath = path.join(process.cwd(), "data", "jokes.json");
		const rawData = fs.readFileSync(filePath, "utf8");
		const jokesData = JSON.parse(rawData);

		const result = Object.entries(jokesData).map(([wallet, jokes]) => ({
			wallet,
			totalJokes: jokes.length,
		}));

		result.sort((a, b) => b.totalJokes - a.totalJokes);

		const walletCount = Object.keys(jokesData).length;
		const totalJokes = Object.values(jokesData).reduce(
			(sum, jokes) => sum + jokes.length,
			0
		);

		res.status(200).json({
			walletCount,
			totalJokes,
			details: result,
		});
	} catch (error) {
		console.error("API Error:", error);
		res.status(500).json({ error: "Failed to load jokes data" });
	}
}
