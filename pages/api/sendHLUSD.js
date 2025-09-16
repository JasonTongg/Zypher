// pages/api/sendEth.js
import { ethers } from "ethers";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { to, amount } = req.body; // amount dalam ETH (string)

        if (!to || !amount) {
            return res.status(400).json({ error: "Missing 'to' or 'amount'" });
        }

        // Provider & signer dari private key
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

        // Konversi ETH → wei
        const value = ethers.parseEther(amount);

        // Kirim transaksi
        const tx = await signer.sendTransaction({ to, value });

        // Tunggu 1 konfirmasi (opsional)
        const receipt = await tx.wait();

        return res.status(200).json({
            hash: tx.hash,
            blockNumber: receipt.blockNumber,
            status: receipt.status === 1 ? "success" : "failed",
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
