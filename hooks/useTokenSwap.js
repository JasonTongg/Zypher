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
import { toast } from "react-toastify";

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

	const { data: expectedOut, error: expectedOutError } = useReadContract({
		address: swapContract,
		abi: swapAbi,
		functionName: "getPriceTokenToToken",
		args: [tokenIn, tokenOut, amountIn],
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
		args: [tokenIn, tokenOut, tokenIn, amountIn],
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
		},
	});

	const executeSwap = () => {
		if (amountIn <= 0n) return toast.error("Enter amount first!");

		if (!enoughLiquidity) {
			return toast.error("Not enough liquidity for this trade!");
		}

		if (!isApproved && !approveConfirmed) {
			return toast.error("Approve first!");
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
				functionName: "swapToken",
				args: [tokenIn, tokenOut, amountIn],
			});
		} catch (error) {
			console.error("Swap error:", error);
		}
	};

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
		isApproved: isApproved,
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
		enoughLiquidity,
		liquidityError,
		refetchBalance,
		setAmountIn: (v) => {
			try {
				setAmountIn(parseUnits(v, tokenInDecimals));
			} catch (error) {
				setAmountIn(0n);
			}
		},
	};
}
