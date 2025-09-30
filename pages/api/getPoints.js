import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "walletPoints.json");

export default function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Only GET allowed" });
	}

	try {
		if (!fs.existsSync(filePath)) {
			return res.status(200).json({ data: [], user: null });
		}

		const raw = fs.readFileSync(filePath, "utf8");
		const json = raw ? JSON.parse(raw) : {};

		const arr = Object.entries(json).map(([address, point]) => ({
			address,
			point,
		}));

		arr.sort((a, b) => b.point - a.point);

		const { address } = req.query;
		let user = null;

		if (address) {
			const idx = arr.findIndex(
				(item) => item.address.toLowerCase() === address.toLowerCase()
			);
			if (idx !== -1) {
				user = {
					address: arr[idx].address,
					point: arr[idx].point,
					rank: idx + 1,
				};
			} else {
				user = { address, point: 0, rank: null };
			}
		}

		return res.status(200).json({ data: arr, user });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
}
