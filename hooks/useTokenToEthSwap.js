"use client";

import { useState, useEffect } from "react";
import {
	useReadContract,
	useWriteContract,
	useWaitForTransactionReceipt,
	useAccount,
} from "wagmi";
import { parseUnits } from "viem";
import swapAbi from "./abi/uniswapv2.json";
import erc20Abi from "./abi/erc20.json";

export function useTokenToETHSwap({ swapContract, tokenIn, tokenInDecimals }) {
	const [amountIn, setAmountIn] = useState(0n);
	const { address: user } = useAccount();
	const [isApproved, setIsApproved] = useState(false);

	// Debug log
	console.log("useTokenToETHSwap hook initialized with:", {
		swapContract,
		tokenIn,
		user,
		swapAbi: swapAbi ? "ABI loaded" : "ABI undefined",
	});

	// 1. Read token balance
	const { data: balance, error: balanceError } = useReadContract({
		address: tokenIn,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: [user],
		query: { enabled: !!user },
	});

	// 2. Read allowance
	const { data: allowance, error: allowanceError,
		refetch: refetchAllowance } = useReadContract({
			address: tokenIn,
			abi: erc20Abi,
			functionName: "allowance",
			args: [user, swapContract],
			query: { enabled: !!user && !!swapContract, refetchInterval: 1000 },
		});

	// 3. Expected ETH output
	const {
		data: expectedETH,
		error: expectedETHError,
	} = useReadContract({
		address: swapContract,
		abi: swapAbi,
		functionName: "getPriceTokenToETH",
		args: [tokenIn, amountIn],
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

		console.log("🔥 Approve clicked for ETH swap:", {
			swapContract,
			tokenIn,
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

			console.log("Sending approve transaction for ETH swap...");

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

	// 5. SWAP TOKEN FOR ETH
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
			console.log("💧 Swap confirmed, refetching allowance");
			refetchAllowance();
		},
	});

	const executeSwapToETH = () => {
		if (amountIn <= 0n) return alert("Enter amount first!");

		// Check if approved (either via previous allowance or recent approval)
		if (!isApproved && !approveConfirmed) {
			return alert("Approve first!");
		}

		console.log("💧 Swap to ETH clicked");

		try {
			// Validate swap ABI
			if (!swapAbi || !Array.isArray(swapAbi)) {
				throw new Error("Swap ABI is invalid or not loaded");
			}

			if (!swapContract) {
				throw new Error("Swap contract address is missing");
			}

			console.log("Sending swap to ETH transaction...");

			swap({
				address: swapContract,
				abi: swapAbi,
				functionName: "swapTokenForETH",
				args: [tokenIn, amountIn],
			});

			console.log("Swap to ETH transaction sent successfully");
		} catch (error) {
			console.error("Swap to ETH error:", error);
			alert(`Swap to ETH failed: ${error.message}`);
		}
	};

	// Log errors for debugging
	if (balanceError) console.error("Balance error:", balanceError);
	if (allowanceError) console.error("Allowance error:", allowanceError);
	if (expectedETHError) console.error("Expected ETH error:", expectedETHError);
	if (approveError) console.error("Approve error:", approveError);
	if (swapError) console.error("Swap error:", swapError);

	useEffect(() => {
		setIsApproved(allowance && amountIn > 0n ? allowance >= amountIn : false);
	}, [allowance, amountIn]);


	return {
		balance,
		allowance,
		expectedETH,
		isApproved: isApproved, // Consider approved if allowance is sufficient OR approval was confirmed
		approveToken,
		executeSwapToETH,
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
		expectedETHError,
		approveReceiptError,
		swapReceiptError,
		allowance,
		setAmountIn: (v) => {
			try {
				setAmountIn(parseUnits(v, tokenInDecimals));
			} catch (error) {
				console.error("Error parsing amount:", error);
				setAmountIn(0n);
			}
		},
		// Helper to reset the state if needed
		reset: () => {
			setAmountIn(0n);
		},
	};
}
