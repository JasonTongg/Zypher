// pages/api/mintToken.js
import { ethers } from "ethers";

const TOKEN_ABI = [
	{
		inputs: [
			{ internalType: "address", name: "to", type: "address" },
			{ internalType: "uint256", name: "amount", type: "uint256" },
		],
		name: "mint",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
];

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { userAddress, amount } = req.body;

	if (!userAddress || !amount) {
		return res.status(400).json({ error: "Missing userAddress or amount" });
	}
	if (!ethers.isAddress(userAddress)) {
		return res.status(400).json({ error: "Invalid user address" });
	}

	try {
		const provider = new ethers.JsonRpcProvider(
			"https://testnet-rpc.helachain.com"
		);
		const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

		const tokenAddress = "0x676Ad0906096FAcF6657Ada95a29196E5eB94A05";
		const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, wallet);

		// directly mint tokens for the user
		const tx = await contract.mint(userAddress, amount);
		const receipt = await tx.wait();

		return res.status(200).json({
			status: "success",
			txHash: receipt.transactionHash,
			to: userAddress,
			amount,
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: err.message });
	}
}
