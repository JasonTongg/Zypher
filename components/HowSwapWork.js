"use client";

import React, { useState } from "react";
import Image from "next/image";

const STEPS = [
	{
		title: "Uniswap V2",
		subtitle: "Classic Liquidity Pools",
		description:
			"Uniswap V2 uses a simple dual-token AMM model with equal-value deposits. It’s straightforward and predictable, making it ideal for basic liquidity provisioning.",
		icon1: "/Image/range2Icon.svg",
		icon2: "",
		color: "blue",
	},
	{
		title: "Uniswap V3",
		subtitle: "Concentrated Liquidity",
		description:
			"Uniswap V3 lets LPs choose price ranges, boosting capital efficiency and control. It offers higher potential returns with more flexible liquidity management.",
		icon1: "/Image/targetIcon.png",
		icon2: "",
		color: "green",
	},
	{
		title: "Uniswap V4",
		subtitle: "Customizable Pools with Hooks",
		description:
			"Uniswap V4 adds programmable “hooks” that enable custom pool logic and dynamic features. It delivers a more flexible, modular, and gas-efficient liquidity system.",
		icon1: "/Image/HookLogo.png",
		icon2: "",
		color: "yellow",
	},
];

const HowItWork = () => {
	return (
		<section
			className='relative flex w-full flex-col items-center justify-center px-3 pt-[50px] pb-[60px]'
			id='howitwork'
		>
			<div className='flex w-full flex-col items-center justify-center gap-4 md:w-[600px]'>
				<h2 className='text-accent-pink text-3xl text-center sm:text-4xl font-semibold'>
					How Swaps Work:
				</h2>
				<p className='text-secondary text-center'>
					Swap tokens across Uniswap V2, V3, and V4 with optimized routing. Our
					smart contract handles calculations, price impact, and execution for
					you.
				</p>
			</div>

			<div className='mt-6 flex flex-row flex-wrap items-stretch justify-center gap-3 md:gap-8 sm:px-10'>
				{STEPS.map((item, index) => (
					<div
						key={index}
						className={`relative flex w-full flex-col gap-2 rounded-sm p-6 sm:w-[300px] glass-base ${
							item.color === "blue"
								? "glass-blue"
								: item.color === "green"
								? "glass-green"
								: item.color === "yellow"
								? "glass-yellow"
								: "glass-pink"
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
								className={`text-lg font-semibold tracking-tight ${
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
							<h3 className='text-sm font-medium text-gray-700/80 tracking-wide'>
								{item.subtitle}
							</h3>
							<p className='text-[0.92rem] leading-relaxed text-gray-900/90 '>
								{item.description}
							</p>
						</div>
					</div>
				))}
			</div>
		</section>
	);
};

export default HowItWork;
