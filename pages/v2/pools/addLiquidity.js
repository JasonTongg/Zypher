"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
	useWriteContract,
	useWaitForTransactionReceipt,
	useReadContract,
} from "wagmi";
import { parseEther, parseUnits, formatUnits, isAddress } from "viem";
import abi from "../../../hooks/abi/uniswapv2.json";
import erc20abi from "../../../hooks/abi/erc20.json";
import { useDispatch, useSelector } from "react-redux";
import { fetchPortfolio } from "../../../store/data";
import { useAccount, useBalance } from "wagmi";
import { setNavbarActive } from "../../../store/data";
import { fetchSearchToken, fetchSearchTokenB } from "../../../store/data";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { FaChevronDown } from "react-icons/fa";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 400,
	bgcolor: "background.paper",
	border: "2px solid #000",
	boxShadow: 24,
	p: 4,
};

const steps = [
	{
		label: "Step 1",
		description: `Select token pair and fees`,
	},
	{
		label: "Step 2",
		description: "Enter deposit amounts",
	},
];

const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";

export default function AddLiquidityUniversal() {
	const router = useRouter();
	const params = useSearchParams();
	const tokenAParam = params?.get("tokenA");
	const tokenASymbolParam = params?.get("tokenASymbol");
	const tokenBParam = params?.get("tokenB");
	const tokenBSymbolParam = params?.get("tokenBSymbol");
	const [tokenA, setTokenA] = useState(tokenAParam || "");
	const [tokenB, setTokenB] = useState(tokenBParam || "");
	const [tokenASymbol, setTokenASymbol] = useState(tokenASymbolParam || "");
	const [tokenBSymbol, setTokenBSymbol] = useState(tokenBSymbolParam || "");
	const [amountA, setAmountA] = useState("");
	const [amountB, setAmountB] = useState("");
	const [inputSource, setInputSource] = useState(null);
	const dispatch = useDispatch();
	const { portfolio, searchToken, searchTokenB } = useSelector(
		(state) => state.data
	);
	const { address } = useAccount();
	const balance = useBalance({ address });
	const [userPortfolio, setUserPortfolio] = useState([]);
	const [pendingApproval, setPendingApproval] = useState(null);
	const [search, setSearch] = useState("");
	const [searchResult, setSearchResult] = useState("");
	const [searchB, setSearchB] = useState("");
	const [searchResultB, setSearchResultB] = useState(null);

	const [open, setOpen] = useState(false);
	const handleOpen = () => setOpen(true);
	const handleClose = () => setOpen(false);

	const [open2, setOpen2] = useState(false);
	const handleOpen2 = () => setOpen2(true);
	const handleClose2 = () => setOpen2(false);

	const [activeStep, setActiveStep] = useState(0);

	const handleNext = () => {
		setActiveStep((prevActiveStep) => prevActiveStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevActiveStep) => prevActiveStep - 1);
	};

	const handleReset = () => {
		setActiveStep(0);
	};

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

	function fetchToken(searchAddress) {
		if (isAddress(searchAddress)) {
			dispatch(fetchSearchToken({ tokenAddress: searchAddress }));
		}
	}

	useEffect(() => {
		if (searchToken?.data?.tokens?.length > 0) {
			setSearchResult(searchToken.data.tokens[0]);
		} else {
			setSearchResult(null);
		}
	}, [searchToken]);

	useEffect(() => {
		if (!search) {
			setSearchResult(null);
			return;
		}

		const timeout = setTimeout(() => {
			if (isAddress(search)) {
				fetchToken(search);
			}
		}, 500);

		return () => clearTimeout(timeout);
	}, [search]);

	function fetchTokenB(searchAddress) {
		if (isAddress(searchAddress)) {
			dispatch(fetchSearchTokenB({ tokenAddress: searchAddress }));
		}
	}

	useEffect(() => {
		if (searchTokenB?.data?.tokens?.length > 0) {
			setSearchResultB(searchTokenB.data.tokens[0]);
		} else {
			setSearchResultB(null);
		}
	}, [searchTokenB]);

	useEffect(() => {
		if (!searchB) {
			setSearchResultB(null);
			return;
		}

		const timeout = setTimeout(() => {
			if (isAddress(searchB)) {
				fetchTokenB(searchB);
			}
		}, 500);

		return () => clearTimeout(timeout);
	}, [searchB]);

	useEffect(() => {
		if (tokenAParam) {
			setTokenA(tokenAParam);
		}
		if (tokenBParam) {
			setTokenB(tokenBParam);
		}
		if (tokenASymbolParam) {
			setTokenASymbol(tokenASymbolParam);
		}
		if (tokenBSymbolParam) {
			setTokenBSymbol(tokenBSymbolParam);
		}
	}, [tokenAParam, tokenBParam, tokenASymbolParam, tokenBSymbolParam]);

	const handleChange = (event, newValue) => {
		router.push(
			`/pools/addLiquidity${newValue}?tokenA=${tokenA}&tokenASymbol=${tokenASymbol}&tokenB=${tokenB}&tokenBSymbol=${tokenBSymbol}`
		);
	};

	return (
		<div
			className='p-10 max-w-2xl mx-auto space-y-6 mt-[4.5rem] flex flex-col items-center justify-center w-full'
			style={{ minHeight: "calc(100vh - 200px)" }}
		>
			<div className='flex items-center justify-between'>
				<h3 className='font-bold text-3xl'>New position</h3>
			</div>

			<div className='flex items-start justify-center gap-3'>
				<div className='border-[1px] border-gray-300 rounded-[10px] p-[1.2rem]'>
					<Box sx={{ minWidth: 230 }}>
						<Stepper activeStep={activeStep} orientation='vertical'>
							{steps.map((step, index) => (
								<Step key={step.label}>
									<StepLabel>{step.label}</StepLabel>
									<StepContent>
										<Typography>{step.description}</Typography>
									</StepContent>
								</Step>
							))}
						</Stepper>
					</Box>
				</div>
				{activeStep === 0 ? (
					<div className='flex flex-col gap-2 min-w-[500px] border-[1px] border-gray-300 rounded-[10px] p-[1.2rem]'>
						<h2 className='text-xl font-semibold'>Select Pair</h2>
						<p>
							Choose the tokens you want to provide liquidity for. You can
							select tokens on all supported networks.
						</p>
						<div className='grid grid-cols-2 [&>*]:w-full gap-2 mb-[1rem]'>
							<button
								onClick={() => {
									handleOpen();
									setSearch("");
								}}
								className='bg-[rgba(39,117,202,0.25)] text-[#2775CA] rounded-[5px] py-[1rem] px-[10px] flex justify-between items-center'
							>
								<p>{tokenASymbol || "Select Token"}</p>
								<FaChevronDown className='text-[1rem] font-semibold' />
							</button>

							<button
								onClick={() => {
									handleOpen2();
									setSearchB("");
								}}
								className='bg-[rgba(39,117,202,0.25)] text-[#2775CA] rounded-[5px] py-[1rem] px-[10px] flex justify-between items-center'
							>
								<p>{tokenBSymbol || "Select Token"}</p>
								<FaChevronDown className='text-[1rem] font-semibold' />
							</button>
						</div>
						<h2 className='text-xl font-semibold'>Fee tier</h2>
						<p className='mb-[1rem]'>
							The amount earned providing liquidity. All v2 pools have fixed
							0.3% fees. For more options, provide liquidity on v4.
						</p>
						<button
							className='bg-[rgba(39,117,202,0.25)] text-[#2775CA] rounded-[10px] p-[1rem] w-full font-semibold disabled:opacity-30'
							onClick={handleNext}
							disabled={!tokenA || !tokenB}
						>
							Continue
						</button>

						<Modal open={open} onClose={handleClose}>
							<Box sx={style}>
								<div className='flex flex-col gap-2'>
									<input
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										placeholder='Search token address...'
										className='w-full border p-2 rounded'
									/>

									<div className='border rounded max-h-40 overflow-auto bg-[#ffffe3]'>
										{/* CASE 1: search result exists */}
										{searchResult ? (
											<div
												className='p-2 cursor-pointer hover:bg-gray-100'
												onClick={() => {
													setTokenA(searchResult.address);
													setTokenASymbol(searchResult.symbol);

													if (tokenB === searchResult?.address) {
														setTokenB("");
														setTokenBSymbol("");
													}

													handleClose();
												}}
											>
												{searchResult.symbol} —{" "}
												{searchResult.address.slice(0, 6)}
												...
												{searchResult.address.slice(-4)}
											</div>
										) : (
											/* CASE 2: show user portfolio */
											userPortfolio
												?.filter((item) => item.token.address !== tokenB)
												?.map((item) => (
													<div
														key={item.token.address}
														className='p-2 cursor-pointer hover:bg-gray-100'
														onClick={() => {
															setTokenA(item.token.address);
															setTokenASymbol(item.token.symbol);

															if (tokenB === searchResult?.address) {
																setTokenB("");
																setTokenBSymbol("");
															}

															handleClose();
														}}
													>
														{item.token.symbol} —{" "}
														{item.token.address.slice(0, 6)}
														...
														{item.token.address.slice(-4)}
													</div>
												))
										)}
									</div>
								</div>
							</Box>
						</Modal>

						<Modal open={open2} onClose={handleClose2}>
							<Box sx={style}>
								<div className='flex flex-col gap-2'>
									<input
										value={searchB}
										onChange={(e) => setSearchB(e.target.value)}
										placeholder='Search token address...'
										className='w-full border p-2 rounded'
									/>

									<div className='border rounded max-h-40 overflow-auto bg-[#ffffe3]'>
										{/* CASE 1: search result exists */}
										{searchResultB ? (
											<div
												className='p-2 cursor-pointer hover:bg-gray-100'
												onClick={() => {
													setTokenB(searchResultB.address);
													setTokenBSymbol(searchResultB.symbol);

													if (tokenA === searchResultB?.address) {
														setTokenA("");
														setTokenASymbol("");
													}

													handleClose2();
												}}
											>
												{searchResultB.symbol} —{" "}
												{searchResultB.address.slice(0, 6)}
												...
												{searchResultB.address.slice(-4)}
											</div>
										) : (
											/* CASE 2: show user portfolio */
											userPortfolio
												?.filter((item) => item.token.address !== tokenA)
												?.map((item) => (
													<div
														key={item.token.address}
														className='p-2 cursor-pointer hover:bg-gray-100'
														onClick={() => {
															setTokenB(item.token.address);
															setTokenBSymbol(item.token.symbol);

															if (tokenA === searchResultB?.address) {
																setTokenA("");
																setTokenASymbol("");
															}

															handleClose2();
														}}
													>
														{item.token.symbol} —{" "}
														{item.token.address.slice(0, 6)}
														...
														{item.token.address.slice(-4)}
													</div>
												))
										)}
									</div>
								</div>
							</Box>
						</Modal>
					</div>
				) : (
					<div className='flex flex-col gap-2 min-w-[500px] border-[1px] border-gray-300 rounded-[10px] p-[1.2rem]'>
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
								parseUnits(
									convertToPlainString(amountA) || "0",
									tokenADecimals
								)) &&
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
							<p className='text-red-500 text-sm'>
								❌ {isApproveFailed?.message}
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
