"use client";

import { useState } from "react";
import {
	useReadContract,
	useWriteContract,
	useWaitForTransactionReceipt,
	useAccount,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import swapAbi from "./abi/uniswapv2.json";
import erc20Abi from "./abi/erc20.json";

export function useTokenSwap({ swapContract, tokenIn, tokenOut }) {
	const [amountIn, setAmountIn] = useState(0n);
	const [amountOut, setAmountOut] = useState(0n);
	const { address: user } = useAccount();

	// 1. Read token balance
	const { data: balance, error: balanceError } = useReadContract({
		address: tokenIn,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: [user],
		query: { enabled: !!user },
	});

	// 2. Expected output (input → output)
	const { data: expectedOut, error: expectedOutError } = useReadContract({
		address: swapContract,
		abi: swapAbi,
		functionName: "getPriceTokenToToken",
		args: [tokenIn, tokenOut, amountIn],
		query: {
			enabled: !!user && amountIn > 0n && !!swapAbi,
		},
	});

	// 3. Expected input (output → input)
	const { data: expectedIn, error: expectedInError } = useReadContract({
		address: swapContract,
		abi: swapAbi,
		functionName: "getPriceTokenToToken", // You might need a reverse function
		args: [tokenOut, tokenIn, amountOut], // Reverse the tokens
		query: {
			enabled: !!user && amountOut > 0n && !!swapAbi,
		},
	});

	// 4. APPROVE
	const {
		writeContract: approve,
		data: approveHash,
		isPending: isApproveLoading,
		error: approveError,
	} = useWriteContract();

	const {
		isSuccess: approveConfirmed,
		isError: approveFailed,
		error: approveReceiptError,
	} = useWaitForTransactionReceipt({
		hash: approveHash,
	});

	const approveToken = async () => {
		if (amountIn <= 0n) return alert("Enter amount first!");

		console.log("🔥 Approve clicked with details:", {
			swapContract,
			tokenIn,
			tokenOut,
			amountIn,
			user,
		});

		try {
			if (!tokenIn || !swapContract) {
				throw new Error("Missing required contract addresses");
			}

			if (!erc20Abi || !Array.isArray(erc20Abi)) {
				throw new Error("ERC20 ABI is invalid");
			}

			console.log("Sending approve transaction...");

			approve({
				address: tokenIn,
				abi: erc20Abi,
				functionName: "approve",
				args: [swapContract, amountIn],
			});

			console.log("Approve transaction sent successfully");
		} catch (error) {
			console.error("Approve error:", error);
			alert(`Approve failed: ${error.message}`);
		}
	};

	// 5. SWAP
	const {
		writeContract: swap,
		data: swapHash,
		isPending: isSwapLoading,
		error: swapError,
	} = useWriteContract();

	const {
		isSuccess: swapConfirmed,
		isError: swapFailed,
		error: swapReceiptError,
	} = useWaitForTransactionReceipt({
		hash: swapHash,
	});

	const executeSwap = () => {
		if (!approveConfirmed) return alert("Approve first!");
		if (amountIn <= 0n) return alert("Enter amount first!");

		console.log("💧 Swap clicked");

		try {
			if (!swapAbi || !Array.isArray(swapAbi)) {
				throw new Error("Swap ABI is invalid or not loaded");
			}

			if (!swapContract) {
				throw new Error("Swap contract address is missing");
			}

			console.log("Sending swap transaction...");

			swap({
				address: swapContract,
				abi: swapAbi,
				functionName: "swapToken",
				args: [tokenIn, tokenOut, amountIn],
			});

			console.log("Swap transaction sent successfully");
		} catch (error) {
			console.error("Swap error:", error);
			alert(`Swap failed: ${error.message}`);
		}
	};

	// Log errors for debugging
	if (balanceError) console.error("Balance error:", balanceError);
	if (expectedOutError) console.error("Expected out error:", expectedOutError);
	if (expectedInError) console.error("Expected in error:", expectedInError);
	if (approveError) console.error("Approve error:", approveError);
	if (swapError) console.error("Swap error:", swapError);

	return {
		balance,
		expectedOut,
		expectedIn,
		approveToken,
		executeSwap,
		approveConfirmed,
		swapConfirmed,
		isApproveLoading,
		isSwapLoading,
		approveError,
		swapError,
		approveFailed,
		swapFailed,
		balanceError,
		expectedOutError,
		expectedInError,
		setAmountIn: (v) => {
			try {
				setAmountIn(parseUnits(v, 18));
				setAmountOut(0n);
			} catch (error) {
				console.error("Error parsing amount:", error);
				setAmountIn(0n);
			}
		},
		setAmountOut: (v) => {
			try {
				setAmountOut(parseUnits(v, 18));
				setAmountIn(0n);
			} catch (error) {
				console.error("Error parsing amount:", error);
				setAmountOut(0n);
			}
		},
	};
}