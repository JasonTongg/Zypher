import fs from "fs";
import path from "path";

const dataFile = path.join(process.cwd(), "data", "jokes.json");

function loadDB() {
	if (!fs.existsSync(dataFile)) return {};
	return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
}

function saveDB(db) {
	fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
}

export default function handler(req, res) {
	if (req.method === "POST") {
		const { wallet, joke } = req.body;

		if (!wallet || !joke) {
			return res.status(400).json({ error: "wallet and joke are required" });
		}

		const db = loadDB();

		if (!db[wallet]) {
			db[wallet] = [];
		}

		const normalize = (str) =>
			str
				.replace(/\r?\n|\r/g, " ")
				.trim()
				.toLowerCase();

		const normalizedJoke = normalize(joke);

		const alreadyExists = db[wallet]
			.map((item) => normalize(item))
			.includes(normalizedJoke);

		if (alreadyExists) {
			return res.status(409).json({
				error: "This joke has already been submitted for this wallet",
				jokes: db[wallet],
			});
		}

		db[wallet].push(joke);
		saveDB(db);

		return res.status(200).json({ message: "Joke saved!", jokes: db[wallet] });
	}

	res.setHeader("Allow", ["POST"]);
	res.status(405).end(`Method ${req.method} Not Allowed`);
}
