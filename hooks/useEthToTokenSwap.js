"use client";

import { useState } from "react";
import {
	useReadContract,
	useWriteContract,
	useWaitForTransactionReceipt,
	useAccount,
} from "wagmi";
import { parseEther } from "viem";
import swapAbi from "./abi/uniswapv2.json";
import { useBalance } from "wagmi";
import { toast } from "react-toastify";

export function useETHToTokenSwap({
	swapContract,
	tokenOut,
	tokenOutDecimals,
}) {
	const [amountIn, setAmountIn] = useState(0n);
	const { address: user } = useAccount();
	const { data: balance } = useBalance({
		address: user,
	});

	const { data: expectedTokenOut, error: expectedTokenError } = useReadContract(
		{
			address: swapContract,
			abi: swapAbi,
			functionName: "getPriceETHtoToken",
			args: [tokenOut, amountIn],
			query: {
				enabled: !!user && amountIn > 0n && !!swapAbi,
			},
		}
	);

	const {
		data: enoughLiquidity,
		error: liquidityError,
		refetch: refetchLiquidity,
	} = useReadContract({
		address: swapContract,
		abi: swapAbi,
		functionName: "_checkEnoughLiquidity",
		args: [
			"0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
			tokenOut,
			"0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
			amountIn,
		],
		query: {
			enabled: !!user && amountIn > 0n,
			refetchInterval: 2000,
		},
	});

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
			refetchLiquidity();
		},
	});

	const executeSwapETHForToken = () => {
		if (amountIn <= 0n) return toast.error("Enter ETH amount first!");

		if (!enoughLiquidity) {
			return toast.error("Not enough liquidity for this trade!");
		}
		try {
			swap({
				address: swapContract,
				abi: swapAbi,
				functionName: "swapETHForToken",
				args: [tokenOut],
				value: amountIn,
			});
		} catch (error) {
			console.error("ETH to token swap error:", error);
		}
	};

	const isApproved = true;

	return {
		expectedTokenOut,
		executeSwapETHForToken,
		swapConfirmed,
		isSwapLoading,
		swapError,
		expectedTokenError,
		swapFailed,
		swapReceiptError,
		isApproved,
		balance,
		enoughLiquidity,
		liquidityError,
		setAmountIn: (v) => {
			try {
				setAmountIn(parseEther(v));
			} catch (error) {
				console.error("Error parsing ETH amount:", error);
				setAmountIn(0n);
			}
		},
	};
}
