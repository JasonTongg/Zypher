// components/ScratchCard.js
import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import Image from "next/image";
import StartButton from "../public/assets/StartButton.png";
import StartingButton from "../public/assets/StartingButton.png";
import ConnectWalletButton from "../public/assets/ConnectWalletButton.png";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Frame from "../public/assets/Frame.png";
import Frame2 from "../public/assets/Frame2.png";
import GameCharacter from "../public/assets/GameCharacter.png";
import Bubble from "../public/assets/Bubble.png";
import { motion } from "framer-motion";

const ScratchCard = ({
	txHash,
	sendToken,
	burnToken,
	loading,
	isBurnFailed,
	isConnected,
}) => {
	const [scratching, setScratching] = useState(false);
	const [hasRevealed, setHasRevealed] = useState(false);
	const canvasRef = useRef(null);
	const containerRef = useRef(null);
	const balance = useSelector((state) => state.data.balance);
	const [isStarted, setIsStarted] = useState(false);
	const [isImageLoaded, setImageLoaded] = useState(false);

	const rewards = [
		{ id: 2, text: "200 TGG Gold", color: "bg-[rgb(76,11,13)]" },
		{ id: 3, text: "50 TGG Gold", color: "bg-[rgb(190,32,34)]" },
		{ id: 5, text: "75 TGG Gold", color: "bg-[rgb(190,32,34)]" },
		{ id: 6, text: "100 TGG Gold", color: "bg-[rgb(120,18,23)]" },
	];

	const weights = [1, 5, 3, 2];

	const pickWeightedIndex = (weights) => {
		const total = weights.reduce((sum, w) => sum + w, 0);
		const rnd = Math.random() * total;
		let cum = 0;

		for (let i = 0; i < weights.length; i++) {
			cum += weights[i];
			if (rnd < cum) return i;
		}
	};

	const [result, setResult] = useState(() => {
		const newIndex = pickWeightedIndex(weights);
		return rewards[newIndex];
	});

	const drawOverlay = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		ctx.globalCompositeOperation = "source-over";
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;

		const radius = Math.max(canvas.width, canvas.height) / 1.5;

		const gradient = ctx.createRadialGradient(
			centerX,
			centerY,
			0,
			centerX,
			centerY,
			radius
		);
		gradient.addColorStop(0, "#801319");
		gradient.addColorStop(1, "#2B0202");

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.globalCompositeOperation = "destination-out";
	};

	useEffect(() => {
		if (!loading && isStarted) {
			drawOverlay();
		}
	}, [loading, isStarted]);

	const hasTriggeredRef = useRef(false);

	const handleScratch = (e) => {
		const canvas = canvasRef.current;
		const container = containerRef.current;
		if (!canvas || !container || hasRevealed) return;

		const rect = container.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const ctx = canvas.getContext("2d");
		ctx.beginPath();
		ctx.arc(x, y, 20, 0, 2 * Math.PI);
		ctx.fill();

		if (!hasRevealed) {
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			let transparentCount = 0;

			for (let i = 3; i < imageData.data.length; i += 4) {
				if (imageData.data[i] === 0) {
					transparentCount++;
				}
			}

			const scratchPercentage =
				(transparentCount / (imageData.data.length / 4)) * 100;

			if (scratchPercentage > 40 && !hasTriggeredRef.current) {
				hasTriggeredRef.current = true;
				setHasRevealed(true);

				toast.dark(`Congratulations! You won: ${result.text}`);
				if (result.text === "200 TGG Gold") {
					sendToken("200");
				} else if (result.text === "50 TGG Gold") {
					sendToken("50");
				} else if (result.text === "75 TGG Gold") {
					sendToken("75");
				} else if (result.text === "100 TGG Gold") {
					sendToken("100");
				}
			}
		}
	};

	const handleMouseDown = (e) => {
		setScratching(true);
		handleScratch(e);
	};

	const handleMouseMove = (e) => {
		if (scratching) {
			handleScratch(e);
		}
	};

	const handleMouseUp = () => {
		setScratching(false);
	};

	const resetScratchCard = () => {
		setIsStarted(true);
		if (balance < 100) {
			toast.dark(
				"Not enough balance to try again (need at least 100 TGG Gold)"
			);
			return;
		}
		burnToken();

		const newIndex = pickWeightedIndex(weights);
		setResult(rewards[newIndex]);

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		ctx.globalCompositeOperation = "source-over";
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;

		const radius = Math.max(canvas.width, canvas.height) / 1.5;

		const gradient = ctx.createRadialGradient(
			centerX,
			centerY,
			0,
			centerX,
			centerY,
			radius
		);
		gradient.addColorStop(0, "#801319");
		gradient.addColorStop(1, "#2B0202");

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.globalCompositeOperation = "destination-out";

		setHasRevealed(false);
		hasTriggeredRef.current = false;
	};

	return (
		<div className='flex items-center justify-center gap-6 sm:flex-row flex-col'>
			<Image
				src={GameCharacter}
				className='w-[300px] max-h-[60vh] h-auto sm:block hidden'
			/>
			<Image src={Bubble} className='w-[200px] h-auto sm:hidden block' />
			<div className='flex flex-col items-center justify-center gap-6'>
				{txHash && isBurnFailed !== true ? (
					<div
						ref={containerRef}
						className='
						max-w-md
						rounded-xl
						bg-[#ffffff]
						border-4 border-[#d4b06a]
						shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)]
						px-4 py-3
						font-serif text-lg
						placeholder:text-[#8b6a2b]
						focus:outline-none focus:ring-2 focus:ring-[#e0c98d]
						relative
						w-64 h-64 mb-6 cursor-pointer
					'
						onMouseDown={handleMouseDown}
						onMouseMove={handleMouseMove}
						onMouseUp={handleMouseUp}
						onMouseLeave={handleMouseUp}
						onTouchStart={handleMouseDown}
						onTouchMove={handleMouseMove}
						onTouchEnd={handleMouseUp}
					>
						<motion.div
							initial={{ scale: 0.1, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 3 }}
						>
							<div className='absolute inset-0 flex items-center justify-center rounded-lg'>
								<div
									className={`p-4 rounded-lg text-center ${result.color} text-white font-bold`}
								>
									<p className='text-xl'>{result.text}</p>
								</div>
							</div>
						</motion.div>

						<canvas
							ref={canvasRef}
							width={256}
							height={256}
							className='absolute inset-0 w-full h-full rounded-lg'
						/>
						<Image
							src={Frame}
							className='absolute inset-0 w-full h-full rounded-lg left-[-25px] top-[-40px] !w-[300px] !max-w-[500px] !h-auto pointer-events-none'
						/>
					</div>
				) : (
					<div
						ref={containerRef}
						className='
							max-w-md
							rounded-xl
							bg-[#ffffff]
							border-4 border-[#d4b06a]
							shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)]
							px-4 py-3
							font-serif text-lg
							placeholder:text-[#8b6a2b]
							focus:outline-none focus:ring-2 focus:ring-[#e0c98d]
							relative
							w-64 h-64 mb-6 pointer-events-none
						'
					>
						{isImageLoaded && (
							<motion.div
								initial={{ scale: 0.1, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{ duration: 3 }}
							>
								<div className='absolute inset-0 flex items-center justify-center rounded-lg'>
									<div
										className={`p-4 rounded-lg text-center ${result.color} text-white font-bold`}
									>
										<p className='text-xl'>{result.text}</p>
									</div>
								</div>
							</motion.div>
						)}

						<canvas
							ref={canvasRef}
							width={256}
							height={256}
							className='absolute inset-0 w-full h-full rounded-lg'
						/>
						<Image
							src={Frame2}
							alt='frame'
							onLoad={() => setImageLoaded(true)}
							className='absolute inset-0 w-full h-full rounded-lg left-[-25px] top-[-40px] !w-[300px] !max-w-[500px] !h-auto pointer-events-none'
						/>
					</div>
				)}

				<div
					className={
						loading
							? `flex flex-col items-center gap-4 w-[220px]`
							: isConnected
							? `flex flex-col items-center gap-4 w-[220px]`
							: `flex flex-col items-center gap-4 w-[220px]`
					}
				>
					{loading ? (
						<Image
							src={StartingButton}
							role='button'
							className='w-[220px] h-auto cursor-pointer'
						/>
					) : isConnected ? (
						<button onClick={resetScratchCard}>
							<Image
								src={StartButton}
								role='button'
								className='w-[220px] h-auto cursor-pointer'
							/>
						</button>
					) : (
						<ConnectButton.Custom>
							{({ account, chain, openConnectModal, mounted }) => {
								return (
									<button
										onClick={openConnectModal}
										className='focus:outline-none w-[200px]'
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
			</div>
		</div>
	);
};

export default ScratchCard;
