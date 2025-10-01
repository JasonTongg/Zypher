import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useToken, useReadContract } from "wagmi";
import { ethers } from "ethers";
import { useDispatch, useSelector } from "react-redux";
import { setBalance } from "../store/data";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import TellAJokeButton from "../public/assets/TellAJokeButton.png";
import LuckyDrawButton from "../public/assets/LuckyDrawButton.png";
import LeaderboardButton from "../public/assets/LeaderboardButton.png";
import BuyButton from "../public/assets/BuyButton.png";
import Coin from "../public/assets/coin.png";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import { GiHamburgerMenu } from "react-icons/gi";

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
	const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT;

	const [open, setOpen] = React.useState(false);

	const toggleDrawer = (newOpen) => () => {
		setOpen(newOpen);
	};

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
		if (tokenData?.symbol) setSymbol(tokenData.symbol);
		if (balanceData && tokenData?.decimals != null) {
			const formatted = ethers.formatUnits(balanceData, tokenData.decimals);
			dispatch(setBalance(formatted));
			savePoints(userAddress, Number(formatted));
		}
	}, [balanceData, tokenData, isConnected, userAddress, dispatch]);

	const DrawerList = (
		<Box
			sx={{
				padding: "20px",
			}}
			role='presentation'
			onClick={toggleDrawer(false)}
		>
			<List>
				<div className='flex flex-col items-center justify-center gap-2'>
					{window.location.pathname === "/jokes" ? (
						<Link href='/game'>
							<Image
								src={LuckyDrawButton}
								className='min-w-[150px] sxl:min-w-[190px] w-[150px] sxl:w-[190px] h-auto'
							></Image>
						</Link>
					) : (
						<Link href='/jokes'>
							<Image
								src={TellAJokeButton}
								className='min-w-[150px] sxl:min-w-[190px] w-[150px] sxl:w-[190px] h-auto'
							></Image>
						</Link>
					)}
					<Link href='/leaderboard'>
						<Image
							src={LeaderboardButton}
							className='min-w-[150px] sxl:min-w-[190px] w-[150px] sxl:w-[190px] h-auto'
						></Image>
					</Link>
					<Link href='https://stablehodl.com/trade' target='_blank'>
						<Image
							src={BuyButton}
							className='min-w-[150px] sxl:min-w-[190px] w-[150px] sxl:w-[190px] h-auto'
						></Image>
					</Link>
				</div>
			</List>
		</Box>
	);

	return (
		<nav className='w-full z-50 px-4 py-2 flex items-center sm:flex-row flex-row-reverse justify-between gap-4'>
			<div className='hidden sm:flex items-center justify-center gap-4 flex-row flex-wrap'>
				{window.location.pathname === "/jokes" ? (
					<Link href='/game'>
						<Image
							src={LuckyDrawButton}
							className='min-w-[150px] sxl:min-w-[190px] w-[150px] sxl:w-[190px] h-auto'
						></Image>
					</Link>
				) : (
					<Link href='/jokes'>
						<Image
							src={TellAJokeButton}
							className='min-w-[150px] sxl:min-w-[190px] w-[150px] sxl:w-[190px] h-auto'
						></Image>
					</Link>
				)}
				<Link href='/leaderboard'>
					<Image
						src={LeaderboardButton}
						className='min-w-[150px] sxl:min-w-[190px] w-[150px] sxl:w-[190px] h-auto'
					></Image>
				</Link>
				<Link href='https://stablehodl.com/trade' target='_blank'>
					<Image
						src={BuyButton}
						className='min-w-[150px] sxl:min-w-[190px] w-[150px] sxl:w-[190px] h-auto'
					></Image>
				</Link>
			</div>
			<div className='sm:hidden block'>
				<Button
					onClick={toggleDrawer(true)}
					sx={{ padding: "0px !important", minWidth: "0px !important" }}
				>
					<GiHamburgerMenu className='text-[#F5BE52] text-3xl' />
				</Button>
			</div>
			<Drawer
				open={open}
				onClose={toggleDrawer(false)}
				PaperProps={{
					sx: {
						backgroundColor: "transparent",
						display: "flex",
						flexDirection: "column",
						justifyContent: "start",
						alignItems: "center",
						backdropFilter: "blur(3px)",
					},
				}}
				ModalProps={{
					BackdropProps: {
						sx: {
							backgroundColor: "transparent",
						},
					},
				}}
			>
				{DrawerList}
			</Drawer>
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
						<Image src={Coin} className='w-[25px] h-auto'></Image>
					</div>
				)}
				{isConnected && <ConnectButton></ConnectButton>}
			</div>
		</nav>
	);
}
