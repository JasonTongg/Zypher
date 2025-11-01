"use client";

import { useEffect, useState } from "react";
import {
	useReadContract,
	useWriteContract,
	useWaitForTransactionReceipt,
	useAccount,
} from "wagmi";
import { parseUnits } from "viem";
import swapAbi from "./abi/uniswapv2.json";
import erc20Abi from "./abi/erc20.json";

export function useTokenSwap({
	swapContract,
	tokenIn,
	tokenOut,
	tokenInDecimals,
	tokenOutDecimals,
}) {
	const [amountIn, setAmountIn] = useState(0n);
	const { address: user } = useAccount();
	const [isApproved, setIsApproved] = useState(false);

	// 1. Read token balance
	const { data: balance, error: balanceError } = useReadContract({
		address: tokenIn,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: [user],
		query: { enabled: !!user },
	});

	// 2. Read allowance
	const {
		data: allowance,
		error: allowanceError,
		refetch: refetchAllowance,
	} = useReadContract({
		address: tokenIn,
		abi: erc20Abi,
		functionName: "allowance",
		args: [user, swapContract],
		query: { enabled: !!user && !!swapContract, refetchInterval: 1000 },
	});

	// 3. Expected output with error handling
	const { data: expectedOut, error: expectedOutError } = useReadContract({
		address: swapContract,
		abi: swapAbi,
		functionName: "getPriceTokenToToken",
		args: [tokenIn, tokenOut, amountIn],
		query: {
			enabled: !!user && amountIn > 0n && !!swapAbi,
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
		onSuccess: () => {
			console.log("✅ Approval confirmed, refetching allowance");
			refetchAllowance();
		},
	});

	const approveToken = async () => {
		if (amountIn <= 0n) return alert("Enter amount first!");

		// Check if already approved
		if (isApproved) {
			console.log("✅ Allowance already sufficient, no approval needed");
			return;
		}

		console.log("🔥 Approve clicked with details:", {
			swapContract,
			tokenIn,
			tokenOut,
			amountIn,
			user,
			currentAllowance: allowance?.toString(),
			requiredAllowance: amountIn.toString(),
		});

		try {
			// Validate inputs
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
		onSuccess: () => {
			console.log("✅ Approval confirmed, refetching allowance");
			refetchAllowance();
		},
	});

	const executeSwap = () => {
		if (amountIn <= 0n) return alert("Enter amount first!");

		// Check if approved (either via previous allowance or recent approval)
		if (!isApproved && !approveConfirmed) {
			return alert("Approve first!");
		}

		console.log("💧 Swap clicked");

		try {
			// Validate swap ABI
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
	if (allowanceError) console.error("Allowance error:", allowanceError);
	if (expectedOutError) console.error("Expected out error:", expectedOutError);
	if (approveError) console.error("Approve error:", approveError);
	if (swapError) console.error("Swap error:", swapError);

	useEffect(() => {
		setIsApproved(allowance && amountIn > 0n ? allowance >= amountIn : false);
	}, [allowance, amountIn]);

	return {
		balance,
		allowance,
		expectedOut,
		isApproved: isApproved, // Consider approved if allowance is sufficient OR approval was confirmed
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
		allowanceError,
		expectedOutError,
		swapReceiptError,
		approveReceiptError,
		allowance,
		setAmountIn: (v) => {
			try {
				console.log("set amount in");
				console.log(v);
				setAmountIn(parseUnits(v, tokenInDecimals));
			} catch (error) {
				console.error("Error parsing amount:", error);
				setAmountIn(0n);
			}
		},
	};
}
