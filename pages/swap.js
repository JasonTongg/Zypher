"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPortfolio } from "../store/data";
import { useAccount } from "wagmi";
import { useTokenSwap } from "@/hooks/useTokenSwap";
import { useTokenToETHSwap } from "@/hooks/useTokenToEthSwap";
import { useETHToTokenSwap } from "@/hooks/useEthToTokenSwap";
import { formatUnits } from "viem";
import { setNavbarActive } from "../store/data";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import { FaChevronDown } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import { GiTwoCoins } from "react-icons/gi";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { fetchSearchToken, fetchSearchTokenB } from "../store/data";
import { FaAngleDoubleDown } from "react-icons/fa";
import { toast } from "react-toastify";
import { useReadContract } from "wagmi";
import erc20Abi from "../hooks/abi/erc20.json";
import { useBalance } from "wagmi";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 400,
	bgcolor: "#FFFFE3",
	borderRadius: "10px",
};

const ETH_ADDRESS = "0x0000000000000000000000000000000000000000"; // Standard ETH placeholder

export default function Swap() {
	const dispatch = useDispatch();
	const params = useSearchParams();
	const tokenAParam = params?.get("tokenA");
	const tokenASymbolParam = params?.get("tokenASymbol");
	const tokenBParam = params?.get("tokenB");
	const tokenBSymbolParam = params?.get("tokenBSymbol");
	const { portfolio, searchToken, searchTokenB, version } = useSelector(
		(state) => state.data
	);
	const [tabActive, setTabActive] = useState(0);
	const { address, isConnected } = useAccount();
	const [tokenIn, setTokenIn] = useState("");
	const [tokenOut, setTokenOut] = useState("");
	const [amountIn, setAmountIn] = useState("");
	const [userPortfolio, setUserPortfolio] = useState(
		portfolio?.data?.portfolio?.balances
	);
	const [search, setSearch] = useState("");
	const [searchResult, setSearchResult] = useState("");
	const [searchB, setSearchB] = useState("");
	const [searchResultB, setSearchResultB] = useState(null);
	const [tokenASymbol, setTokenASymbol] = useState(tokenASymbolParam || "");
	const [tokenBSymbol, setTokenBSymbol] = useState(tokenBSymbolParam || "");

	const [open, setOpen] = useState(false);
	const handleOpen = () => setOpen(true);
	const handleClose = () => setOpen(false);

	const [open2, setOpen2] = useState(false);
	const handleOpen2 = () => setOpen2(true);
	const handleClose2 = () => setOpen2(false);

	const tokenInDecimals = useMemo(() => {
		if (tokenIn === ETH_ADDRESS) return 18;
		const token = userPortfolio?.find((item) => item.token.address === tokenIn);
		return token?.token.decimals || 18;
	}, [tokenIn, userPortfolio]);

	const tokenOutDecimals = useMemo(() => {
		if (tokenOut === ETH_ADDRESS) return 18;
		const token = userPortfolio?.find(
			(item) => item.token.address === tokenOut
		);
		return token?.token.decimals || 18;
	}, [tokenOut, userPortfolio]);

	// Initialize all three swap hooks
	const tokenToTokenSwap = useTokenSwap({
		swapContract: process.env.NEXT_PUBLIC_SWAP_CONTRACT,
		tokenIn: tokenIn,
		tokenOut: tokenOut,
		tokenInDecimals: tokenInDecimals,
		tokenOutDecimals: tokenOutDecimals,
	});

	const tokenToETHSwap = useTokenToETHSwap({
		swapContract: process.env.NEXT_PUBLIC_SWAP_CONTRACT,
		tokenIn: tokenIn,
		tokenInDecimals: tokenInDecimals,
	});

	const ethToTokenSwap = useETHToTokenSwap({
		swapContract: process.env.NEXT_PUBLIC_SWAP_CONTRACT,
		tokenOut: tokenOut,
		tokenOutDecimals: tokenOutDecimals,
	});

	// Determine swap type based on selected tokens
	const swapType = useMemo(() => {
		if (tokenIn === ETH_ADDRESS) return "eth-to-token";
		if (tokenOut === ETH_ADDRESS) return "token-to-eth";
		if (tokenIn !== ETH_ADDRESS && tokenOut !== ETH_ADDRESS)
			return "token-to-token";
		return "token-to-eth";
	}, [tokenIn, tokenOut]);

	// Select the appropriate swap hook based on swap type
	const activeSwap = useMemo(() => {
		switch (swapType) {
			case "token-to-token":
				return tokenToTokenSwap;
			case "token-to-eth":
				return tokenToETHSwap;
			case "eth-to-token":
				return ethToTokenSwap;
			default:
				return null;
		}
	}, [swapType, tokenToTokenSwap, tokenToETHSwap, ethToTokenSwap]);

	function resolveIPFS(url) {
		if (!url) return "";
		if (url.startsWith("ipfs://")) {
			return `https://ipfs.io/ipfs/${url.replace("ipfs://", "")}`;
		}
		return url;
	}

	useEffect(() => {
		if (activeSwap && amountIn) {
			activeSwap?.setAmountIn(amountIn);
		}
	}, [amountIn, activeSwap]);

	useEffect(() => {
		if (address) {
			dispatch(fetchPortfolio({ address }));
			refetchBalance();
			refetch();
		}
	}, [address]);

	useEffect(() => {
		if (portfolio) {
			const filteredPortfolio =
				portfolio?.data?.portfolio?.balances?.filter(
					(item) => item.token.metadata?.spamCode === "SPAM_CODE_NOT_SPAM"
				) || [];
			setUserPortfolio(filteredPortfolio);
		}
	}, [portfolio]);

	useEffect(() => {
		dispatch(setNavbarActive("swap"));
	}, []);

	const portfolioWithETH = useMemo(() => {
		return [...(userPortfolio || [])];
	}, [userPortfolio]);

	const handleSwapTokens = () => {
		const tempIn = tokenIn;
		const tempSymbol = tokenASymbol;
		setTokenIn(tokenOut);
		setTokenOut(tempIn);
		setTokenASymbol(tokenBSymbol);
		setTokenBSymbol(tempSymbol);
	};

	const handleApprove = () => {
		if (swapType === "eth-to-token") return;
		activeSwap?.approveToken();
		toast.info("Approving...");
	};

	const handleSwap = () => {
		toast.info("Swapping...");
		switch (swapType) {
			case "token-to-token":
				tokenToTokenSwap.executeSwap();
				break;
			case "token-to-eth":
				tokenToETHSwap.executeSwapToETH();
				break;
			case "eth-to-token":
				ethToTokenSwap.executeSwapETHForToken();
				break;
		}
	};

	// Get expected output based on swap type
	const getExpectedOutput = () => {
		switch (swapType) {
			case "token-to-token":
				return tokenToTokenSwap.expectedOut?.toString();
			case "token-to-eth":
				return tokenToETHSwap.expectedETH?.toString();
			case "eth-to-token":
				return ethToTokenSwap.expectedTokenOut?.toString();
			default:
				return null;
		}
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
		if (amountIn > 0 && activeSwap?.enoughLiquidity === false) {
			toast.warning("Not enough liquidity for this swap");
		}
	}, [activeSwap?.enoughLiquidity, amountIn]);

	useEffect(() => {
		if (activeSwap?.swapReceiptError) {
			toast.error("Swap Failed!...");
		}
	}, [activeSwap?.swapReceiptError]);

	useEffect(() => {
		if (activeSwap?.swapError) {
			toast.error("Swap Failed!...");
		}
	}, [activeSwap?.swapError]);

	useEffect(() => {
		if (activeSwap?.swapConfirmed) {
			toast.success("Swap Completed!...");
			setAmountIn("");
			refetchBalance();
			refetch();

			if (swapType !== "eth-to-token") activeSwap?.refetchBalance();
		}
	}, [activeSwap?.swapConfirmed]);

	useEffect(() => {
		if (activeSwap?.approveReceiptError) {
			toast.error("Approve Failed!...");
		}
	}, [activeSwap?.approveReceiptError]);

	useEffect(() => {
		if (activeSwap?.approveError) {
			toast.error("Approve Failed!...");
		}
	}, [activeSwap?.approveError]);

	useEffect(() => {
		if (activeSwap?.approveConfirmed) {
			toast.success("Approved!...");
		}
	}, [activeSwap?.approveConfirmed]);

	const {
		data: balance,
		error: balanceError,
		refetch: refetchBalance,
	} = useReadContract({
		address: tokenOut,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: [address],
		query: { enabled: !!address },
	});

	const { data, refetch } = useBalance({
		address,
	});

	return (
		<div
			className='p-3 sm:p-10 max-w-2xl mx-auto space-y-6 mt-[4.5rem] w-full flex flex-col items-center justify-center'
			style={{ minHeight: "calc(100vh - 200px)" }}
		>
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
											setTokenIn(searchResult.address);
											setTokenASymbol(searchResult.symbol);

											if (tokenOut === searchResult?.address) {
												setTokenOut("");
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
													<p className='text-base'>{searchResult?.symbol}</p>
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
										?.filter((item) => item.token.address !== tokenOut)
										?.map((item) => (
											<div
												key={item?.token?.address}
												className='cursor-pointer hover:bg-gray-100 flex items-center justify-between'
												onClick={() => {
													setTokenIn(item?.token?.address);
													setTokenASymbol(item?.token?.symbol);
													if (tokenOut === searchResult?.address) {
														setTokenOut("");
														setTokenBSymbol("");
													}

													handleClose();
												}}
											>
												<div className='flex gap-2 items-center justify-start'>
													<Image
														src={resolveIPFS(item?.token?.metadata?.logoUrl)}
														alt={item?.token?.symbol}
														width={35}
														height={35}
													/>
													<div className='flex flex-col'>
														<p className='text-base font-semibold'>
															{item?.token?.name}
														</p>
														<div className='flex items-center gap-1'>
															<p className='text-base'>{item?.token?.symbol}</p>
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
											setTokenOut(searchResultB.address);
											setTokenBSymbol(searchResultB.symbol);
											refetchBalance();
											refetch();

											if (tokenIn === searchResultB?.address) {
												setTokenIn("");
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
													<p className='text-base'>{searchResultB?.symbol}</p>
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
										?.filter((item) => item.token.address !== tokenIn)
										?.map((item) => (
											<div
												key={item?.token?.address}
												className='cursor-pointer hover:bg-gray-100 flex items-center justify-between'
												onClick={() => {
													setTokenOut(item?.token?.address);
													setTokenBSymbol(item?.token?.symbol);
													refetchBalance();
													refetch();
													if (tokenIn === searchResultB?.address) {
														setTokenIn("");
														setTokenASymbol("");
													}

													handleClose2();
												}}
											>
												<div className='flex gap-2 items-center justify-start'>
													<Image
														src={resolveIPFS(item?.token?.metadata?.logoUrl)}
														alt={item?.token?.symbol}
														width={35}
														height={35}
													/>
													<div className='flex flex-col'>
														<p className='text-base font-semibold'>
															{item?.token?.name}
														</p>
														<div className='flex items-center gap-1'>
															<p className='text-base'>{item?.token?.symbol}</p>
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
			<div className='flex flex-col items-center justify-center space-y-4 w-full max-w-md'>
				<div className='flex items-center justify-between gap-2 w-full'>
					<div className='flex items-center justify-center gap-2 flex-wrap'>
						<button
							className={`w-[70px] py-1 px-3 rounded-[100px] cursor-pointer disabled:cursor-not-allowed ${
								tabActive === 0
									? "blue-button"
									: "text-[#2775ca] bg-transparent border-[1px] border-[rgba(39,117,202,0.25)]"
							}`}
							onClick={() => setTabActive(0)}
						>
							Swap
						</button>
						<button
							className={`w-[70px] py-1 px-3 rounded-[100px] cursor-pointer disabled:cursor-not-allowed ${
								tabActive === 1
									? "blue-button"
									: "text-[#2775ca] bg-transparent border-[1px] border-[rgba(39,117,202,0.25)]"
							}`}
							onClick={() => setTabActive(1)}
							disabled
						>
							Limit
						</button>
						<button
							className={`w-[70px] py-1 px-3 rounded-[100px] cursor-pointer disabled:cursor-not-allowed ${
								tabActive === 2
									? "blue-button"
									: "text-[#2775ca] bg-transparent border-[1px] border-[rgba(39,117,202,0.25)]"
							}`}
							onClick={() => setTabActive(2)}
							disabled
						>
							Buy
						</button>
						<button
							className={`w-[70px] py-1 px-3 rounded-[100px] cursor-pointer disabled:cursor-not-allowed ${
								tabActive === 3
									? "blue-button"
									: "text-[#2775ca] bg-transparent border-[1px] border-[rgba(39,117,202,0.25)]"
							}`}
							onClick={() => setTabActive(3)}
							disabled
						>
							Sell
						</button>
					</div>
				</div>
				<div className='w-full relative flex flex-col gap-1 mb-[5px]'>
					<div className='flex flex-col items-start justify-center gap-1 bg-[#fffad5] border-[1px] border-gray-300 rounded-[25px] p-4'>
						<p className='text-lg font-bold'>Sell</p>
						<div className='flex items-center justify-between '>
							<input
								type='number'
								placeholder='0.0'
								value={amountIn}
								onChange={(e) => setAmountIn(e.target.value)}
								className='w-full border-none outline-none rounded text-3xl font-semibold'
							/>
							<div className='flex flex-col items-end justify-center gap-3'>
								<div className='flex items-center justify-center gap-2'>
									<button
										className='text-sm px-2 py-[1px] rounded-[100px] border-[1px] border-[#2775ca] text-[#2775ca] cursor-pointer'
										onClick={() =>
											setAmountIn(
												String(
													Number(
														formatUnits(
															activeSwap?.balance.value ?? activeSwap?.balance,
															tokenInDecimals
														)
													).toFixed(2) / 4
												)
											)
										}
									>
										25%
									</button>
									<button
										className='text-sm px-2 py-[1px] rounded-[100px] border-[1px] border-[#2775ca] text-[#2775ca] cursor-pointer'
										onClick={() =>
											setAmountIn(
												String(
													Number(
														formatUnits(
															activeSwap?.balance.value ?? activeSwap?.balance,
															tokenInDecimals
														)
													).toFixed(2) / 2
												)
											)
										}
									>
										50%
									</button>
									<button
										className='text-sm px-2 py-[1px] rounded-[100px] border-[1px] border-[#2775ca] text-[#2775ca] cursor-pointer'
										onClick={() =>
											setAmountIn(
												String(
													(Number(
														formatUnits(
															activeSwap?.balance.value ?? activeSwap?.balance,
															tokenInDecimals
														)
													).toFixed(2) *
														3) /
														4
												)
											)
										}
									>
										75%
									</button>
									<button
										className='text-sm px-2 py-[1px] rounded-[100px] border-[1px] border-[#2775ca] text-[#2775ca] cursor-pointer'
										onClick={() =>
											setAmountIn(
												String(
													Number(
														formatUnits(
															activeSwap?.balance.value ?? activeSwap?.balance,
															tokenInDecimals
														)
													).toFixed(2)
												)
											)
										}
									>
										MAX
									</button>
								</div>
								<button
									onClick={() => {
										handleOpen();
										setSearch("");
									}}
									className='blue-button gap-2 rounded-[100px] py-[0.3rem] px-[15px] flex justify-center items-center cursor-pointer min-w-[100px]'
								>
									<p className='whitespace-nowrap'>
										{tokenASymbol || "Select Token"}
									</p>
									<FaChevronDown className='text-[0.85rem] font-semibold' />
								</button>
								{activeSwap?.balance !== undefined && (
									<p className='text-sm text-gray-600'>
										{Number(
											formatUnits(
												activeSwap?.balance.value ?? activeSwap?.balance,
												tokenInDecimals
											)
										).toFixed(2)}{" "}
										{tokenASymbol}
									</p>
								)}
							</div>
						</div>
					</div>
					<div className='flex justify-center absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-20%]'>
						<button
							onClick={handleSwapTokens}
							className='bg-[#2775CA] p-2 rounded-[10px] cursor-pointer'
						>
							<FaAngleDoubleDown className='text-xl sm:text-3xl text-[#fffad5]' />
						</button>
					</div>
					<div className='flex flex-col items-start justify-center gap-1 bg-[#fffad5] border-[1px] border-gray-300 rounded-[25px] p-4'>
						<p className='text-lg font-bold'>Buy</p>
						<div className='flex items-center justify-between w-full'>
							<h2 className='w-full border-none outline-none rounded text-3xl font-semibold'>
								{(getExpectedOutput() &&
									Number(amountIn) > 0 &&
									Number(
										formatUnits(getExpectedOutput(), tokenOutDecimals)
									).toFixed(9)) ||
									"0.0"}
							</h2>
							<div className='flex flex-col items-end justify-center gap-3'>
								<button
									onClick={() => {
										handleOpen2();
										setSearchB("");
									}}
									className='blue-button gap-2 rounded-[100px] py-[0.3rem] px-[15px] flex justify-center items-center cursor-pointer min-w-[100px]'
								>
									<p className='whitespace-nowrap'>
										{tokenBSymbol || "Select Token"}
									</p>
									<FaChevronDown className='text-[0.85rem] font-semibold' />
								</button>
								{balance !== undefined && tokenBSymbol !== "ETH" && (
									<p className='text-sm text-gray-600 '>
										{Number(formatUnits(balance, tokenOutDecimals)).toFixed(2)}{" "}
										{tokenBSymbol}
									</p>
								)}
								{data?.formatted !== undefined && tokenBSymbol === "ETH" && (
									<p className='text-sm text-gray-600 '>
										{Number(data?.formatted).toFixed(2)} {tokenBSymbol}
									</p>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Error Display
				{activeSwap &&
					(activeSwap?.balanceError ||
						activeSwap?.expectedOutError ||
						activeSwap?.expectedETHError ||
						activeSwap?.expectedTokenError) && (
						<div className='w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
							<p>
								Read error:{" "}
								{activeSwap?.balanceError?.message ||
									activeSwap?.expectedOutError?.message ||
									activeSwap?.expectedETHError?.message ||
									activeSwap?.expectedTokenError?.message}
							</p>
						</div>
					)} */}

				<div className='flex space-x-4 w-full'>
					{activeSwap?.isApproved === false ? (
						<button
							onClick={handleApprove}
							disabled={!activeSwap || activeSwap?.isApproveLoading}
							className='flex-1 blue-button font-bold py-2 px-4 rounded-[25px] cursor-pointer'
						>
							{activeSwap?.isApproveLoading ? "Approving..." : "Approve"}
						</button>
					) : (
						<button
							onClick={handleSwap}
							disabled={
								activeSwap?.isApproved === false ||
								activeSwap?.isSwapLoading ||
								!activeSwap
							}
							className='flex-1 blue-button font-bold py-2 px-4 rounded-[25px] cursor-pointer'
						>
							{activeSwap?.isSwapLoading ? "Swapping..." : "Swap"}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
