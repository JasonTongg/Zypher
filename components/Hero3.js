import React, { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { useAccount, useWriteContract, useToken, useReadContract } from "wagmi";
import { ethers } from "ethers";
import { useDispatch } from "react-redux";
import { setBalance } from "../store/data";
import { ToastContainer, toast } from "react-toastify";
import { useWaitForTransactionReceipt } from "wagmi";
import SpinWheel from "../components/SpinWheel";

// Lengkapi ABI (mint + balanceOf + decimals)
const ERC20_ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
];

const NFT_ABI = [
  {
    "inputs": [],
    "name": "currentNonce",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
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
]

export default function Hero() {
  const [isMinting, setIsMinting] = useState(false);
  const [isMinting2, setIsMinting2] = useState(false);
  const [isMinting3, setIsMinting3] = useState(false);
  const { address: userAddress, isConnected, chainId } = useAccount();
  const tokenAddress = "0xAad8792DdDbE35e49D3E7b39359B6cBBDF712f0f";
  const dispatch = useDispatch();
  const [reward, setReward] = useState(null);
  const [isBurnFailed, setIsBurnFailed] = useState(false);

  const { data: tokenData } = useToken({
    address: tokenAddress,
    enabled: isConnected,
  });

  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [userAddress],
    enabled: isConnected && !!userAddress,
    watch: true,
  });

  useEffect(() => {
    if (balanceData && tokenData?.decimals != null) {
      const formatted = ethers.formatUnits(balanceData, tokenData.decimals);
      dispatch(setBalance(formatted));
    }
  }, [balanceData, tokenData, isConnected, userAddress]);

  // di file Hero (hanya bagian sendTokenToMe diubah)
  const sendTokenToMe = async (amount) => {
    if (!isConnected) {
      toast.dark("Please connect your wallet first");
      return;
    }

    setIsMinting(true);
    try {
      // Convert amount (ETH string) to wei string
      const amountInWei = ethers.parseUnits(amount, 18).toString();

      // 1️⃣ Request signature & nonce from backend
      const resp = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: userAddress, amount: amountInWei }),
      });

      const data = await resp.json();

      const { signature } = data;

      // 2️⃣ Connect to user's wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userWallet = await signer.getAddress();

      // 3️⃣ Setup contract & call mintWithSig
      const contract = new ethers.Contract(
        "0xAad8792DdDbE35e49D3E7b39359B6cBBDF712f0f",
        [
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
        ],
        signer
      );

      const tx = await contract.mintWithSig(userAddress, amountInWei, signature);

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.dark(`Successfully received ${amount} Gold Coin!`);
        refetchBalance?.();
      } else {
        toast.dark("Transaction failed on-chain.");
      }

    } catch (err) {
      toast.dark(`Error: ${err.message || err}`);
    } finally {
      setIsMinting(false);
    }
  };

  const mintNFT = async () => {
    if (!isConnected) {
      toast.dark("Please connect your wallet first");
      return;
    }

    try {
      setIsMinting2(true);

      const resp = await fetch("/api/safeMint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: userAddress }),
      });

      let data;
      try {
        data = await resp.json();
      } catch (jsonErr) {
        const text = await resp.text();
        throw new Error(`Gagal parsing JSON dari server (status ${resp.status})`);
      }

      if (!resp.ok) {
        throw new Error(data.error || "Unknown error dari API");
      }

      const { nonce, signature } = data;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddr = await signer.getAddress();

      // 3️⃣ Siapkan kontrak & panggil safeMintWithSig
      const contractAddr = "0xb9833b091A7b91e4Bc993e838A26aBFBDe9dDc14";
      if (!contractAddr) {
        throw new Error("NFT_CONTRACT belum di-set di env");
      }

      const contract = new ethers.Contract(contractAddr, NFT_ABI, signer);

      const tx = await contract.safeMintWithSig(userAddress, nonce, signature);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.dark(`NFT minted! 🎉`);
      } else {
        toast.dark("Mint transaction failed");
      }
    } catch (e) {
      toast.dark(`Mint NFT error: ${e.message}`);
    } finally {
      setIsMinting2(false);
    }
  };


  const handleSendEth = async () => {
    if (!isConnected) return toast.dark("Connect your wallet first");

    try {
      setIsMinting3(true);
      toast.dark("Sending 0.1 HLUSD...");
      const resp = await fetch("/api/sendHLUSD", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userAddress,   // alamat user terhubung
          amount: "0.1" // ETH yang akan dikirim
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Unknown error");
      toast.dark(`0.1 HLUSD Sent!..`);
      setIsMinting3(false);
    } catch (e) {
      toast.dark(`Error: ${e.message}`);
    }
  };

  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");

  const burnToken = async () => {
    try {
      setLoading(true);
      setTxHash("");

      // Ambil ABI & alamat token dari API
      const resp = await fetch("/api/burn");
      const { tokenAddress, abi } = await resp.json();

      if (!window.ethereum) throw new Error("Wallet not found");

      // Minta user konek wallet
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(tokenAddress, abi, signer);

      // konversi amount ke wei (18 desimal)
      const parsed = ethers.parseUnits("100", 18);

      const tx = await contract.burn(parsed);

      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      refetchBalance?.();
      toast.dark("Game Started... Good luck!");
      setIsBurnFailed(false);
    } catch (err) {
      toast.dark("Lucky Draw failed");
      setIsBurnFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-jokes w-full min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center gap-6 rounded-3xl p-8  max-w-md w-full"
      >
        {/* <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => sendTokenToMe("1000")}
          disabled={isMinting || !isConnected}
          className={`px-8 py-4 rounded-xl font-bold text-white text-lg w-full ${isMinting || !isConnected
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600"
            } transition-all duration-300 shadow-lg`}
        >
          {isMinting ? "Sending Tokens..." : "Send Me 100 Tokens"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={mintNFT}
          disabled={isMinting2 || !isConnected}
          className={`px-8 py-4 rounded-xl font-bold text-white text-lg w-full ${isMinting2 || !isConnected
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600"
            } transition-all duration-300 shadow-lg`}
        >
          {isMinting2 ? "Sending NFTs..." : "Send Me 1 NFTs"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSendEth}
          disabled={isMinting3 || !isConnected}
          className={`px-8 py-4 rounded-xl font-bold text-white text-lg w-full ${isMinting3 || !isConnected
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600"
            } transition-all duration-300 shadow-lg`}
        >
          {isMinting3 ? "Sending NFTs..." : "Send Me 0.1 HLUSD"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={burnToken}
          disabled={loading || !isConnected}
          className={`px-8 py-4 rounded-xl font-bold text-white text-lg w-full ${loading || !isConnected
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600"
            } transition-all duration-300 shadow-lg`}
        >
          {loading ? "Burning NFTs..." : "Burn 100 Tokens"}
        </motion.button> */}
        <SpinWheel txHash={txHash} isBurnFailed={isBurnFailed} sendEth={handleSendEth} loading={loading} burnToken={burnToken} mintNft={mintNFT} sendToken={sendTokenToMe} />
      </motion.div>
    </div>
  );
}
