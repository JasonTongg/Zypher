import React, { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { useAccount, useWriteContract, useToken, useReadContract } from "wagmi";
import { ethers } from "ethers";
import { useDispatch } from "react-redux";
import { setBalance } from "../store/data";
import { ToastContainer, toast } from "react-toastify";
// import { waitForTransactionReceipt } from "wagmi/actions";
import { useWaitForTransactionReceipt } from "wagmi";
import JokesTitle from "../public/assets/JokesTitle.png";
import Image from "next/image";
import JokesResult from "../public/assets/JokesResult.png";
import StartButton from "../public/assets/SubmitButton.png";

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

export default function Hero() {
  const [isMinting, setIsMinting] = useState(false);
  const { address: userAddress, isConnected, chainId } = useAccount();
  const tokenAddress = "0xAad8792DdDbE35e49D3E7b39359B6cBBDF712f0f";
  const dispatch = useDispatch();
  const [jokes, setJokes] = useState("");

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

  async function rateJoke(joke) {
    let resp = await fetch("/api/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joke })
    });
    resp = await resp.json();
    console.log(resp);
    if (Number(resp.rating) < 5) {
      toast.dark("Your joke is bad");
    } else if (Number(resp.rating) === 5 || Number(resp.rating) === 7 || Number(resp.rating) === 6) {
      toast.dark("Your joke is okay");
      sendTokenToMe("25");
    } else if (Number(resp.rating) === 8 || Number(resp.rating) === 9) {
      toast.dark("Your joke is good");
      sendTokenToMe("100");
    } else {
      toast.dark("Your joke is very funny!");
      sendTokenToMe("300");
    }
  }


  return (
    <div className="bg-jokes w-full min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center gap-6 w-full"
      >
        <Image src={JokesTitle} alt="Jokes title" className="h-auto sm:!h-[30vh] w-[80vw] sm:w-auto " />
        <textarea
          cols={30}
          rows={2}
          type="text"
          placeholder="Tell your joke here…"
          onChange={(e) => setJokes(e.target.value)}
          className="
            w-full max-w-md
            rounded-xl
            bg-[#FDE5B2]           /* warna perkamen */
            border-4 border-[#F5BE52]  /* bingkai emas/cokelat */
            shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)]
            px-4 py-3
            font-serif text-lg
            placeholder:text-[#8b6a2b]
            focus:outline-none focus:ring-2 focus:ring-[#e0c98d]
          "
        />
        <button onClick={() => rateJoke(jokes)}>
          <Image src={StartButton} className="w-[150px] h-auto" />
        </button>
      </motion.div>
    </div>
  );
}
