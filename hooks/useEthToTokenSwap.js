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

export function useETHToTokenSwap({
	swapContract,
	tokenOut,
	tokenOutDecimals,
}) {
	const [amountIn, setAmountIn] = useState(0n);
	const { address: user } = useAccount();

	// Expected token output for ETH input
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

	// SWAP ETH FOR TOKEN
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
