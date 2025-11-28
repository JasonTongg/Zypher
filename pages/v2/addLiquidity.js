"use client";

import { useState, useEffect, useMemo } from "react";
import {
	useWriteContract,
	useWaitForTransactionReceipt,
	useReadContract,
} from "wagmi";
import { parseEther, parseUnits, formatUnits } from "viem";
import abi from "../../hooks/abi/uniswapv2.json";
import erc20abi from "../../hooks/abi/erc20.json";
import { useDispatch, useSelector } from "react-redux";
import { fetchPortfolio } from "../../store/data";
import { useAccount, useBalance } from "wagmi";
import { setNavbarActive } from "../../store/data";
import { fetchSearchToken, fetchSearchTokenB } from "../../store/data";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import Typography from "@mui/material/Typography";
import { FaChevronDown } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import { GiTwoCoins } from "react-icons/gi";
import Image from "next/image";
import { FaRegEdit } from "react-icons/fa";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { useTheme } from "@mui/material/styles";
import MobileStepper from "@mui/material/MobileStepper";
import Button from "@mui/material/Button";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import { toast } from "react-toastify";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 400,
	bgcolor: "#FFFFE3",
	borderRadius: "10px",
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
	const theme = useTheme();
	const [universion, setUniversion] = useState("v2");

	const handleChange2 = (event) => {
		setUniversion(event.target.value);
		handleChange(event, event.target.value);
	};
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
	const { portfolio, searchToken, searchTokenB, version } = useSelector(
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

	function resolveIPFS(url) {
		if (!url) return "";
		if (url.startsWith("ipfs://")) {
			return `https://ipfs.io/ipfs/${url.replace("ipfs://", "")}`;
		}
		return url;
	}

	function convertToPlainString(value) {
		if (value === null || value === undefined) return "0";

		let str = String(value);

		if (!str.toLowerCase().includes("e")) return str;

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

	const { data: hash, writeContractAsync } = useWriteContract();
	const { isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt(
		{ hash }
	);

	const isETH = (token) => token === ETH_ADDRESS;

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

	useEffect(() => {
		if (!ratioAmount) return;
		const ratio = ratioAmount.toString();
		if (inputSource === "A") {
			setAmountB(formatUnits(ratioAmount, tokenBDecimals));
		} else if (inputSource === "B") {
			setAmountA(formatUnits(ratioAmount, tokenADecimals));
		}
	}, [ratioAmount, amountA, amountB]);

	const [addLiquidityStatus, setAddLiquidityStatus] = useState("Add Liquidity");

	const submit = async () => {
		const ethIsA = isETH(tokenA);
		const ethIsB = isETH(tokenB);

		if (!amountA || !amountB) {
			toast.error("Please input both amounts!");
			return;
		}
		if (ethIsA && ethIsB) {
			toast.error("You can only select 1 ETH at maximum.");
			return;
		}

		if (!ethIsA && !ethIsB) {
			toast.info(
				`Adding liquidity with ${getTokenName(tokenA)} and ${getTokenName(
					tokenB
				)}...`
			);
			setAddLiquidityStatus("Adding Liquidity...");
			try {
				await writeContractAsync({
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
				toast.success(
					"Add Liquidity Transaction Sent!, waiting for confirmation..."
				);
			} catch (e) {
				toast.error("Failed to add liquidity.");
				setAddLiquidityStatus("Add Liquidity");
			}
		}
		if ((ethIsA && !ethIsB) || (ethIsB && !ethIsA)) {
			toast.info(
				`Adding liquidity with ${getTokenName(tokenA)} and ${getTokenName(
					tokenB
				)}...`
			);
			setAddLiquidityStatus("Adding Liquidity...");
			const token = ethIsA ? tokenB : tokenA;
			const tokenAmount = ethIsA ? amountB : amountA;
			const ethAmount = ethIsA ? amountA : amountB;
			const tokenDecimals = ethIsA ? tokenBDecimals : tokenADecimals;

			try {
				await writeContractAsync({
					address: process.env.NEXT_PUBLIC_SWAP_CONTRACT,
					abi,
					functionName: "addLiquidityETH",
					args: [
						token,
						parseUnits(convertToPlainString(tokenAmount), tokenDecimals),
					],
					value: parseEther(ethAmount),
				});
				toast.success(
					"Add Liquidity Transaction Sent!, waiting for confirmation..."
				);
			} catch (e) {
				toast.error("Failed to add liquidity.");
				setAddLiquidityStatus("Add Liquidity");
			}
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
		return (Number(bal) / 10 ** decimals).toFixed(2);
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

	const { data: hash2, writeContractAsync: writeContractAsyncApprove } =
		useWriteContract();

	const {
		data: receipt,
		isSuccess: isApproveSuccess,
		isError: isApproveFailed,
	} = useWaitForTransactionReceipt({
		hash: hash2,
	});

	useEffect(() => {
		if (isApproveSuccess) {
			toast.success("Token approved successfully!");

			refetchAllowanceA();
			refetchAllowanceB();

			setPendingApproval(null);
		}
	}, [isApproveSuccess, hash2]);

	useEffect(() => {
		if (isSuccess) {
			toast.success("Add Liquidity successfully!");
			setAddLiquidityStatus("Add Liquidity");
			handleReset();
			setAmountA("");
			setAmountB("");
			setTokenA("");
			setTokenB("");
			setTokenASymbol("");
			setTokenBSymbol("");
		}
	}, [isSuccess, hash]);

	useEffect(() => {
		dispatch(setNavbarActive("liquidity"));
	}, []);

	const handleApproveA = async () => {
		if (tokenA === ETH_ADDRESS) return;

		try {
			setPendingApproval("A");
			toast.info(`Approving ${getTokenName(tokenA)}...`);
			await writeContractAsyncApprove({
				address: tokenA,
				abi: erc20abi,
				functionName: "approve",
				args: [
					process.env.NEXT_PUBLIC_SWAP_CONTRACT,
					parseUnits(convertToPlainString(amountA), tokenADecimals),
				],
			});
			toast.success(
				"Token approval Transaction Sent!, waiting for confirmation..."
			);
		} catch (e) {
			toast.error("Failed to approve token.");
			setPendingApproval(null);
		}
	};

	const handleApproveB = async () => {
		if (tokenB === ETH_ADDRESS) return;

		try {
			setPendingApproval("B");
			toast.info(`Approving ${getTokenName(tokenB)}...`);
			await writeContractAsyncApprove({
				address: tokenB,
				abi: erc20abi,
				functionName: "approve",
				args: [
					process.env.NEXT_PUBLIC_SWAP_CONTRACT,
					parseUnits(convertToPlainString(amountB), tokenBDecimals),
				],
			});
			toast.success(
				"Token approval Transaction Sent!, waiting for confirmation..."
			);
		} catch (e) {
			toast.error("Failed to approve token.");
			setPendingApproval(null);
		}
	};

	const getTokenName = (address) => {
		const token = userPortfolio?.find((item) => item.token.address === address);
		return token?.token.symbol || "ETH";
	};

	function fetchToken(searchAddress) {
		dispatch(fetchSearchToken({ tokenAddress: searchAddress }));
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
			fetchToken(search);
		}, 500);

		return () => clearTimeout(timeout);
	}, [search]);

	function fetchTokenB(searchAddress) {
		dispatch(fetchSearchTokenB({ tokenAddress: searchAddress }));
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
			fetchTokenB(searchB);
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
			`/${newValue}/addLiquidity?tokenA=${tokenA}&tokenASymbol=${tokenASymbol}&tokenB=${tokenB}&tokenBSymbol=${tokenBSymbol}`
		);
	};

	const needsApprovalA =
		!isETH(tokenA) &&
		allowanceA !== undefined &&
		amountA &&
		BigInt(allowanceA.toString()) <
			parseUnits(convertToPlainString(amountA), tokenADecimals);

	const needsApprovalB =
		!isETH(tokenB) &&
		allowanceB !== undefined &&
		amountB &&
		BigInt(allowanceB.toString()) <
			parseUnits(convertToPlainString(amountB), tokenBDecimals);

	const getButtonLabel = () => {
		if (pendingApproval === "A") return `Approving ${getTokenName(tokenA)}...`;
		if (pendingApproval === "B") return `Approving ${getTokenName(tokenB)}...`;

		if (needsApprovalA) return `Approve ${getTokenName(tokenA)}`;
		if (needsApprovalB) return `Approve ${getTokenName(tokenB)}`;

		return addLiquidityStatus;
	};

	const handleClick = async () => {
		if (needsApprovalA) return handleApproveA();
		if (needsApprovalB) return handleApproveB();
		return submit();
	};

	return (
		<div
			className='p-5 sm:p-10 max-w-2xl mx-auto space-y-6 mt-[4.5rem] flex flex-col items-center justify-center min-w-fit'
			style={{ minHeight: "calc(100vh - 200px)" }}
		>
			<div className='flex items-center justify-between w-full'>
				<h3 className='font-bold text-lg sm:text-3xl'>New position</h3>
				<FormControl sx={{ m: 1, minWidth: 120 }} size='small'>
					<InputLabel id='demo-select-small-label'>Version</InputLabel>
					<Select
						labelId='demo-select-small-label'
						id='demo-select-small'
						value={universion}
						label='Version'
						onChange={handleChange2}
					>
						<MenuItem value='v2'>Uniswap V2</MenuItem>
						<MenuItem value='v3'>Uniswap V3</MenuItem>
						<MenuItem value='v4'>Uniswap V4</MenuItem>
					</Select>
				</FormControl>
			</div>

			<div className='flex items-start justify-center gap-3 max-w-[800px] lg:flex-row flex-col w-full'>
				<div className='border-[1px] border-gray-300 rounded-[10px] p-[1.2rem] lg:block hidden'>
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
				<div className='border-[1px] border-gray-300 rounded-[10px] lg:hidden block w-full'>
					<MobileStepper
						variant='progress'
						steps={2}
						position='static'
						activeStep={activeStep}
						sx={{ flexGrow: 1, background: "transparent" }}
						nextButton={
							<Button
								size='small'
								onClick={handleNext}
								disabled={activeStep === 1 || !tokenA || !tokenB}
							>
								Next
								{theme.direction === "rtl" ? (
									<KeyboardArrowLeft />
								) : (
									<KeyboardArrowRight />
								)}
							</Button>
						}
						backButton={
							<Button
								size='small'
								onClick={handleBack}
								disabled={activeStep === 0}
							>
								{theme.direction === "rtl" ? (
									<KeyboardArrowRight />
								) : (
									<KeyboardArrowLeft />
								)}
								Back
							</Button>
						}
					/>
				</div>
				{activeStep === 0 ? (
					<div className='flex flex-col gap-2 min-w-full sm:min-w-[500px] border-[1px] border-gray-300 rounded-[10px] p-[1.2rem] w-full'>
						<h2 className='text-xl font-semibold'>Select Pair</h2>
						<p className='w-full max-w-[500px]'>
							Choose the tokens you want to provide liquidity for. You can
							select tokens on all supported networks.
						</p>
						<div className='grid grid-cols-2 [&>*]:w-full gap-2 mb-[1rem]'>
							<button
								onClick={() => {
									handleOpen();
									setSearch("");
								}}
								className='bg-[rgba(0,0,0,0.05)] rounded-[5px] py-[1rem] px-[10px] flex justify-between items-center cursor-pointer'
							>
								<p>{tokenASymbol || "Select Token"}</p>
								<FaChevronDown className='text-[1rem] font-semibold' />
							</button>

							<button
								onClick={() => {
									handleOpen2();
									setSearchB("");
								}}
								className='bg-[rgba(0,0,0,0.05)] rounded-[5px] py-[1rem] px-[10px] flex justify-between items-center cursor-pointer'
							>
								<p>{tokenBSymbol || "Select Token"}</p>
								<FaChevronDown className='text-[1rem] font-semibold' />
							</button>
						</div>
						<h2 className='text-xl font-semibold'>Fee tier</h2>
						<p className='mb-[1rem] w-full max-w-[500px]'>
							The amount earned providing liquidity. All v2 pools have fixed
							0.3% fees. For more options, provide liquidity on v4.
						</p>
						<button
							className='blue-button rounded-[10px] p-[1rem] w-full font-semibold disabled:opacity-30 cursor-pointer'
							onClick={handleNext}
							disabled={!tokenA || !tokenB}
						>
							Continue
						</button>

						<Modal open={open} onClose={handleClose}>
							<Box sx={style}>
								<div className='flex flex-col gap-2 p-4'>
									<div className='flex justify-between items-center'>
										<h2 className='text-lg font-semibold'>Select a token</h2>
										<IoClose
											className='text-2xl cursor-pointer'
											onClick={handleClose}
										/>
									</div>
									<div className='flex items-center justify-start gap-1 bg-[rgba(39,117,202,0.1)] rounded-[100px] px-4'>
										<IoSearch className='text-2xl text-gray-500'></IoSearch>
										<input
											value={search}
											onChange={(e) => setSearch(e.target.value)}
											placeholder='Search token address...'
											className='w-full p-2 outline-none bg-transparent'
										/>
									</div>

									<div className='rounded max-h-[500px] overflow-auto bg-[#ffffe3] remove-scrollbar'>
										{searchResult ? (
											<div>
												<div className='flex items-center justify-start gap-1'>
													<IoSearch />
													<p>Search results</p>
												</div>
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
													<div className='flex gap-2 items-center justify-start'>
														<div className='w-10 h-10 rounded-[100px] flex items-center justify-center bg-gray-200 overflow-hidden font-bold text-2xl'>
															{searchResult?.symbol.slice(0, 1).toUpperCase()}
														</div>
														<div className='flex flex-col'>
															<p className='text-base font-semibold'>
																{searchResult?.name}
															</p>
															<div className='flex items-center gap-1'>
																<p className='text-base'>
																	{searchResult?.symbol}
																</p>
																<p className='text-sm text-gray-600'>
																	{searchResult?.address?.slice(0, 6)}
																	...
																	{searchResult?.address?.slice(-4)}
																</p>
															</div>
														</div>
													</div>
												</div>
											</div>
										) : (
											<div className='flex flex-col gap-1 overflow-auto'>
												<div className='flex items-center justify-start gap-1'>
													<GiTwoCoins />
													<p>Your tokens</p>
												</div>
												{userPortfolio
													?.filter((item) => item.token.address !== tokenB)
													?.map((item) => (
														<div
															key={item?.token?.address}
															className='cursor-pointer hover:bg-gray-100 flex items-center justify-between'
															onClick={() => {
																setTokenA(item?.token?.address);
																setTokenASymbol(item?.token?.symbol);
																if (tokenB === searchResult?.address) {
																	setTokenB("");
																	setTokenBSymbol("");
																}

																handleClose();
															}}
														>
															<div className='flex gap-2 items-center justify-start'>
																<Image
																	src={resolveIPFS(
																		item?.token?.metadata?.logoUrl
																	)}
																	alt={item?.token?.symbol}
																	width={35}
																	height={35}
																/>
																<div className='flex flex-col'>
																	<p className='text-base font-semibold'>
																		{item?.token?.name}
																	</p>
																	<div className='flex items-center gap-1'>
																		<p className='text-base'>
																			{item?.token?.symbol}
																		</p>
																		<p className='text-sm text-gray-600'>
																			{item?.token?.address?.slice(0, 6)}
																			...
																			{item?.token?.address?.slice(-4)}
																		</p>
																	</div>
																</div>
															</div>
															<p className='text-base font-semibold'>
																{item?.amount?.amount?.toFixed(4)}
															</p>
														</div>
													))}
											</div>
										)}
									</div>
								</div>
							</Box>
						</Modal>
						<Modal open={open2} onClose={handleClose2}>
							<Box sx={style}>
								<div className='flex flex-col gap-2 p-4'>
									<div className='flex justify-between items-center'>
										<h2 className='text-lg font-semibold'>Select a token</h2>
										<IoClose
											className='text-2xl cursor-pointer'
											onClick={handleClose2}
										/>
									</div>
									<div className='flex items-center justify-start gap-1 bg-[rgba(39,117,202,0.1)] rounded-[100px] px-4'>
										<IoSearch className='text-2xl text-gray-500'></IoSearch>
										<input
											value={searchB}
											onChange={(e) => setSearchB(e.target.value)}
											placeholder='Search token address...'
											className='w-full p-2 outline-none bg-transparent'
										/>
									</div>

									<div className='rounded max-h-[500px] overflow-auto bg-[#ffffe3] remove-scrollbar'>
										{searchResultB ? (
											<div>
												<div className='flex items-center justify-start gap-1'>
													<IoSearch />
													<p>Search results</p>
												</div>
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
													<div className='flex gap-2 items-center justify-start'>
														<div className='w-10 h-10 rounded-[100px] flex items-center justify-center bg-gray-200 overflow-hidden font-bold text-2xl'>
															{searchResultB?.symbol.slice(0, 1).toUpperCase()}
														</div>
														<div className='flex flex-col'>
															<p className='text-base font-semibold'>
																{searchResultB?.name}
															</p>
															<div className='flex items-center gap-1'>
																<p className='text-base'>
																	{searchResultB?.symbol}
																</p>
																<p className='text-sm text-gray-600'>
																	{searchResultB?.address?.slice(0, 6)}
																	...
																	{searchResultB?.address?.slice(-4)}
																</p>
															</div>
														</div>
													</div>
												</div>
											</div>
										) : (
											<div className='flex flex-col gap-1 overflow-auto'>
												<div className='flex items-center justify-start gap-1'>
													<GiTwoCoins />
													<p>Your tokens</p>
												</div>
												{userPortfolio
													?.filter((item) => item.token.address !== tokenA)
													?.map((item) => (
														<div
															key={item?.token?.address}
															className='cursor-pointer hover:bg-gray-100 flex items-center justify-between'
															onClick={() => {
																setTokenB(item?.token?.address);
																setTokenBSymbol(item?.token?.symbol);
																if (tokenA === searchResultB?.address) {
																	setTokenA("");
																	setTokenASymbol("");
																}

																handleClose2();
															}}
														>
															<div className='flex gap-2 items-center justify-start'>
																<Image
																	src={resolveIPFS(
																		item?.token?.metadata?.logoUrl
																	)}
																	alt={item?.token?.symbol}
																	width={35}
																	height={35}
																/>
																<div className='flex flex-col'>
																	<p className='text-base font-semibold'>
																		{item?.token?.name}
																	</p>
																	<div className='flex items-center gap-1'>
																		<p className='text-base'>
																			{item?.token?.symbol}
																		</p>
																		<p className='text-sm text-gray-600'>
																			{item?.token?.address?.slice(0, 6)}
																			...
																			{item?.token?.address?.slice(-4)}
																		</p>
																	</div>
																</div>
															</div>
															<p className='text-base font-semibold'>
																{item?.amount?.amount?.toFixed(4)}
															</p>
														</div>
													))}
											</div>
										)}
									</div>
								</div>
							</Box>
						</Modal>
					</div>
				) : (
					<div className='flex flex-col gap-2 min-w-[500px] border-[1px] border-gray-300 rounded-[10px] p-[1.2rem] w-full'>
						<div className='flex items-center justify-between gap-4'>
							<div className='flex items-center justify-start gap-2'>
								<h2 className='text-xl font-semibold'>
									{tokenASymbol} / {tokenBSymbol}
								</h2>
								<h2 className='text-sm blue-button py-1 px-2 rounded-[5px]'>
									{version}
								</h2>
							</div>
							<button
								onClick={handleBack}
								className='cursor-pointer flex items-center justify-center gap-1 font-semibold py-2 px-3 rounded-[10px] blue-button'
							>
								<FaRegEdit className='text-xl' />
								<p>Edit</p>
							</button>
						</div>
						<div>
							<h2>Deposit tokens</h2>
							<p>Specify the token amounts for your liquidity contribution.</p>
						</div>
						<div className='flex items-center justify-between bg-[#fffad5] py-2 px-4 rounded-[10px]'>
							<input
								placeholder='0'
								value={amountA}
								type='number'
								onChange={(e) => {
									setAmountA(e.target.value);
									setInputSource("A");
								}}
								className='w-full py-2 outline-none text-3xl font-bold'
							/>
							<div className='flex flex-col items-end justify-center gap-1 text-sm text-gray-600'>
								<h2 className='font-semibold text-xl'>{tokenASymbol}</h2>
								<div className='flex items-center justify-end gap-1'>
									<div className='text-sm text-gray-500'>
										{isETH(tokenA)
											? Number(balanceA?.formatted)?.toFixed(2)
											: formatBalance(balanceA, tokenADecimals)}
									</div>
									<p>{tokenASymbol}</p>
								</div>
							</div>
						</div>
						<div className='flex items-center justify-between bg-[#fffad5] py-2 px-4 rounded-[10px]'>
							<input
								placeholder='0'
								value={amountB}
								onChange={(e) => {
									setAmountB(e.target.value);
									setInputSource("B");
								}}
								type='number'
								className='w-full py-2 outline-none text-3xl font-bold'
							/>
							<div className='flex flex-col items-end justify-center gap-1 text-sm text-gray-600'>
								<h2 className='font-semibold text-xl'>{tokenBSymbol}</h2>
								<div className='flex items-center justify-end gap-1'>
									<div className='text-sm text-gray-500'>
										{isETH(tokenB)
											? Number(balanceB?.formatted)?.toFixed(2)
											: formatBalance(balanceB, tokenBDecimals)}
									</div>
									<p>{tokenBSymbol}</p>
								</div>
							</div>
						</div>

						<button
							onClick={handleClick}
							disabled={pendingApproval}
							className='mt-3 px-4 py-2 blue-button rounded w-full disabled:opacity-50 cursor-pointer'
						>
							{getButtonLabel()}
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
