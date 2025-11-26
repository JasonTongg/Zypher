"use client";

import React, { useState } from "react";

import Image from "next/image";

import classNames from "classnames";

const STEPS = [
	{
		title: "Choose a Pool",
		description: "Select the Uniswap pool you want to provide liquidity to.",
		icon1: "/Image/usdcIcon.svg",
		icon2: "/Image/etherIcon.svg",
		color: "blue",
	},
	{
		title: "Input Token Amount",
		description:
			"Enter the amount of token. Our smart contract will create the balanced pair.",
		icon1: "/Image/usdtIcon.svg",
		icon2: "",
		color: "green",
	},
	{
		title: "Select Price Range",
		description:
			"Choose your preferred price range for concentrated liquidity to maximize your fee earnings.",
		icon1: "/Image/rangeIcon.svg",
		icon2: "",
		color: "yellow",
	},
	{
		title: "Review and Deposit",
		description:
			"Review your position details, approve token spending, and confirm your deposit.",
		icon1: "/Image/depositIcon.svg",
		icon2: "",
		color: "red",
	},
];

const STEPS_V4 = [
	{
		title: "Choose a Pool Type",
		description:
			"Select the Uniswap v4 pool type you want to use. V4 pools are customizable with different fee tiers and hooks.",
		icon1: "/Image/usdcIcon.svg",
		icon2: "/Image/etherIcon.svg",
		color: "blue",
	},
	{
		title: "Configure Hooks (Optional)",
		description:
			"Enable or disable custom hooks such as dynamic fees, on-chain limits, or automated strategies for your liquidity position.",
		icon1: "/Image/HookLogo.png",
		icon2: "",
		color: "yellow",
	},
	{
		title: "Input Token Amount",
		description:
			"Enter the token amounts you want to deposit. The system will determine the required ratio based on the pool’s logic.",
		icon1: "/Image/usdtIcon.svg",
		icon2: "",
		color: "green",
	},
	{
		title: "Set Price Range",
		description:
			"Define your active price range for concentrated liquidity. Custom hooks may influence how your position behaves.",
		icon1: "/Image/rangeIcon.svg",
		icon2: "",
		color: "yellow",
	},
	{
		title: "Review and Deposit",
		description:
			"Check your settings, approve token spending, and finalize your deposit into the Uniswap v4 singleton.",
		icon1: "/Image/depositIcon.svg",
		icon2: "",
		color: "red",
	},
];

const HowItWork = () => {
	const [selectedStep, setSelectedStep] = useState("V2");

	const filteredSteps =
		selectedStep === "V2"
			? STEPS.filter((_, index) => [0, 1, 3].includes(index))
			: selectedStep === "V3"
			? STEPS
			: STEPS_V4;

	return (
		<section
			className='relative flex w-full flex-col items-center justify-center px-3 pt-[50px] pb-[60px]'
			id='howitwork'
		>
			<div className='mb-10 flex flex-wrap items-center justify-center gap-10 md:gap-24'>
				<Image
					src={"/Image/sepoliaLogo.png"}
					width={200}
					height={200}
					alt='SepoliaLogo'
					className='w-28 md:w-32'
				/>
				<Image
					src={"/Image/uniswapLogo.svg"}
					width={200}
					height={200}
					alt='UniswapLogo'
					className='w-38 md:w-42'
				/>
				<Image
					src={"/Image/foundryLogo.png"}
					width={200}
					height={200}
					alt='FoundryLogo'
					className='w-33 md:w-36'
				/>
			</div>

			<div className='flex w-full flex-col items-center justify-center gap-4 md:w-[600px]'>
				<h2 className='text-accent-pink text-3xl text-center sm:text-4xl font-semibold'>
					How Liquidity Works:
				</h2>
				<p className='text-secondary text-center'>
					Add or remove liquidity on Uniswap V2, V3, and V4 pools effortlessly.
					Our smart contract handles token swaps and balance management for a
					seamless experience.
				</p>
				<div className='bg-surface flex items-center justify-center gap-1 rounded-sm p-1.5 flex-wrap'>
					<button
						onClick={() => setSelectedStep("V2")}
						className={`bg-background hover:bg-background w-[120px] rounded-sm rounded-r-none py-2 sm:w-[150px] cursor-pointer ${
							selectedStep === "V2" ? "bg-background" : "bg-transparent"
						}`}
					>
						Uniswap V2
					</button>
					<button
						onClick={() => setSelectedStep("V3")}
						className={`bg-background hover:bg-background w-[120px] rounded-sm rounded-l-none py-2 sm:w-[150px] cursor-pointer ${
							selectedStep === "V3" ? "bg-background" : "bg-transparent"
						}`}
					>
						Uniswap V3
					</button>
					<button
						onClick={() => setSelectedStep("V4")}
						className={`bg-background hover:bg-background w-[120px] rounded-sm rounded-l-none py-2 sm:w-[150px] cursor-pointer ${
							selectedStep === "V4" ? "bg-background" : "bg-transparent"
						}`}
					>
						Uniswap V4
					</button>
				</div>
			</div>

			<div className='mt-6 flex flex-row flex-wrap items-stretch justify-center gap-3 md:gap-8'>
				{filteredSteps.map((item, index) => (
					<div
						key={index}
						className={`relative flex w-full flex-col gap-2 rounded-sm p-6 sm:w-[250px] ${
							item.color === "blue"
								? "bg-opacity-blue"
								: item.color === "green"
								? "bg-opacity-green"
								: item.color === "yellow"
								? "bg-opacity-yellow"
								: "bg-opacity-pink"
						}`}
					>
						<div className='flex'>
							<Image
								width={64}
								height={64}
								src={item?.icon1}
								alt='icon'
								className='w-[40px]'
							/>
							{item?.icon2 && (
								<Image
									src={item?.icon2}
									alt='icon'
									className='w-[40px] translate-x-[-10px]'
									width={64}
									height={64}
								/>
							)}
						</div>
						<div className='space-y-1'>
							<h2
								className={`text-lg font-semibold ${
									item.color === "blue"
										? "text-accent-blue"
										: item.color === "green"
										? "text-accent-green"
										: item.color === "yellow"
										? "text-accent-yellow"
										: item.color === "purple"
										? "text-accent-purple"
										: "text-accent-pink"
								}`}
							>
								{item.title}
							</h2>
							<p>{item.description}</p>
						</div>
						<div
							className={`absolute top-[10px] right-[15px] flex h-[25px] w-[25px] items-center justify-center rounded-full ${
								item.color === "blue"
									? "bg-opacity2-blue"
									: item.color === "green"
									? "bg-opacity2-green"
									: item.color === "yellow"
									? "bg-opacity2-yellow"
									: item.color === "purple"
									? "bg-opacity2-purple"
									: "bg-opacity2-pink"
							}`}
						>
							{index + 1}
						</div>
					</div>
				))}
			</div>
		</section>
	);
};

export default HowItWork;
