// pages/api/burn.js
export default function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT;

	return res.json({
		tokenAddress,
		abi: [
			{
				name: "burn",
				type: "function",
				stateMutability: "nonpayable",
				inputs: [{ name: "amount", type: "uint256" }],
				outputs: [],
			},
		],
	});
}
