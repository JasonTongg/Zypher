import { ethers } from "ethers";

const TOKEN_ABI = [
	{
		inputs: [
			{ internalType: "address", name: "to", type: "address" },
			{ internalType: "uint256", name: "amount", type: "uint256" },
			{ internalType: "bytes", name: "signature", type: "bytes" },
		],
		name: "mintWithSig",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "address", name: "owner", type: "address" }],
		name: "tokenNonces",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
];

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { to, amount } = req.body;

	if (!to || !amount) {
		return res.status(400).json({ error: "Missing to/amount" });
	}

	if (!ethers.isAddress(to)) {
		return res.status(400).json({ error: "Invalid address" });
	}

	try {
		const provider = new ethers.JsonRpcProvider(
			"https://mainnet-rpc.helachain.com"
		);
		const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

		const contract = new ethers.Contract(
			process.env.NEXT_PUBLIC_TOKEN_CONTRACT,
			TOKEN_ABI,
			wallet
		);

		const nonce = await contract.tokenNonces(to);

		const messageHash = ethers.solidityPackedKeccak256(
			["address", "address", "uint256", "uint256"],
			[process.env.NEXT_PUBLIC_TOKEN_CONTRACT, to, amount, nonce]
		);

		const signature = await wallet.signMessage(ethers.getBytes(messageHash));

		return res.json({
			to,
			amount,
			nonce: nonce.toString(),
			signature,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
}
