"use client";

import { useState } from "react";
import {
	useReadContract,
	useWriteContract,
	useWaitForTransactionReceipt,
	useAccount,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import swapAbi from "./abi/uniswapv2.json";

export function useETHToTokenSwap({ swapContract, tokenOut }) {
	const [amountIn, setAmountIn] = useState(0n);
	const [amountOut, setAmountOut] = useState(0n);
	const { address: user } = useAccount();

	// Expected token output for ETH input (ETH → token)
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

	// Expected ETH input for token output (token → ETH)
	const { data: expectedETHIn, error: expectedETHInError } = useReadContract({
		address: swapContract,
		abi: swapAbi,
		functionName: "getPriceTokenToETH",
		args: [tokenOut, amountOut],
		query: {
			enabled: !!user && amountOut > 0n && !!swapAbi,
		},
	});

	// SWAP ETH FOR TOKEN
	const {
		writeContract: swap,
		data: swapHash,
		isPending: isSwapLoading,
		error: swapError,
	} = useWriteContract();

	const { isSuccess: swapConfirmed, isError: swapFailed } =
		useWaitForTransactionReceipt({
			hash: swapHash,
		});

	const executeSwapETHForToken = () => {
		if (amountIn <= 0n) return alert("Enter ETH amount first!");

		console.log("💧 Swap ETH for token clicked");

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

	// Log errors for debugging
	if (expectedTokenError)
		console.error("Expected token error:", expectedTokenError);
	if (expectedETHInError)
		console.error("Expected ETH in error:", expectedETHInError);
	if (swapError) console.error("Swap error:", swapError);

	return {
		expectedTokenOut,
		expectedETHIn,
		executeSwapETHForToken,
		swapConfirmed,
		isSwapLoading,
		swapError,
		expectedTokenError,
		expectedETHInError,
		setAmountIn: (v) => {
			try {
				setAmountIn(parseEther(v));
				setAmountOut(0n);
			} catch (error) {
				console.error("Error parsing ETH amount:", error);
				setAmountIn(0n);
			}
		},
		setAmountOut: (v) => {
			try {
				setAmountOut(parseEther(v));
				setAmountIn(0n);
			} catch (error) {
				console.error("Error parsing amount:", error);
				setAmountOut(0n);
			}
		},
	};
}
