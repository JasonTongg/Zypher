"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
	useWriteContract,
	useWaitForTransactionReceipt,
	useReadContract,
} from "wagmi";
import { parseEther, parseUnits, formatUnits } from "viem";
import abi from "../../../hooks/abi/uniswapv2.json";
import erc20abi from "../../../hooks/abi/erc20.json";
import { useDispatch, useSelector } from "react-redux";
import { fetchPortfolio } from "../../../store/data";
import { useAccount, useBalance } from "wagmi";
import { setNavbarActive } from "../../../store/data";

const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";

export default function AddLiquidityUniversal() {
	const [tokenA, setTokenA] = useState("");
	const [tokenB, setTokenB] = useState("");
	const [amountA, setAmountA] = useState("");
	const [amountB, setAmountB] = useState("");
	const [inputSource, setInputSource] = useState(null);
	const dispatch = useDispatch();
	const { portfolio } = useSelector((state) => state.data);
	const { address } = useAccount();
	const balance = useBalance({ address });
	const [userPortfolio, setUserPortfolio] = useState([]);
	const [pendingApproval, setPendingApproval] = useState(null);

	function convertToPlainString(value) {
		if (value === null || value === undefined) return "0";

		let str = String(value);

		// If already a decimal string without scientific notation, return it
		if (!str.toLowerCase().includes("e")) return str;

		// Convert scientific notation string to plain string
		const num = Number(str);
		return num.toLocaleString("fullwide", { useGrouping: false });
	}

	const tokenADecimals = useMemo(() => {
		if (tokenA === ETH_ADDRESS) return 18;
		const token = userPortfolio?.find((item) => item.token.address === tokenA);
		return token?.token.decimals || 18;
	}, [tokenA, userPortfolio]);

	const tokenBDecimals = useMemo(() => {
		if (tokenB === ETH_ADDRESS) return 18;
		const token = userPortfolio?.find((item) => item.token.address === tokenB);
		return token?.token.decimals || 18;
	}, [tokenB, userPortfolio]);

	// Fetch user portfolio
	useEffect(() => {
		if (address) dispatch(fetchPortfolio({ address }));
	}, [address]);

	useEffect(() => {
		if (portfolio) {
			const filtered =
				portfolio?.data?.portfolio?.balances?.filter(
					(item) => item.token.metadata?.spamCode === "SPAM_CODE_NOT_SPAM"
				) || [];
			setUserPortfolio(filtered);
		}
	}, [portfolio]);

	const { data: hash, writeContract } = useWriteContract();
	const { isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt(
		{ hash }
	);

	const isETH = (token) => token === ETH_ADDRESS;

	// --- Auto Calculate Ratio using readContract ---
	const {
		data: ratioAmount,
		isError: isPairError,
		error: pairError,
	} = useReadContract({
		address: process.env.NEXT_PUBLIC_SWAP_CONTRACT,
		abi,
		functionName: "getPairRatioAmount",
		args:
			inputSource === "A"
				? [
						tokenA === ETH_ADDRESS
							? "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"
							: tokenA,
						tokenB === ETH_ADDRESS
							? "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"
							: tokenB,
						parseUnits(convertToPlainString(amountA), tokenADecimals),
						tokenA === ETH_ADDRESS
							? "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"
							: tokenA,
				  ]
				: inputSource === "B"
				? [
						tokenA === ETH_ADDRESS
							? "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"
							: tokenA,
						tokenB === ETH_ADDRESS
							? "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"
							: tokenB,
						parseUnits(convertToPlainString(amountB), tokenBDecimals),
						tokenB === ETH_ADDRESS
							? "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"
							: tokenB,
				  ]
				: undefined,
		query: {
			enabled: !!tokenA && !!tokenB && !!(amountA || amountB) && !!inputSource,
		},
		watch: true,
	});

	// Update opposite field when ratioAmount changes
	useEffect(() => {
		console.log("Calling ratio");
		console.log(ratioAmount);
		console.log(pairError);
		console.log(isPairError);
		if (!ratioAmount) return;
		const ratio = ratioAmount.toString();
		if (inputSource === "A") {
			setAmountB(formatUnits(ratioAmount, tokenBDecimals));
		} else if (inputSource === "B") {
			setAmountA(formatUnits(ratioAmount, tokenADecimals));
		}
	}, [ratioAmount, amountA, amountB]);

	const submit = () => {
		console.log("Submitting");
		const ethIsA = isETH(tokenA);
		const ethIsB = isETH(tokenB);
		console.log(ethIsA, ethIsB);

		if (!amountA || !amountB) {
			alert("Please input both amounts!");
			return;
		}
		if (ethIsA && ethIsB) {
			alert("❌ You can only select 1 ETH at maximum.");
			return;
		}

		console.log("Selecting...");
		if (!ethIsA && !ethIsB) {
			console.log("Executing Add Liquidity");
			console.log(amountA);
			console.log(parseUnits(convertToPlainString(amountA), tokenADecimals));
			writeContract({
				address: process.env.NEXT_PUBLIC_SWAP_CONTRACT,
				abi,
				functionName: "addLiquidity",
				args: [
					tokenA,
					tokenB,
					parseUnits(convertToPlainString(amountA), tokenADecimals),
					parseUnits(convertToPlainString(amountB), tokenBDecimals),
				],
			});
		}
		if ((ethIsA && !ethIsB) || (ethIsB && !ethIsA)) {
			console.log("Executing Add Liquidity ETH");
			const token = ethIsA ? tokenB : tokenA; // ERC20 token
			const tokenAmount = ethIsA ? amountB : amountA; // Token amount
			const ethAmount = ethIsA ? amountA : amountB; // ETH amount
			const tokenDecimals = ethIsA ? tokenBDecimals : tokenADecimals;
			console.log(tokenAmount);
			console.log(parseUnits(convertToPlainString(tokenAmount), tokenDecimals));
			console.log(parseUnits(tokenAmount, tokenDecimals));
			console.log(parseUnits(tokenAmount.toString(), tokenDecimals));
			console.log(Number(tokenAmount) * 10 ** tokenDecimals);
			console.log(tokenDecimals);
			console.log(tokenADecimals);
			console.log(tokenA);

			writeContract({
				address: process.env.NEXT_PUBLIC_SWAP_CONTRACT,
				abi,
				functionName: "addLiquidityETH",
				args: [
					token,
					parseUnits(convertToPlainString(tokenAmount), tokenDecimals),
				],
				value: parseEther(ethAmount),
			});

			console.log("CALLING FN", {
				token,
				tokenAmount,
				ethAmount,
				tokenDecimals,
				ethIsA,
				ethIsB,
			});
		}
	};

	const { data: balanceA } = isETH(tokenA)
		? useBalance({ address })
		: useReadContract({
				address: tokenA,
				abi: erc20abi,
				functionName: "balanceOf",
				args: [address],
				query: { enabled: !!tokenA && !!address },
				watch: true,
		  });

	const { data: balanceB } = isETH(tokenB)
		? useBalance({ address })
		: useReadContract({
				address: tokenB,
				abi: erc20abi,
				functionName: "balanceOf",
				args: [address],
				query: { enabled: !!tokenB && !!address },
				watch: true,
		  });

	const formatBalance = (bal, decimals) => {
		if (!bal) return "0";
		return (Number(bal) / 10 ** decimals).toFixed(decimals);
	};

	const { data: allowanceA, refetch: refetchAllowanceA } = useReadContract({
		address: tokenA,
		abi: erc20abi,
		functionName: "allowance",
		args: [address, process.env.NEXT_PUBLIC_SWAP_CONTRACT],
		query: {
			enabled: !!tokenA && !!address && !isETH(tokenA),
			refetchInterval: 1000,
		},
	});

	const { data: allowanceB, refetch: refetchAllowanceB } = useReadContract({
		address: tokenB,
		abi: erc20abi,
		functionName: "allowance",
		args: [address, process.env.NEXT_PUBLIC_SWAP_CONTRACT],
		query: {
			enabled: !!tokenB && !!address && !isETH(tokenB),
			refetchInterval: 1000,
		},
	});

	const {
		data: receipt,
		isSuccess: isApproveSuccess,
		isError: isApproveFailed,
	} = useWaitForTransactionReceipt({
		hash,
	});

	useEffect(() => {
		console.log("refetching allowance");
		if (pendingApproval === "A") {
			refetchAllowanceA();
		} else if (pendingApproval === "B") {
			refetchAllowanceB();
		}
		setPendingApproval(null);
	}, [isApproveSuccess]);

	useEffect(() => {
		dispatch(setNavbarActive("liquidity"));
	}, []);

	const handleApproveA = () => {
		if (tokenA === ETH_ADDRESS) return;

		setPendingApproval("A");
		writeContract({
			address: tokenA,
			abi: erc20abi,
			functionName: "approve",
			args: [
				process.env.NEXT_PUBLIC_SWAP_CONTRACT,
				parseUnits(convertToPlainString(amountA), tokenADecimals),
			],
		});
	};

	const handleApproveB = () => {
		if (tokenB === ETH_ADDRESS) return;

		setPendingApproval("B");
		writeContract({
			address: tokenB,
			abi: erc20abi,
			functionName: "approve",
			args: [
				process.env.NEXT_PUBLIC_SWAP_CONTRACT,
				parseUnits(convertToPlainString(amountB), tokenBDecimals),
			],
		});
	};

	const getTokenName = (address) => {
		const token = userPortfolio?.find((item) => item.token.address === address);
		return token?.token.symbol || "ETH";
	};

	useEffect(() => {
		console.log("Check Allowance");
		console.log(
			!isETH(tokenA) &&
				allowanceA !== undefined &&
				amountA &&
				BigInt(allowanceA || "0") <
					parseUnits(convertToPlainString(amountA), tokenADecimals)
		);

		console.log(!isETH(tokenA));
		console.log(allowanceA !== undefined);
		console.log(amountA);
		console.log(
			BigInt(allowanceA || "0") <
				parseUnits(convertToPlainString(amountA), tokenADecimals)
		);
		console.log(allowanceA);
	}, [amountA, allowanceA, tokenADecimals, tokenA]);

	return (
		<div
			className='p-10 max-w-2xl mx-auto space-y-6 mt-[4.5rem] flex flex-col items-center justify-center w-full'
			style={{ minHeight: "calc(100vh - 200px)" }}
		>
			<h3 className='font-bold'>Add Liquidity</h3>

			{/* Token A */}
			<select
				value={tokenA}
				onChange={(e) => setTokenA(e.target.value)}
				className='w-full border p-2 rounded'
			>
				<option value=''>Select token</option>
				{userPortfolio
					?.filter((item) => item.token.address !== tokenB)
					?.map((item) => (
						<option key={item.token.address} value={item.token.address}>
							{item.token.symbol}
						</option>
					))}
			</select>
			<div className='text-sm text-gray-500'>
				Balance:{" "}
				{isETH(tokenA)
					? balanceA?.formatted
					: formatBalance(balanceA, tokenADecimals)}
			</div>
			<input
				placeholder='Amount A'
				value={amountA}
				type='number'
				onChange={(e) => {
					setAmountA(e.target.value);
					setInputSource("A");
				}}
				className='w-full border p-2 rounded'
			/>

			{/* Token B */}
			<select
				value={tokenB}
				onChange={(e) => setTokenB(e.target.value)}
				className='w-full border p-2 rounded'
			>
				<option value=''>Select token</option>
				{userPortfolio
					?.filter((item) => item.token.address !== tokenA)
					?.map((item) => (
						<option key={item.token.address} value={item.token.address}>
							{item.token.symbol}
						</option>
					))}
			</select>
			<div className='text-sm text-gray-500'>
				Balance:{" "}
				{isETH(tokenB)
					? balanceB?.formatted
					: formatBalance(balanceB, tokenBDecimals)}
			</div>
			<input
				placeholder='Amount B'
				value={amountB}
				onChange={(e) => {
					setAmountB(e.target.value);
					setInputSource("B");
				}}
				type='number'
				className='w-full border p-2 rounded'
			/>

			{/* APPROVE FOR TOKEN A */}
			{!isETH(tokenA) &&
				allowanceA !== undefined &&
				amountA &&
				BigInt(allowanceA.toString() || "0") <
					parseUnits(convertToPlainString(amountA), tokenADecimals) && (
					<button
						onClick={handleApproveA}
						className='mt-3 px-4 py-2 bg-yellow-500 text-white rounded w-full'
					>
						{pendingApproval === "A"
							? "Approving..."
							: `Approve ${getTokenName(tokenA)}`}
					</button>
				)}

			{/* APPROVE FOR TOKEN B */}
			{!isETH(tokenB) &&
				allowanceB !== undefined &&
				amountB &&
				BigInt(allowanceB.toString() || "0") <
					parseUnits(convertToPlainString(amountB), tokenBDecimals) && (
					<button
						onClick={handleApproveB}
						className='mt-3 px-4 py-2 bg-yellow-500 text-white rounded w-full'
					>
						{pendingApproval === "B"
							? "Approving..."
							: `Approve ${getTokenName(tokenB)}`}
					</button>
				)}

			{/* MAIN ADD LIQUIDITY BUTTON — ONLY SHOW WHEN BOTH APPROVED */}
			{(isETH(tokenA) ||
				allowanceA >=
					parseUnits(convertToPlainString(amountA) || "0", tokenADecimals)) &&
				(isETH(tokenB) ||
					allowanceB >=
						parseUnits(
							convertToPlainString(amountB) || "0",
							tokenBDecimals
						)) && (
					<button
						onClick={submit}
						className='mt-3 px-4 py-2 bg-blue-500 text-white rounded w-full'
					>
						Add Liquidity
					</button>
				)}

			{isLoading && <p>⏳ Waiting for transaction...</p>}
			{isSuccess && <p>✅ Successfully added liquidity!</p>}
			{isError && <p className='text-red-600'>❌ {error?.message}</p>}
			{isApproveSuccess && (
				<p className='text-green-500 text-sm'>
					✅ {getTokenName(tokenA)} Approved!
				</p>
			)}

			{isApproveFailed && (
				<p className='text-red-500 text-sm'>❌ {isApproveFailed?.message}</p>
			)}
		</div>
	);
}
