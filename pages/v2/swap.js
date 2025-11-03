"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPortfolio } from "../../store/data";
import { useAccount } from "wagmi";
import { useTokenSwap } from "@/hooks/useTokenSwap";
import { useTokenToETHSwap } from "@/hooks/useTokenToEthSwap";
import { useETHToTokenSwap } from "@/hooks/useEthToTokenSwap";
import { formatUnits } from "viem";

const ETH_ADDRESS = "0x0000000000000000000000000000000000000000"; // Standard ETH placeholder

export default function Swap() {
	const dispatch = useDispatch();
	const { portfolio } = useSelector((state) => state.data);
	const { address, isConnected } = useAccount();
	const [tokenIn, setTokenIn] = useState("");
	const [tokenOut, setTokenOut] = useState("");
	const [amountIn, setAmountIn] = useState("");
	const [userPortfolio, setUserPortfolio] = useState(
		portfolio?.data?.portfolio?.balances
	);

	const tokenInDecimals = useMemo(() => {
		if (tokenIn === ETH_ADDRESS) return 18;
		const token = userPortfolio?.find((item) => item.token.address === tokenIn);
		return token?.token.decimals || 18;
	}, [tokenIn, userPortfolio]);

	const tokenOutDecimals = useMemo(() => {
		if (tokenOut === ETH_ADDRESS) return 18;
		const token = userPortfolio?.find(
			(item) => item.token.address === tokenOut
		);
		return token?.token.decimals || 18;
	}, [tokenOut, userPortfolio]);

	// Initialize all three swap hooks
	const tokenToTokenSwap = useTokenSwap({
		swapContract: process.env.NEXT_PUBLIC_SWAP_CONTRACT,
		tokenIn: tokenIn,
		tokenOut: tokenOut,
		tokenInDecimals: tokenInDecimals,
		tokenOutDecimals: tokenOutDecimals,
	});

	const tokenToETHSwap = useTokenToETHSwap({
		swapContract: process.env.NEXT_PUBLIC_SWAP_CONTRACT,
		tokenIn: tokenIn,
		tokenInDecimals: tokenInDecimals,
	});

	const ethToTokenSwap = useETHToTokenSwap({
		swapContract: process.env.NEXT_PUBLIC_SWAP_CONTRACT,
		tokenOut: tokenOut,
		tokenOutDecimals: tokenOutDecimals,
	});

	// Determine swap type based on selected tokens
	const swapType = useMemo(() => {
		if (tokenIn === ETH_ADDRESS) return "eth-to-token";
		if (tokenOut === ETH_ADDRESS) return "token-to-eth";
		if (tokenIn !== ETH_ADDRESS && tokenOut !== ETH_ADDRESS)
			return "token-to-token";
		return "token-to-eth";
	}, [tokenIn, tokenOut]);

	// Select the appropriate swap hook based on swap type
	const activeSwap = useMemo(() => {
		switch (swapType) {
			case "token-to-token":
				return tokenToTokenSwap;
			case "token-to-eth":
				return tokenToETHSwap;
			case "eth-to-token":
				return ethToTokenSwap;
			default:
				return null;
		}
	}, [swapType, tokenToTokenSwap, tokenToETHSwap, ethToTokenSwap]);

	// Sync amount input with the active swap hook
	useEffect(() => {
		if (activeSwap && amountIn) {
			activeSwap.setAmountIn(amountIn);
		}
	}, [amountIn, activeSwap]);

	useEffect(() => {
		if (address) {
			console.log("Address changed:", address);
			dispatch(fetchPortfolio({ address }));
		}
	}, [address]);

	useEffect(() => {
		if (portfolio) {
			const filteredPortfolio =
				portfolio?.data?.portfolio?.balances?.filter(
					(item) => item.token.metadata?.spamCode === "SPAM_CODE_NOT_SPAM"
				) || [];
			setUserPortfolio(filteredPortfolio);
		}
	}, [portfolio]);

	useEffect(() => {
		console.log("Enough Liquidity?");
		console.log(activeSwap?.enoughLiquidity);
	}, [activeSwap?.enoughLiquidity, activeSwap]);

	// Create portfolio with ETH option
	const portfolioWithETH = useMemo(() => {
		return [...(userPortfolio || [])];
	}, [userPortfolio]);

	const handleSwapTokens = () => {
		const tempIn = tokenIn;
		setTokenIn(tokenOut);
		setTokenOut(tempIn);
	};

	const handleApprove = () => {
		if (swapType === "eth-to-token") return; // No approval needed for ETH
		activeSwap?.approveToken();
	};

	const handleSwap = () => {
		switch (swapType) {
			case "token-to-token":
				tokenToTokenSwap.executeSwap();
				break;
			case "token-to-eth":
				tokenToETHSwap.executeSwapToETH();
				break;
			case "eth-to-token":
				ethToTokenSwap.executeSwapETHForToken();
				break;
		}
	};

	if (!isConnected) {
		return (
			<div className='mt-20 flex flex-col items-center justify-center'>
				<p>Please connect your wallet</p>
			</div>
		);
	}

	// Get expected output based on swap type
	const getExpectedOutput = () => {
		switch (swapType) {
			case "token-to-token":
				return tokenToTokenSwap.expectedOut?.toString();
			case "token-to-eth":
				return tokenToETHSwap.expectedETH?.toString() + " wei";
			case "eth-to-token":
				return ethToTokenSwap.expectedTokenOut?.toString() + " tokens";
			default:
				return null;
		}
	};

	return (
		<div className='mt-20 flex flex-col items-center justify-center'>
			<div className='flex flex-col items-center justify-center space-y-4 w-full max-w-md'>
				<h2 className='text-2xl font-bold'>Token Swap</h2>

				<div className='w-full p-4 border rounded-lg space-y-4'>
					{/* Token In Selection */}
					<div>
						<label className='block text-sm font-medium mb-2'>From</label>
						<select
							value={tokenIn}
							onChange={(e) => {
								if (e.target.value === tokenOut) {
									handleSwapTokens();
								} else {
									setTokenIn(e.target.value);
								}
							}}
							className='w-full border p-2 rounded'
						>
							<option value=''>Select token</option>
							{portfolioWithETH?.map((item) => (
								<option key={item.token.address} value={item.token.address}>
									{item.token.symbol}
								</option>
							))}
						</select>
					</div>

					{/* Amount Input */}
					<div>
						<label className='block text-sm font-medium mb-2'>Amount</label>
						<input
							type='number'
							placeholder='0.0'
							value={amountIn}
							onChange={(e) => setAmountIn(e.target.value)}
							className='w-full border p-2 rounded'
						/>
						{activeSwap?.balance !== undefined && (
							<p className='text-sm text-gray-600 mt-1'>
								Balance:{" "}
								{formatUnits(
									activeSwap.balance.value ?? activeSwap.balance,
									tokenInDecimals
								)}
							</p>
						)}
					</div>

					{/* Swap Button */}
					<div className='flex justify-center'>
						<button
							onClick={handleSwapTokens}
							className='bg-gray-200 hover:bg-gray-300 p-2 rounded-full'
						>
							↕️
						</button>
					</div>

					{/* Token Out Selection */}
					<div>
						<label className='block text-sm font-medium mb-2'>To</label>
						<select
							value={tokenOut}
							onChange={(e) => {
								if (e.target.value === tokenIn) {
									handleSwapTokens();
								} else {
									setTokenOut(e.target.value);
								}
							}}
							className='w-full border p-2 rounded'
						>
							<option value=''>Select token</option>
							{portfolioWithETH?.map((item) => (
								<option key={item.token.address} value={item.token.address}>
									{item.token.symbol}
								</option>
							))}
						</select>
					</div>

					{/* Expected Output */}
					{getExpectedOutput() && (
						<div className='bg-gray-50 p-3 rounded'>
							<p className='text-sm text-gray-600'>Expected Output:</p>
							<p className='font-medium'>{getExpectedOutput()}</p>
						</div>
					)}
				</div>

				{/* Error Display */}
				{activeSwap &&
					(activeSwap.balanceError ||
						activeSwap.expectedOutError ||
						activeSwap.expectedETHError ||
						activeSwap.expectedTokenError) && (
						<div className='w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
							<p>
								Read error:{" "}
								{activeSwap.balanceError?.message ||
									activeSwap.expectedOutError?.message ||
									activeSwap.expectedETHError?.message ||
									activeSwap.expectedTokenError?.message}
							</p>
						</div>
					)}

				{/* Action Buttons */}
				<div className='flex space-x-4 w-full'>
					{activeSwap?.isApproved === false ? (
						<button
							onClick={handleApprove}
							disabled={!activeSwap || activeSwap?.isApproveLoading}
							className='flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400'
						>
							{activeSwap?.isApproveLoading ? "Approving..." : "Approve"}
						</button>
					) : (
						<button
							onClick={handleSwap}
							disabled={
								activeSwap?.isApproved === false ||
								activeSwap?.isSwapLoading ||
								!activeSwap
							}
							className='flex-1 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400'
						>
							{activeSwap?.isSwapLoading ? "Swapping..." : "Swap"}
						</button>
					)}
				</div>

				{/* Status Messages */}
				{activeSwap && (
					<div className='w-full space-y-2'>
						{activeSwap.isApproveLoading && (
							<p className='text-yellow-600'>
								⏳ Check your wallet for approval...
							</p>
						)}
						{activeSwap.approveConfirmed && (
							<p className='text-green-600'>✅ Approved!</p>
						)}
						{activeSwap.approveError && (
							<p className='text-red-600'>
								❌ Approve Error: {activeSwap.approveError.message}
							</p>
						)}

						{activeSwap.isSwapLoading && (
							<p className='text-yellow-600'>
								⏳ Confirm swap in your wallet...
							</p>
						)}
						{activeSwap.swapConfirmed && (
							<p className='text-green-600'>✅ Swap Completed!</p>
						)}
						{activeSwap.swapError && (
							<p className='text-red-600'>
								❌ Swap Error: {activeSwap.swapError.message}
							</p>
						)}

						{activeSwap?.swapReceiptError && (
							<p className='text-red-600'>
								❌ Swap Error: {activeSwap.swapReceiptError.message}
							</p>
						)}

						{activeSwap?.approveReceiptError && (
							<p className='text-red-600'>
								❌ Approve Error: {activeSwap?.approveReceiptError.message}
							</p>
						)}

						{amountIn > 0 && activeSwap?.enoughLiquidity === false && (
							<p className='text-red-600'>
								⚠️ Not enough liquidity for this swap
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
