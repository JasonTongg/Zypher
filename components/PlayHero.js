import React from "react";
import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Link from "next/link";
import Image from "next/image";
import HomeTitle from "../public/assets/HomeTitle.png";
import ConnectWalletButton from "../public/assets/ConnectWalletButton.png";
import StartButton from "../public/assets/PlayNowButton.png";
import Navbar from "@/components/Navbar";

export default function PlayHero() {
	const { isConnected } = useAccount();

	return (
		<div
			className='bg-home w-full min-h-screen grid items-center justify-center'
			style={{ gridTemplateRows: "auto 1fr" }}
		>
			<div className='w-screen self-start pt-[20px]'>
				<Navbar />
			</div>
			<motion.div
				initial={{ transform: "translateX(-100px)", opacity: 0 }}
				whileInView={{ transform: "translateX(0px)", opacity: 1 }}
				exit={{ transform: "translateX(-100px)", opacity: 0 }}
				transition={{ duration: 0.5 }}
				className='max-w-screen-2xl py-[2rem] h-fit mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-5 relative'
			>
				<Image
					src={HomeTitle}
					alt='Home title'
					className='max-w-[477px] w-[90vw]'
				/>

				<div className='flex items-center justify-center absolute left-1/2 translate-x-[-50%] bottom-[20%]'>
					{isConnected ? (
						<Link href='/jokes'>
							<Image src={StartButton} className='w-[200px] h-auto'></Image>
						</Link>
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
											className='w-[200px] h-auto hover:scale-105 transition-transform active:scale-95'
										/>
									</button>
								);
							}}
						</ConnectButton.Custom>
					)}
				</div>
			</motion.div>
		</div>
	);
}
