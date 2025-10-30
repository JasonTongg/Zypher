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

export function useTokenToETHSwap({ swapContract, tokenIn }) {
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

	// 2. Expected ETH output (token → ETH)
	const { data: expectedETH, error: expectedETHError } = useReadContract({
		address: swapContract,
		abi: swapAbi,
		functionName: "getPriceTokenToETH",
		args: [tokenIn, amountIn],
		query: {
			enabled: !!user && amountIn > 0n && !!swapAbi,
		},
	});

	// 3. Expected token input (ETH → token)
	const { data: expectedTokenIn, error: expectedTokenInError } =
		useReadContract({
			address: swapContract,
			abi: swapAbi,
			functionName: "getPriceETHtoToken",
			args: [tokenIn, amountOut],
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

		console.log("🔥 Approve clicked for ETH swap:", {
			swapContract,
			tokenIn,
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
	});

	const executeSwapToETH = () => {
		if (!approveConfirmed) return alert("Approve first!");
		if (amountIn <= 0n) return alert("Enter amount first!");

		console.log("💧 Swap to ETH clicked");

		try {
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
	if (expectedETHError) console.error("Expected ETH error:", expectedETHError);
	if (expectedTokenInError)
		console.error("Expected token in error:", expectedTokenInError);
	if (approveError) console.error("Approve error:", approveError);
	if (swapError) console.error("Swap error:", swapError);

	return {
		balance,
		expectedETH,
		expectedTokenIn,
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
		expectedETHError,
		expectedTokenInError,
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
