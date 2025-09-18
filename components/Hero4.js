import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAccount, useToken, useReadContract } from "wagmi";
import { ethers } from "ethers";
import { useDispatch } from "react-redux";
import { setBalance } from "../store/data";
import { toast } from "react-toastify";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import ConnectWalletButton from "../public/assets/ConnectWalletButton.png";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const ERC20_ABI = [
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
	const { address: userAddress, isConnected, chainId } = useAccount();
	const tokenAddress = "0xAad8792DdDbE35e49D3E7b39359B6cBBDF712f0f";
	const dispatch = useDispatch();
	const [data, setData] = useState([]);
	const [user, setUser] = useState([]);

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

	async function getWalletPoints() {
		try {
			const res = await fetch(`/api/getPoints?address=${userAddress}`);
			const data = await res.json();
			setData(data.data);
			setUser(data.user);
		} catch (error) {
			toast.dark("Error fetching wallet points:");
		}
	}

	useEffect(() => {
		getWalletPoints();
	}, [userAddress]);

	return (
		<div className='bg-jokes w-full min-h-screen flex flex-col items-center justify-center p-4 min-h-screen'>
			<div className='w-full !fixed top-[20px] left-1/2 translate-x-[-50%]'>
				<Navbar />
			</div>
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 0.5 }}
				className='flex flex-col items-center justify-center gap-6 w-full bg-white'
			>
				{data?.length > 0 &&
					data?.map((Items, index) => (
						<p key={index}>
							{Items.address}, Point: {Items.point}
						</p>
					))}
				{isConnected ? (
					<button>
						{user.address} My Rank: {user.rank || 0}, {user.point || 0}
					</button>
				) : (
					<ConnectButton.Custom>
						{({ account, chain, openConnectModal, mounted }) => {
							return (
								<button
									onClick={openConnectModal}
									className='focus:outline-none'
								>
									<Image
										src={ConnectWalletButton}
										alt='Connect wallet'
										className='w-[200px] h-auto'
									/>
								</button>
							);
						}}
					</ConnectButton.Custom>
				)}
			</motion.div>
		</div>
	);
}
