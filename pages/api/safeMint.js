// pages/api/safeMint.js
import { ethers } from "ethers";

// ABI minimal untuk currentNonce & safeMintWithSig
const NFT_ABI = [
    {
        inputs: [],
        name: "currentNonce",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "nonce", type: "uint256" },
            { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        name: "safeMintWithSig",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },
];

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { to } = req.body;

    if (!to) return res.status(400).json({ error: "Missing `to` address" });
    if (!ethers.isAddress(to))
        return res.status(400).json({ error: "Invalid address" });

    if (!process.env.PRIVATE_KEY || !process.env.RPC_URL || !process.env.NFT_CONTRACT) {
        return res.status(500).json({ error: "Server environment not properly set" });
    }

    try {
        // Connect provider & wallet
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

        // Connect contract
        const contract = new ethers.Contract(process.env.NFT_CONTRACT, NFT_ABI, signer);

        // Ambil nonce
        const nonce = await contract.currentNonce();

        // Buat hash
        const messageHash = ethers.solidityPackedKeccak256(
            ["address", "address", "uint256"],
            [process.env.NFT_CONTRACT, to, nonce]
        );

        // Sign hash
        const signature = await signer.signMessage(ethers.getBytes(messageHash));

        // Kirim balik
        return res.json({
            to,
            nonce: nonce.toString(),
            signature,
        });
    } catch (err) {
        return res.status(500).json({
            error: err.message,
            stack: err.stack,
            name: err.name,
            code: err.code || null,
        });
    }
}
