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
import { toast } from "react-toastify";

export function useTokenToETHSwap({ swapContract, tokenIn, tokenInDecimals }) {
	const [amountIn, setAmountIn] = useState(0n);
	const { address: user } = useAccount();
	const [isApproved, setIsApproved] = useState(false);

	const {
		data: balance,
		error: balanceError,
		refetch: refetchBalance,
	} = useReadContract({
		address: tokenIn,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: [user],
		query: { enabled: !!user },
	});

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

	const { data: expectedETH, error: expectedETHError } = useReadContract({
		address: swapContract,
		abi: swapAbi,
		functionName: "getPriceTokenToETH",
		args: [tokenIn, amountIn],
		query: {
			enabled: !!user && amountIn > 0n && !!swapAbi,
		},
	});

	const {
		data: enoughLiquidity,
		error: liquidityError,
		refetch: refetchLiquidity,
	} = useReadContract({
		address: swapContract,
		abi: swapAbi,
		functionName: "_checkEnoughLiquidity",
		args: [
			tokenIn,
			"0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
			tokenIn,
			amountIn,
		],
		query: {
			enabled: !!user && amountIn > 0n,
			refetchInterval: 2000,
		},
	});

	const {
		writeContract: approve,
		data: approveHash,
		error: approveError,
	} = useWriteContract();

	const {
		isSuccess: approveConfirmed,
		isError: approveFailed,
		error: approveReceiptError,
		isLoading: isApproveLoading,
	} = useWaitForTransactionReceipt({
		hash: approveHash,
		onSuccess: () => {
			refetchAllowance();
		},
	});

	const approveToken = async () => {
		if (amountIn <= 0n) return toast.error("Enter amount first!");

		if (isApproved) {
			return;
		}

		try {
			if (!tokenIn || !swapContract) {
				throw new Error("Missing required contract addresses");
			}

			if (!erc20Abi || !Array.isArray(erc20Abi)) {
				throw new Error("ERC20 ABI is invalid");
			}

			approve({
				address: tokenIn,
				abi: erc20Abi,
				functionName: "approve",
				args: [swapContract, amountIn],
			});
		} catch (error) {
			console.error("Approve error:", error);
		}
	};

	const {
		writeContract: swap,
		data: swapHash,
		error: swapError,
	} = useWriteContract();

	const {
		isSuccess: swapConfirmed,
		isError: swapFailed,
		error: swapReceiptError,
		isLoading: isSwapLoading,
	} = useWaitForTransactionReceipt({
		hash: swapHash,
		onSuccess: () => {
			refetchAllowance();
			refetchLiquidity();
			refetchBalance();
		},
	});

	const executeSwapToETH = () => {
		if (amountIn <= 0n) return toast.error("Enter amount first!");

		if (!isApproved && !approveConfirmed) {
			return toast.error("Approve first!");
		}

		if (!enoughLiquidity) {
			return toast.error("Not enough liquidity for this trade!");
		}

		try {
			if (!swapAbi || !Array.isArray(swapAbi)) {
				throw new Error("Swap ABI is invalid or not loaded");
			}

			if (!swapContract) {
				throw new Error("Swap contract address is missing");
			}

			swap({
				address: swapContract,
				abi: swapAbi,
				functionName: "swapTokenForETH",
				args: [tokenIn, amountIn],
			});
		} catch (error) {
			console.error("Swap to ETH error:", error);
		}
	};

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
		isApproved: isApproved,
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
		enoughLiquidity,
		liquidityError,
		refetchBalance,
		setAmountIn: (v) => {
			try {
				setAmountIn(parseUnits(v, tokenInDecimals));
			} catch (error) {
				console.error("Error parsing amount:", error);
				setAmountIn(0n);
			}
		},
		reset: () => {
			setAmountIn(0n);
		},
	};
}
