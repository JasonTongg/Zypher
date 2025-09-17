import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useToken, useReadContract } from "wagmi";
import { ethers } from "ethers";
import { useDispatch, useSelector } from "react-redux";
import { setBalance } from "../store/data";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConnectWalletButton from "../public/assets/ConnectWalletButton.png";
import Image from "next/image";
import TellAJokeButton from "../public/assets/TellAJokeButton.png";
import LuckyDrawButton from "../public/assets/LuckyDrawButton.png";
import Coin from "../public/assets/coin.png";

const ERC20_ABI = [
	{
		constant: true,
		inputs: [{ name: "_owner", type: "address" }],
		name: "balanceOf",
		outputs: [{ name: "balance", type: "uint256" }],
		type: "function",
	},
	{
		constant: true,
		inputs: [],
		name: "decimals",
		outputs: [{ name: "", type: "uint8" }],
		type: "function",
	},
];

export default function Navbar() {
	const [symbol, setSymbol] = useState("TOKEN");
	const dispatch = useDispatch();
	const balance = useSelector((state) => state.data.balance);

	const { address: userAddress, isConnected } = useAccount();
	const tokenAddress = "0xAad8792DdDbE35e49D3E7b39359B6cBBDF712f0f";

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
		if (tokenData?.symbol) setSymbol(tokenData.symbol);
		if (balanceData && tokenData?.decimals != null) {
			const formatted = ethers.formatUnits(balanceData, tokenData.decimals);
			dispatch(setBalance(formatted));
		}
		console.log();
	}, [balanceData, tokenData, isConnected, userAddress, dispatch]);

	return (
		<nav className='w-full z-50 px-4 py-2 flex items-center sm:flex-row flex-col justify-between gap-4'>
			{window.location.pathname === "/game" ? (
				<Link href='/jokes'>
					<Image
						src={TellAJokeButton}
						className='min-w-[150px] w-[150px] h-auto'
					></Image>
				</Link>
			) : (
				<Link href='/game'>
					<Image
						src={LuckyDrawButton}
						className='min-w-[150px] w-[150px] h-auto'
					></Image>
				</Link>
			)}
			<div className='flex items-center justify-center gap-4'>
				{isConnected && (
					<div
						className='
            w-fill max-w-md
            rounded-xl
            bg-[#FDE5B2]
            border-4 border-[#F5BE52]
            shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)]
            px-4 py-1
            font-serif text-lg
            placeholder:text-[#8b6a2b]
            focus:outline-none focus:ring-2 focus:ring-[#e0c98d]
            flex items-center justify-center gap-1
          '
					>
						{Number(balance).toFixed(0)}{" "}
						<Image
							src={Coin}
							className='w-[30px] h-auto translate-y-[3px]'
						></Image>
					</div>
				)}
				{isConnected ? (
					<ConnectButton></ConnectButton>
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
			</div>
		</nav>
	);
}
