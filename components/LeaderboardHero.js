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
import LeaderboardContainer from "../public/assets/Leaderboard.png";
import MyRank from "../public/assets/MyRank.png";
import Coin from "../public/assets/coin.png";
import { useSelector } from "react-redux";

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

export default function LeaderboardHero() {
	const { address: userAddress, isConnected } = useAccount();
	const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT;
	const dispatch = useDispatch();
	const [data, setData] = useState([]);
	const [user, setUser] = useState([]);
	const balance = useSelector((state) => state.data.balance);

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
				className='flex flex-col items-center justify-center gap-8 w-full'
			>
				<div className='max-w-3xl p-4'>
					<div className='flex flex-col md:flex-row items-center md:items-start gap-4 relative w-fit sm:px-[10rem] px-[3rem] pt-[1.5rem] sx:pt-[3.5rem]'>
						<Image
							src={LeaderboardContainer}
							alt='Deskripsi gambar'
							className='w-[500px] h-auto rounded-lg object-cover absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]'
						/>
						<div className='sm:h-[330px] h-[200px] sx:h-[290px] overflow-auto relative z-[10] gap-[0px] sx:gap-[4px] sm:gap-[10px] flex flex-col items-start w-[200px] sx:w-[300px]'>
							{data?.length > 0 &&
								data
									?.filter((_, index) => index <= 19)
									.map((Items, index) => (
										<div
											key={index}
											className='flex items-center justify-between w-full sx:text-[16px] text-[14px]'
										>
											<p>
												{index + 1}. {Items.address.slice(0, 5)}...
												{Items.address.slice(-5)}
											</p>
											<p className='flex flex-row items-center justify-center gap-1'>
												{Items.point}
												<Image src={Coin} className='w-[15px] h-auto' />
											</p>
										</div>
									))}
						</div>
					</div>
				</div>
				{isConnected ? (
					<div className='relative py-[5px] px-[1.5rem]'>
						<Image
							src={MyRank}
							alt='Deskripsi gambar'
							className='w-[500px] h-auto rounded-lg object-cover absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] flex items-center justify-center'
						/>
						<div className='flex items-center justify-center w-full relative z-[10] gap-[1rem]'>
							<p className='flex items-center justify-center'>
								Your Rank: {user.rank || 0}.{" "}
								<span className='sx:block hidden'>
									{userAddress.slice(0, 5)}...
									{userAddress.slice(-5)}
								</span>
							</p>
							<p className='flex flex-row items-center justify-center gap-1'>
								{Number(balance).toFixed(0)}
								<Image src={Coin} className='w-[15px] h-auto' />
							</p>
						</div>
					</div>
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
