import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "walletPoints.json");

export default function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Only POST allowed" });
	}

	const { address, point } = req.body;

	if (!address || typeof point !== "number") {
		return res.status(400).json({ error: "address and point are required" });
	}

	try {
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

		let data = {};
		if (fs.existsSync(filePath)) {
			const raw = fs.readFileSync(filePath, "utf8");
			data = raw ? JSON.parse(raw) : {};
		}

		data[address] = point;

		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

		return res.status(200).json({ message: "Saved successfully", data });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
}
