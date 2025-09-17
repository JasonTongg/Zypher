// components/ScratchCard.js
import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import ScratchButton from "../public/assets/ScratchButton.png";
import Image from "next/image";
import StartButton from "../public/assets/StartButton.png";
import StartingButton from "../public/assets/StartingButton.png";
import ConnectWalletButton from "../public/assets/ConnectWalletButton.png";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const ScratchCard = ({
	txHash,
	sendEth,
	mintNft,
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

	// Select a random reward on component mount
	const rewards = [
		{ id: 1, text: "0.1 HLUSD", color: "bg-purple-500" },
		{ id: 2, text: "200 Gold Coin", color: "bg-blue-500" },
		{ id: 3, text: "50 Gold Coin", color: "bg-green-500" },
		{ id: 4, text: "King NFT", color: "bg-yellow-500" },
		{ id: 5, text: "75 Gold Coin", color: "bg-green-500" },
		{ id: 6, text: "100 Gold Coin", color: "bg-green-500" },
	];

	const weights = [1, 1, 4, 1, 3, 3];

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
		ctx.fillStyle = "#fef8e6";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.globalCompositeOperation = "destination-out";
	};

	// Initialize canvas
	useEffect(() => {
		if (!loading && isStarted) {
			drawOverlay();
		}
	}, [loading, isStarted]);

	// Show alert when reward is revealed
	// useEffect(() => {
	//     if (hasRevealed) {

	//     }
	// }, [hasRevealed, result.text]);

	// Handle

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

		// Check if enough has been scratched to reveal the prize
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
				console.log("trigger");
				setHasRevealed(true);

				toast.dark(`Congratulations! You won: ${result.text}`);
				if (result.text === "King NFT") {
					mintNft();
				} else if (result.text === "0.1 HLUSD") {
					sendEth();
				} else if (result.text === "200 Gold Coin") {
					sendToken("200");
				} else if (result.text === "50 Gold Coin") {
					sendToken("50");
				} else if (result.text === "75 Gold Coin") {
					sendToken("75");
				} else if (result.text === "100 Gold Coin") {
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
				"Not enough balance to try again (need at least 100 Gold Coins)"
			);
			return;
		}
		burnToken();

		const newIndex = pickWeightedIndex(weights);
		setResult(rewards[newIndex]);

		// Reset canvas
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		ctx.globalCompositeOperation = "source-over";
		ctx.fillStyle = "#fef8e6";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.globalCompositeOperation = "destination-out";

		// Reset revealed state
		setHasRevealed(false);
		hasTriggeredRef.current = false;
	};

	return (
		<div className='flex flex-col items-center justify-center'>
			<Image src={ScratchButton} className='w-[500px]'></Image>

			{txHash && isBurnFailed !== true && (
				<div
					ref={containerRef}
					className='
                    max-w-md
                    rounded-xl
                    bg-[#ffffff]           /* warna perkamen */
                    border-4 border-[#d4b06a]  /* bingkai emas/cokelat */
                    shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)]
                    px-4 py-3
                    font-serif text-lg
                    placeholder:text-[#8b6a2b]
                    focus:outline-none focus:ring-2 focus:ring-[#e0c98d]
                    relative
                    w-64 h-64 mb-6 cursor-pointer overflow-hidden
                '
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
					onTouchStart={handleMouseDown}
					onTouchMove={handleMouseMove}
					onTouchEnd={handleMouseUp}
				>
					{/* Reward background - always visible behind scratch layer */}
					<div className='absolute inset-0 flex items-center justify-center rounded-lg'>
						<div
							className={`p-4 rounded-lg text-center ${result.color} text-white font-bold`}
						>
							<p className='text-xl'>{result.text}</p>
						</div>
					</div>

					{/* Scratch overlay canvas */}
					<canvas
						ref={canvasRef}
						width={256}
						height={256}
						className='absolute inset-0 w-full h-full rounded-lg'
					/>
				</div>
			)}

			<div className='flex flex-col items-center gap-4'>
				{loading ? (
					<Image
						src={StartingButton}
						role='button'
						className='w-[170px] h-auto cursor-pointer'
					/>
				) : isConnected ? (
					<button onClick={resetScratchCard}>
						<Image
							src={StartButton}
							role='button'
							className='w-[150px] h-auto cursor-pointer'
						/>
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
			</div>
		</div>
	);
};

export default ScratchCard;
