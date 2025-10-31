import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAccount, useToken, useReadContract } from "wagmi";
import { ethers } from "ethers";
import { useDispatch } from "react-redux";
import { setBalance } from "../store/data";
import { toast } from "react-toastify";
import ScratchCard from "../components/ScratchCard";
import Navbar from "@/components/Navbar";

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

export default function GameHero() {
	const [isMinting, setIsMinting] = useState();
	const { address: userAddress, isConnected, chainId } = useAccount();
	const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT;
	const dispatch = useDispatch();
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

	async function savePoints(address, point) {
		const res = await fetch("/api/savePoints", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ address, point }),
		});

		return res.json();
	}

	useEffect(() => {
		if (balanceData && tokenData?.decimals != null) {
			const formatted = ethers.formatUnits(balanceData, tokenData.decimals);
			dispatch(setBalance(formatted));
			savePoints(userAddress, Number(formatted));
		}
	}, [balanceData, tokenData, isConnected, userAddress]);

	const sendTokenToMe = async (amount) => {
		if (!isConnected) {
			toast.dark("Please connect your wallet first");
			return;
		}

		if (chainId !== 8668) {
			await switchToHelaMainnet();
		}

		setIsMinting(true);
		try {
			const amountInWei = ethers.parseUnits(amount, 18).toString();

			const resp = await fetch("/api/mint", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ to: userAddress, amount: amountInWei }),
			});

			const data = await resp.json();

			const { signature } = data;

			const provider = new ethers.BrowserProvider(window.ethereum);
			const signer = await provider.getSigner();
			const userWallet = await signer.getAddress();

			const contract = new ethers.Contract(
				process.env.NEXT_PUBLIC_TOKEN_CONTRACT,
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

			const tx = await contract.mintWithSig(
				userAddress,
				amountInWei,
				signature
			);

			const receipt = await tx.wait();

			if (receipt.status === 1) {
				toast.dark(`Successfully received ${amount} TGG Gold!`);
				refetchBalance?.();
			} else {
				toast.dark("Transaction failed on-chain.");
			}
		} catch (err) {
			let errorMsg =
				err?.info?.error?.message?.split(":")[1]?.trim() ||
				err?.reason?.trim() ||
				"Lucky Draw failed";

			toast.dark(errorMsg.toUpperCase());
		} finally {
			setIsMinting(false);
		}
	};

	const [loading, setLoading] = useState(false);
	const [txHash, setTxHash] = useState("");

	const burnToken = async () => {
		if (chainId !== 8668) {
			await switchToHelaMainnet();
		}
		try {
			setLoading(true);
			setTxHash("");

			const resp = await fetch("/api/burn");
			const { tokenAddress, abi } = await resp.json();

			if (!window.ethereum) throw new Error("Wallet not found");

			await window.ethereum.request({ method: "eth_requestAccounts" });

			const provider = new ethers.BrowserProvider(window.ethereum);
			const signer = await provider.getSigner();
			const contract = new ethers.Contract(tokenAddress, abi, signer);

			const parsed = ethers.parseUnits("100", 18);

			const tx = await contract.burn(parsed);

			const receipt = await tx.wait();
			setTxHash(receipt.hash);
			refetchBalance?.();
			toast.dark("Game Started... Good luck!");
			c;
			setIsBurnFailed(false);
		} catch (err) {
			let errorMsg =
				err?.info?.error?.message?.split(":")[1]?.trim() ||
				err?.reason?.trim() ||
				"Lucky Draw failed";

			toast.dark(errorMsg.toUpperCase());
			setIsBurnFailed(true);
		} finally {
			setLoading(false);
		}
	};

	async function switchToHelaMainnet() {
		if (!window.ethereum) {
			throw new Error("No crypto wallet found. Please install MetaMask.");
		}

		try {
			await window.ethereum.request({
				method: "wallet_switchEthereumChain",
				params: [{ chainId: "0x21DC" }],
			});
		} catch (switchError) {
			if (switchError.code === 4902) {
				try {
					await window.ethereum.request({
						method: "wallet_addEthereumChain",
						params: [
							{
								chainId: "0x21DC",
								chainName: "Hela Mainnet",
								nativeCurrency: {
									name: "Hela Mainnet",
									symbol: "HLUSD",
									decimals: 18,
								},
								rpcUrls: ["https://mainnet-rpc.helachain.com"],
								blockExplorerUrls: ["https://helascan.io/"],
							},
						],
					});
				} catch (addError) {
					console.error("Failed to add Hela Mainnet:", addError);
					toast.error("Failed to add Hela Mainnet:", addError);
				}
			} else {
				console.error("Failed to switch network:", switchError);
				toast.error("Failed to switch network:", switchError);
			}
		}
	}

	return (
		<div className='bg-game w-full min-h-screen flex flex-col items-center justify-center p-4'>
			<div className='w-full !fixed top-[20px] left-1/2 translate-x-[-50%]'>
				<Navbar />
			</div>
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 0.5 }}
				className='flex flex-col items-center justify-center gap-6 rounded-3xl max-w-md w-full'
			>
				<ScratchCard
					txHash={txHash}
					isBurnFailed={isBurnFailed}
					loading={loading}
					burnToken={burnToken}
					sendToken={sendTokenToMe}
					isConnected={isConnected}
				/>
			</motion.div>
		</div>
	);
}
