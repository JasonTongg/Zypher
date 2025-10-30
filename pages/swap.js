"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPortfolio } from "../store/data";
import { useAccount, useBalance } from "wagmi";
import { useTokenSwap } from "@/hooks/useTokenSwap";
import { useTokenToETHSwap } from "@/hooks/useTokenToEthSwap";
import { useETHToTokenSwap } from "@/hooks/useEthToTokenSwap";
import { parseUnits, formatUnits } from "viem";

// ETH address constant
const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";

export default function Swap() {
	const dispatch = useDispatch();
	const { portfolio } = useSelector((state) => state.data);
	const { address, isConnected } = useAccount();
	const { data: ethBalance } = useBalance({ address });

	const [tokenIn, setTokenIn] = useState("");
	const [tokenOut, setTokenOut] = useState("");
	const [userPortfolio, setUserPortfolio] = useState([]);
	const [inputAmount, setInputAmount] = useState("");
	const [outputAmount, setOutputAmount] = useState("");
	const [isInputMode, setIsInputMode] = useState(true);

	// Memoized token maps for easy lookup
	const tokenMap = useMemo(() => {
		const map = {};
		if (userPortfolio?.length) {
			userPortfolio.forEach((item) => {
				map[item.token.address] = {
					...item.token,
					balance: item.amount.raw,
				};
			});
		}
		return map;
	}, [userPortfolio]);

	// Get token decimals
	const getTokenDecimals = (tokenAddress) => {
		if (tokenAddress === ETH_ADDRESS) return 18;
		return tokenMap[tokenAddress]?.decimals || 18;
	};

	// Format balance for display
	const formatBalance = (tokenAddress) => {
		if (!tokenAddress || !tokenMap[tokenAddress]) return "0";

		const token = tokenMap[tokenAddress];
		if (token.address === ETH_ADDRESS && ethBalance) {
			return Number(ethBalance.formatted).toFixed(6);
		}

		try {
			const formatted = formatUnits(BigInt(token.balance), token.decimals);
			return Number(formatted).toFixed(6);
		} catch {
			return "0";
		}
	};

	// Parse amount with correct decimals
	const parseAmount = (amount, tokenAddress) => {
		if (!amount || !tokenAddress) return 0n;
		try {
			const decimals = getTokenDecimals(tokenAddress);
			return parseUnits(amount, decimals);
		} catch {
			return 0n;
		}
	};

	// Format amount with correct decimals for display
	const formatAmount = (amount, tokenAddress) => {
		if (!amount || !tokenAddress) return "";
		try {
			const decimals = getTokenDecimals(tokenAddress);
			return formatUnits(amount, decimals);
		} catch {
			return "";
		}
	};

	// Determine swap type based on token selection
	const isETHToToken = tokenIn === ETH_ADDRESS && tokenOut !== ETH_ADDRESS;
	const isTokenToETH = tokenIn !== ETH_ADDRESS && tokenOut === ETH_ADDRESS;
	const isTokenToToken =
		tokenIn !== ETH_ADDRESS && tokenOut !== ETH_ADDRESS && tokenIn && tokenOut;

	// Initialize hooks for all swap types
	const tokenSwap = useTokenSwap({
		swapContract: process.env.NEXT_PUBLIC_SWAP_CONTRACT,
		tokenIn: tokenIn,
		tokenOut: tokenOut,
	});

	const tokenToETHSwap = useTokenToETHSwap({
		swapContract: process.env.NEXT_PUBLIC_SWAP_CONTRACT,
		tokenIn: tokenIn,
	});

	const ethToTokenSwap = useETHToTokenSwap({
		swapContract: process.env.NEXT_PUBLIC_SWAP_CONTRACT,
		tokenOut: tokenOut,
	});

	// Get the active swap hook based on swap type
	const getActiveSwap = () => {
		if (isETHToToken) return ethToTokenSwap;
		if (isTokenToETH) return tokenToETHSwap;
		if (isTokenToToken) return tokenSwap;
		return null;
	};

	const activeSwap = getActiveSwap();

	// Update output when input changes
	useEffect(() => {
		if (isInputMode && inputAmount && activeSwap) {
			let formattedOutput = "";

			if (isTokenToToken && activeSwap.expectedOut) {
				formattedOutput = formatAmount(activeSwap.expectedOut, tokenOut);
			} else if (isTokenToETH && activeSwap.expectedETH) {
				formattedOutput = formatAmount(activeSwap.expectedETH, ETH_ADDRESS);
			} else if (isETHToToken && activeSwap.expectedTokenOut) {
				formattedOutput = formatAmount(activeSwap.expectedTokenOut, tokenOut);
			}

			setOutputAmount(formattedOutput);
		}
	}, [
		activeSwap?.expectedOut,
		activeSwap?.expectedETH,
		activeSwap?.expectedTokenOut,
		tokenOut,
		isInputMode,
		inputAmount,
	]);

	// Update input when output changes (reverse calculation)
	useEffect(() => {
		if (!isInputMode && outputAmount && activeSwap) {
			let formattedInput = "";

			if (isTokenToToken && activeSwap.expectedIn) {
				formattedInput = formatAmount(activeSwap.expectedIn, tokenIn);
			} else if (isTokenToETH && activeSwap.expectedTokenIn) {
				formattedInput = formatAmount(activeSwap.expectedTokenIn, tokenIn);
			} else if (isETHToToken && activeSwap.expectedETHIn) {
				formattedInput = formatAmount(activeSwap.expectedETHIn, ETH_ADDRESS);
			}

			setInputAmount(formattedInput);
		}
	}, [
		activeSwap?.expectedIn,
		activeSwap?.expectedTokenIn,
		activeSwap?.expectedETHIn,
		tokenIn,
		isInputMode,
		outputAmount,
	]);

	// Handle input amount change
	const handleInputAmountChange = (value) => {
		setInputAmount(value);
		setIsInputMode(true);

		if (activeSwap && value && tokenIn) {
			const parsedAmount = parseAmount(value, tokenIn);
			activeSwap.setAmountIn(parsedAmount);
		}
	};

	// Handle output amount change (reverse calculation)
	const handleOutputAmountChange = (value) => {
		setOutputAmount(value);
		setIsInputMode(false);

		if (activeSwap && value && tokenOut) {
			const parsedAmount = parseAmount(value, tokenOut);
			activeSwap.setAmountOut(parsedAmount);
		}
	};

	// Handle token selection with auto-swap prevention
	const handleTokenInChange = (newTokenIn) => {
		if (newTokenIn === tokenOut) {
			setTokenIn(tokenOut);
			setTokenOut(newTokenIn);
		} else {
			setTokenIn(newTokenIn);
		}
		// Reset amounts when token changes
		setInputAmount("");
		setOutputAmount("");
	};

	const handleTokenOutChange = (newTokenOut) => {
		if (newTokenOut === tokenIn) {
			setTokenOut(tokenIn);
			setTokenIn(newTokenOut);
		} else {
			setTokenOut(newTokenOut);
		}
		// Reset amounts when token changes
		setInputAmount("");
		setOutputAmount("");
	};

	// Swap tokens direction
	const swapTokens = () => {
		setTokenIn(tokenOut);
		setTokenOut(tokenIn);
		// Also swap amounts
		const temp = inputAmount;
		setInputAmount(outputAmount);
		setOutputAmount(temp);
	};

	// Execute swap based on type
	const executeSwap = () => {
		if (!activeSwap) return;

		if (isETHToToken) {
			activeSwap.executeSwapETHForToken();
		} else if (isTokenToETH) {
			activeSwap.executeSwapToETH();
		} else if (isTokenToToken) {
			activeSwap.executeSwap();
		}
	};

	// Execute approval (only needed for token swaps)
	const executeApprove = () => {
		if (activeSwap?.approveToken) {
			activeSwap.approveToken();
		}
	};

	// Set max amount
	const setMaxAmount = () => {
		if (!tokenIn) return;

		let maxAmount = "0";
		if (tokenIn === ETH_ADDRESS && ethBalance) {
			// Leave some ETH for gas (0.01 ETH)
			const gasBuffer = parseUnits("0.01", 18);
			const balance = BigInt(ethBalance.value);
			if (balance > gasBuffer) {
				const max = balance - gasBuffer;
				maxAmount = formatAmount(max, ETH_ADDRESS);
			} else {
				maxAmount = ethBalance.formatted;
			}
		} else if (tokenMap[tokenIn]) {
			maxAmount = formatBalance(tokenIn);
		}

		setInputAmount(maxAmount);
		handleInputAmountChange(maxAmount);
	};

	useEffect(() => {
		if (address) {
			dispatch(fetchPortfolio({ address }));
		}
	}, [address, dispatch]);

	useEffect(() => {
		if (portfolio) {
			const filteredPortfolio =
				portfolio?.data?.portfolio?.balances?.filter(
					(item) => item.token.metadata?.spamCode === "SPAM_CODE_NOT_SPAM"
				) || [];
			setUserPortfolio(filteredPortfolio);

			// Set default tokens
			if (filteredPortfolio.length > 0 && !tokenIn) {
				const ethToken = filteredPortfolio.find(
					(item) => item.token.address === ETH_ADDRESS
				);
				const nonEthToken = filteredPortfolio.find(
					(item) => item.token.address !== ETH_ADDRESS
				);

				if (nonEthToken) setTokenIn(nonEthToken.token.address);
				if (ethToken && nonEthToken) setTokenOut(ETH_ADDRESS);
			}
		}
	}, [portfolio, tokenIn]);

	if (!isConnected) {
		return (
			<div className='mt-20 flex flex-col items-center justify-center'>
				<p>Please connect your wallet</p>
			</div>
		);
	}

	const tokenInData = tokenMap[tokenIn];
	const tokenOutData = tokenMap[tokenOut];

	return (
		<div className='mt-20 flex flex-col items-center justify-center space-y-6 max-w-md mx-auto'>
			<h2 className='text-2xl font-bold'>Swap</h2>

			{/* Token Selection */}
			<div className='w-full p-4 border rounded-lg space-y-4'>
				<div className='flex items-center space-x-4'>
					<div className='flex-1'>
						<label className='block text-sm font-medium mb-2'>From</label>
						<select
							value={tokenIn}
							onChange={(e) => handleTokenInChange(e.target.value)}
							className='w-full border p-2 rounded'
						>
							<option value=''>Select token</option>
							{userPortfolio?.map((item) => (
								<option key={item.token.address} value={item.token.address}>
									{item.token.symbol}
								</option>
							))}
						</select>
						{tokenIn && (
							<p className='text-xs text-gray-500 mt-1'>
								Balance: {formatBalance(tokenIn)} {tokenInData?.symbol}
							</p>
						)}
					</div>

					<button
						onClick={swapTokens}
						className='mt-6 p-2 bg-gray-200 rounded hover:bg-gray-300'
						disabled={!tokenIn || !tokenOut}
					>
						⇄
					</button>

					<div className='flex-1'>
						<label className='block text-sm font-medium mb-2'>To</label>
						<select
							value={tokenOut}
							onChange={(e) => handleTokenOutChange(e.target.value)}
							className='w-full border p-2 rounded'
						>
							<option value=''>Select token</option>
							{userPortfolio?.map((item) => (
								<option key={item.token.address} value={item.token.address}>
									{item.token.symbol}
								</option>
							))}
						</select>
						{tokenOut && (
							<p className='text-xs text-gray-500 mt-1'>
								Balance: {formatBalance(tokenOut)} {tokenOutData?.symbol}
							</p>
						)}
					</div>
				</div>

				{/* Input Amount */}
				<div>
					<div className='flex justify-between items-center mb-2'>
						<label className='block text-sm font-medium'>Input Amount</label>
						<button
							onClick={setMaxAmount}
							className='text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200'
						>
							MAX
						</button>
					</div>
					<input
						type='number'
						placeholder='0.0'
						value={inputAmount}
						onChange={(e) => handleInputAmountChange(e.target.value)}
						className='w-full border p-2 rounded'
						step='any'
					/>
					{tokenInData && (
						<p className='text-xs text-gray-500 mt-1'>
							{tokenInData.symbol} • {getTokenDecimals(tokenIn)} decimals
						</p>
					)}
				</div>

				{/* Output Amount */}
				<div>
					<label className='block text-sm font-medium mb-2'>
						Output Amount
					</label>
					<input
						type='number'
						placeholder='0.0'
						value={outputAmount}
						onChange={(e) => handleOutputAmountChange(e.target.value)}
						className='w-full border p-2 rounded'
						step='any'
					/>
					{tokenOutData && (
						<p className='text-xs text-gray-500 mt-1'>
							{tokenOutData.symbol} • {getTokenDecimals(tokenOut)} decimals
						</p>
					)}
				</div>
			</div>

			{/* Error Display */}
			{activeSwap && (
				<>
					{(activeSwap.balanceError ||
						activeSwap.expectedOutError ||
						activeSwap.expectedETHError ||
						activeSwap.expectedTokenError ||
						activeSwap.expectedInError ||
						activeSwap.expectedTokenInError ||
						activeSwap.expectedETHInError) && (
						<div className='w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
							<p>
								Read error:{" "}
								{activeSwap.balanceError?.message ||
									activeSwap.expectedOutError?.message ||
									activeSwap.expectedETHError?.message ||
									activeSwap.expectedTokenError?.message ||
									activeSwap.expectedInError?.message ||
									activeSwap.expectedTokenInError?.message ||
									activeSwap.expectedETHInError?.message}
							</p>
						</div>
					)}
				</>
			)}

			{/* Action Buttons */}
			<div className='w-full space-y-4'>
				{/* Approve Button (only for token swaps) */}
				{(isTokenToETH || isTokenToToken) &&
					activeSwap?.approveToken &&
					!activeSwap?.approveConfirmed && (
						<button
							onClick={executeApprove}
							disabled={activeSwap.isApproveLoading || !inputAmount}
							className='w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded disabled:bg-gray-400'
						>
							{activeSwap.isApproveLoading
								? "Approving..."
								: `Approve ${tokenInData?.symbol}`}
						</button>
					)}

				{/* Swap Button */}
				<button
					onClick={executeSwap}
					disabled={
						activeSwap?.isSwapLoading ||
						!inputAmount ||
						!tokenIn ||
						!tokenOut ||
						tokenIn === tokenOut ||
						((isTokenToETH || isTokenToToken) && !activeSwap?.approveConfirmed)
					}
					className='w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded disabled:bg-gray-400'
				>
					{activeSwap?.isSwapLoading
						? "Swapping..."
						: `Swap ${tokenInData?.symbol} for ${tokenOutData?.symbol}`}
				</button>
			</div>

			{/* Status Messages */}
			{activeSwap && (
				<div className='w-full space-y-2'>
					{activeSwap.isApproveLoading && (
						<p className='text-yellow-600 text-center'>
							⏳ Check your wallet for approval...
						</p>
					)}
					{activeSwap.approveConfirmed && (
						<p className='text-green-600 text-center'>✅ Approved!</p>
					)}
					{activeSwap.approveError && (
						<p className='text-red-600 text-center'>
							❌ Approve Error: {activeSwap.approveError.message}
						</p>
					)}

					{activeSwap.isSwapLoading && (
						<p className='text-yellow-600 text-center'>
							⏳ Confirm swap in your wallet...
						</p>
					)}
					{activeSwap.swapConfirmed && (
						<p className='text-green-600 text-center'>✅ Swap Completed!</p>
					)}
					{activeSwap.swapError && (
						<p className='text-red-600 text-center'>
							❌ Swap Error: {activeSwap.swapError.message}
						</p>
					)}
				</div>
			)}
		</div>
	);
}
