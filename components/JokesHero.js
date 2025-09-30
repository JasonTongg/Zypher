import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAccount, useToken, useReadContract } from "wagmi";
import { ethers } from "ethers";
import { useDispatch } from "react-redux";
import { setBalance } from "../store/data";
import { toast } from "react-toastify";
import JokesTitleGoodEmpty from "../public/assets/JokesTitleGoodEmpty.png";
import JokesTitleOkeyEmpty from "../public/assets/JokesTitleOkeyEmpty.png";
import JokesTitleBadEmpty from "../public/assets/JokesTitleBadEmpty.png";
import Image from "next/image";
import StartButton from "../public/assets/SubmitButton.png";
import StartButton2 from "../public/assets/SubmittingButton.png";
import Navbar from "@/components/Navbar";
import ConnectWalletButton from "../public/assets/ConnectWalletButton.png";
import { ConnectButton } from "@rainbow-me/rainbowkit";

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

export default function JokesHero() {
	const [isMinting, setIsMinting] = useState(false);
	const { address: userAddress, isConnected, chainId } = useAccount();
	const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT;
	const dispatch = useDispatch();
	const [jokes, setJokes] = useState("");
	const [feedback, setFeedback] = useState(
		"Tell me a great joke, Adventurer! Amuse me, and you shall be rewarded handsomely with treasure!"
	);
	const [titleImage, setTitleImage] = useState(JokesTitleOkeyEmpty);
	const [buttonType, setButtonType] = useState(StartButton);

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

	async function mintToken(userAddress, amount) {
		if (chainId !== 8668) {
			await switchToHelaMainnet();
		}
		const amountInWei = ethers.parseUnits(amount, 18).toString();
		try {
			const res = await fetch("/api/mintGasless", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ userAddress, amount: amountInWei }),
			});

			await res.json();

			toast.dark(`Successfully received ${amount} TGG Gold!`);
			refetchBalance?.();
			setButtonType(StartButton);
		} catch (err) {
			toast.dark(`Transaction Failed`);
			setButtonType(StartButton);
		} finally {
			setIsMinting(false);
			setButtonType(StartButton);
		}
	}

	async function submitJoke(wallet, joke) {
		if (chainId !== 8668) {
			await switchToHelaMainnet();
		}
		try {
			const res = await fetch("/api/joke", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ wallet, joke: joke.toLowerCase() }),
			});

			const data = await res.json();

			if (data?.error?.length > 0) {
				setTitleImage(JokesTitleBadEmpty);
				setFeedback("Nice try, but we’ve heard this one before…");
			} else {
				rateJoke(joke);
			}

			return data;
		} catch (err) {
			setTitleImage(JokesTitleOkeyEmpty);
			setFeedback("I wasn't listening, tell me again?");
		}
	}

	async function rateJoke(joke) {
		if (chainId !== 8668) {
			await switchToHelaMainnet();
		}
		setButtonType(StartButton2);
		let resp = await fetch("/api/rate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ joke, wallet: userAddress }),
		});
		resp = await resp.json();

		if (resp?.error?.length > 0) {
			setTitleImage(JokesTitleOkeyEmpty);
			setFeedback("I wasn't listening, tell me again?");
			setButtonType(StartButton);
			return;
		}

		setFeedback(resp.response);
		if (Number(resp.rating) === 0) {
			setTitleImage(JokesTitleBadEmpty);
		} else if (Number(resp.rating) > 0 && Number(resp.rating) < 5) {
			setTitleImage(JokesTitleBadEmpty);
			toast.dark(
				`Congratulations! You won: ${Number(resp.gold).toString()} TGG Gold`
			);
			mintToken(userAddress, Number(resp.gold).toString());
		} else if (
			Number(resp.rating) === 5 ||
			Number(resp.rating) === 7 ||
			Number(resp.rating) === 6
		) {
			setTitleImage(JokesTitleOkeyEmpty);
			toast.dark(
				`Congratulations! You won: ${Number(resp.gold).toString()} TGG Gold`
			);
			mintToken(userAddress, Number(resp.gold).toString());
		} else if (Number(resp.rating) === 8 || Number(resp.rating) === 9) {
			setTitleImage(JokesTitleGoodEmpty);
			toast.dark(
				`Congratulations! You won: ${Number(resp.gold).toString()} TGG Gold`
			);
			mintToken(userAddress, Number(resp.gold).toString());
		} else {
			setTitleImage(JokesTitleGoodEmpty);
			toast.dark(
				`Congratulations! You won: ${Number(resp.gold).toString()} TGG Gold`
			);
			mintToken(userAddress, Number(resp.gold).toString());
		}

		setJokes("");
	}

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
		<div
			className='bg-jokes w-full min-h-screen grid'
			style={{ gridTemplateRows: "auto 1fr" }}
		>
			<div className='w-full self-start pt-[20px]'>
				<Navbar />
			</div>
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 0.5 }}
				className='flex flex-col items-center justify-center gap-6 w-full'
			>
				<div className='relative flex items-center justify-center w-fit'>
					<Image
						src={titleImage}
						alt='Jokes title'
						className='h-auto sm:!h-[30vh] sm:!min-h-[300px] w-[100%] sm:w-auto '
					/>
					<p className='absolute top-1/2 left-[40%] translate-y-[-50%] text-[11px] sx:text-[15px] sxl:text-[20px] sm:text-[25px] leading-[14px] sx:leading-[18px] sxl:leading-[25px] sm:leading-[35px] max-w-[47%] font-serif'>
						{feedback}
					</p>
				</div>
				<textarea
					cols={30}
					rows={2}
					type='text'
					placeholder='Tell your joke here…'
					value={jokes}
					onChange={(e) => setJokes(e.target.value)}
					className='
            w-full max-w-md
            rounded-xl
            bg-[#FDE5B2]           /* warna perkamen */
            border-4 border-[#F5BE52]  /* bingkai emas/cokelat */
            shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)]
            px-4 py-3
            font-serif text-sm sm:text-lg
            placeholder:text-[#8b6a2b]
            focus:outline-none focus:ring-2 focus:ring-[#e0c98d]
          '
				/>
				{isConnected ? (
					buttonType === StartButton ? (
						<button onClick={() => submitJoke(userAddress, jokes)}>
							<Image
								src={buttonType}
								className='w-[150px] sxl:w-[220px] h-auto'
							/>
						</button>
					) : (
						<button disabled={true}>
							<Image
								src={buttonType}
								className='w-[180px] sxl:w-[250px] h-auto'
							/>
						</button>
					)
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
