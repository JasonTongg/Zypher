"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import {
	useWriteContract,
	useAccount,
	useReadContract,
	useWaitForTransactionReceipt,
} from "wagmi";
import { useDispatch, useSelector } from "react-redux";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	CircularProgress,
	Typography,
	Box,
	Stack,
	Slider,
} from "@mui/material";
import { setNavbarActive } from "../../../store/data";
import { fetchListPositions } from "../../../store/data";
import { formatUnits } from "viem";
import { IoMdClose } from "react-icons/io";
import { toast } from "react-toastify";
import { FaWaterLadder } from "react-icons/fa6";

const erc20Abi = [
	{
		name: "approve",
		type: "function",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "spender", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ name: "", type: "bool" }],
	},
	{
		name: "allowance",
		type: "function",
		stateMutability: "view",
		inputs: [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
		],
		outputs: [{ name: "", type: "uint256" }],
	},
];

const routerAbi = [
	{
		name: "removeLiquidity",
		type: "function",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "tokenA", type: "address" },
			{ name: "tokenB", type: "address" },
			{ name: "liquidity", type: "uint256" },
		],
		outputs: [
			{ name: "amountA", type: "uint256" },
			{ name: "amountB", type: "uint256" },
		],
	},
	{
		name: "removeLiquidityETH",
		type: "function",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "token", type: "address" },
			{ name: "liquidity", type: "uint256" },
		],
		outputs: [
			{ name: "amountToken", type: "uint256" },
			{ name: "amountETH", type: "uint256" },
		],
	},
];

export default function RemoveLiquidityWithPositions() {
	const { address } = useAccount();
	const contractAddress = process.env.NEXT_PUBLIC_SWAP_CONTRACT;
	const dispatch = useDispatch();
	const spanRef = useRef(null);
	const [width, setWidth] = useState(20);

	const { data: apiResult, loading } = useSelector(
		(state) => state.data.listPositions
	);
	const positions = apiResult?.positions || [];

	const [openModal, setOpenModal] = useState(false);
	const [selectedPos, setSelectedPos] = useState(null);
	const [liquidityAmount, setLiquidityAmount] = useState(0n);
	const [percentage, setPercentage] = useState(0);
	const [poolType, setPoolType] = useState("All Pools");

	const {
		data: approveTxHash,
		writeContractAsync: approveAsync,
		isPending: isApproving,
		reset: resetApprove,
	} = useWriteContract();
	const {
		data: removeTxHash,
		writeContractAsync: removeLiquidityAsync,
		isPending: isRemoving,
		reset: resetRemove,
	} = useWriteContract();

	const { data: currentAllowance, refetch: refetchAllowance } = useReadContract(
		{
			abi: erc20Abi,
			functionName: "allowance",
			address: selectedPos?.v2Pair.liquidityToken.address,
			args: [address, contractAddress],
			enabled: !!openModal && !!address && !!contractAddress && !!selectedPos,
		}
	);

	const { isLoading: isWaitingForApproval, isSuccess: isApprovalSuccess } =
		useWaitForTransactionReceipt({
			hash: approveTxHash,
		});
	const { isLoading: isWaitingForRemoval, isSuccess: isRemovalSuccess } =
		useWaitForTransactionReceipt({
			hash: removeTxHash,
		});

	useEffect(() => {
		if (address) {
			dispatch(fetchListPositions({ address }));
		}
	}, [address, dispatch]);

	useEffect(() => {
		if (isApprovalSuccess) {
			toast.success("Approval successful! Proceeding to remove liquidity...");
			refetchAllowance();
			executeRemoveLiquidity();
		}
	}, [isApprovalSuccess]);

	useEffect(() => {
		if (isRemovalSuccess) {
			toast.success("Liquidity removed successfully!");
			if (address) {
				dispatch(fetchListPositions({ address }));
			}
		}
	}, [isRemovalSuccess, dispatch, address, removeTxHash]);

	useEffect(() => {
		dispatch(setNavbarActive("dashboard"));
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (spanRef.current) {
				setWidth(spanRef.current.offsetWidth + 10);
			}
		}, 0);

		return () => clearTimeout(timer);
	}, [percentage, openModal]);

	function openRemoveModal(pos) {
		setSelectedPos(pos);
		setPercentage(100);
		setLiquidityAmount(BigInt(pos.v2Pair.liquidity));
		setOpenModal(true);
	}

	function closeModal() {
		setOpenModal(false);
		setSelectedPos(null);
		setLiquidityAmount(0n);
		resetApprove();
		resetRemove();
		setPercentage(100);
	}

	const liquidityToRemove = (liquidityAmount * BigInt(percentage)) / 100n;

	async function handleConfirm() {
		if (!selectedPos || !address || !contractAddress) return;

		try {
			if (currentAllowance < liquidityToRemove) {
				toast.info("Approving...");
				const tx = await approveAsync({
					address: selectedPos.v2Pair.liquidityToken.address,
					abi: erc20Abi,
					functionName: "approve",
					args: [contractAddress, liquidityToRemove],
				});
				toast.info("Approval transaction sent. Waiting for confirmation...");
			} else {
				toast.success(
					"Allowance confirmed. Please confirm removal in your wallet..."
				);
				await executeRemoveLiquidity();
			}
		} catch (err) {
			console.error(err);
			toast.error("Approval Failed...");
		}
	}

	async function executeRemoveLiquidity() {
		if (!selectedPos) return;

		const token0 = selectedPos.v2Pair.token0.address;
		const token1 = selectedPos.v2Pair.token1.address;
		const wethAddress = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";
		const isETH =
			token0.toLowerCase() === wethAddress ||
			token1.toLowerCase() === wethAddress;

		try {
			let tx;
			if (isETH) {
				const token = token0.toLowerCase() === wethAddress ? token1 : token0;
				tx = await removeLiquidityAsync({
					address: contractAddress,
					abi: routerAbi,
					functionName: "removeLiquidityETH",
					args: [token, liquidityToRemove],
				});
			} else {
				tx = await removeLiquidityAsync({
					address: contractAddress,
					abi: routerAbi,
					functionName: "removeLiquidity",
					args: [token0, token1, liquidityToRemove],
					_,
				});
			}
			toast.success("Remove transaction sent! Waiting for confirmation...");
		} catch (err) {
			console.error(err);
			toast.success("Remove Liquidity Failed...");
		}
	}

	const isBusy =
		isApproving || isWaitingForApproval || isRemoving || isWaitingForRemoval;

	const needsApproval =
		typeof currentAllowance === "bigint" &&
		currentAllowance < liquidityToRemove;

	let buttonText = "Confirm Remove";
	if (isApproving) buttonText = "Check Wallet (Approve)...";
	else if (isWaitingForApproval) buttonText = "Approving...";
	else if (isRemoving) buttonText = "Check Wallet (Remove)...";
	else if (isWaitingForRemoval) buttonText = "Removing...";
	else if (isRemovalSuccess) buttonText = "Done";
	else if (needsApproval) buttonText = "Approve & Remove";

	const getVersion = (resp) => {
		if (resp === "PROTOCOL_VERSION_V2") {
			return "V2";
		} else if (resp === "PROTOCOL_VERSION_V3") {
			return "V3";
		} else if (resp === "PROTOCOL_VERSION_V4") {
			return "V4";
		}
	};

	function formatNumber(num) {
		num = Number(num);

		if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
		if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
		if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
		if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";

		return num.toString();
	}

	const filterVersion = () => {
		let data = positions;

		if (poolType.toLowerCase() === "all pools") {
			return data;
		} else if (poolType.toLowerCase() === "v2") {
			return data.filter(
				(item) => item.protocolVersion === "PROTOCOL_VERSION_V2"
			);
		} else if (poolType.toLowerCase() === "v3") {
			return data.filter(
				(item) => item.protocolVersion === "PROTOCOL_VERSION_V3"
			);
		} else if (poolType.toLowerCase() === "v4") {
			return data.filter(
				(item) => item.protocolVersion === "PROTOCOL_VERSION_V4"
			);
		}
	};

	return (
		<div
			className='p-10 max-w-5xl space-y-6 mt-[4.5rem] flex flex-col items-center justify-start w-full'
			style={{ minHeight: "calc(100vh - 200px)" }}
		>
			<div className='flex flex-col items-start justify-center gap-2 w-full'>
				<h1 className='text-3xl font-bold'>Dashboard</h1>
				<p className='text-lg pb-[1rem]'>
					Manage your liquidity positions, track real-time insights, and
					optimize earnings with ease.
				</p>
				<div className='flex items-center justify-center sm:justify-start gap-4 flex-wrap'>
					<button
						className='py-2 px-6 border-[1px] border-gray-300 flex items-center justify-center rounded-[7px]'
						style={
							poolType.toLowerCase() === "all pools"
								? { background: "rgba(39,117,202,0.25)", color: "#2775CA" }
								: { background: "transparent", color: "black" }
						}
						onClick={() => setPoolType("all pools")}
					>
						All Pools
					</button>
					<button
						className='py-2 px-6 border-[1px] border-gray-300 flex items-center justify-center rounded-[7px]'
						style={
							poolType.toLowerCase() === "v2"
								? { background: "rgba(39,117,202,0.25)", color: "#2775CA" }
								: { background: "transparent", color: "black" }
						}
						onClick={() => setPoolType("v2")}
					>
						V2
					</button>
					<button
						className='py-2 px-6 border-[1px] border-gray-300 flex items-center justify-center rounded-[7px] '
						style={
							poolType.toLowerCase() === "v3"
								? { background: "rgba(39,117,202,0.25)", color: "#2775CA" }
								: { background: "transparent", color: "black" }
						}
						onClick={() => setPoolType("v3")}
					>
						V3
					</button>
					<button
						className='py-2 px-6 border-[1px] border-gray-300 flex items-center justify-center rounded-[7px] '
						style={
							poolType.toLowerCase() === "v4"
								? { background: "rgba(39,117,202,0.25)", color: "#2775CA" }
								: { background: "transparent", color: "black" }
						}
						onClick={() => setPoolType("v4")}
					>
						V4
					</button>
				</div>
			</div>
			{loading ? (
				<div className='flex justify-center p-6'>
					<CircularProgress />
				</div>
			) : filterVersion().length > 0 ? (
				<div className='grid w-full gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
					{filterVersion().map((pos, i) => (
						<div
							key={i}
							className='p-4 border rounded-xl flex justify-center flex-col items-center gap-2'
						>
							<div className='flex items-center justify-between w-full'>
								<p className='text-2xl'>
									{pos?.v2Pair?.token0?.symbol ||
										pos?.v3Position?.token0?.symbol ||
										pos?.v4Position?.poolPosition?.token0?.symbol}
									/
									{pos?.v2Pair?.token1?.symbol ||
										pos?.v3Position?.token1?.symbol ||
										pos?.v4Position?.poolPosition?.token1?.symbol}
								</p>
								<div className='flex items-center justify-start gap-1'>
									<p className='bg-[rgba(39,117,202,0.25)] text-[#2775CA] px-2 py-1 rounded-[5px] text-xs'>
										{getVersion(pos.protocolVersion)}
									</p>
									<p className='bg-[rgba(39,117,202,0.25)] text-[#2775CA] px-2 py-1 rounded-[5px] text-xs'>
										0.3%
									</p>
								</div>
							</div>
							{getVersion(pos.protocolVersion) === "V2" ? (
								<div className='bg-[rgba(39,117,202,0.25)] flex flex-col items-center justify-center gap-2 p-2 w-full rounded-[5px] my-2'>
									<div className='flex items-center justify-between w-full'>
										<p>My Position</p>
										<p>{formatNumber(pos?.v2Pair?.liquidity)}</p>
									</div>
									<div className='flex items-center justify-between w-full'>
										<p>Total Supply</p>
										<p>{formatNumber(pos?.v2Pair?.totalSupply)}</p>
									</div>
								</div>
							) : getVersion(pos.protocolVersion) === "V4" ? (
								<div className='bg-[rgba(39,117,202,0.25)] flex flex-col items-center justify-center gap-2 p-2 w-full rounded-[5px] my-2'>
									<div className='flex items-center justify-between w-full'>
										<p>
											{pos?.v4Position?.poolPosition?.token0?.symbol} Amount
										</p>
										<p>
											{Number(
												formatUnits(pos?.v4Position?.poolPosition?.amount0, 18)
											).toFixed(6)}
										</p>
									</div>
									<div className='flex items-center justify-between w-full'>
										<p>
											{pos?.v4Position?.poolPosition?.token1?.symbol} Amount
										</p>
										<p>
											{Number(
												formatUnits(pos?.v4Position?.poolPosition?.amount1, 18)
											).toFixed(6)}
										</p>
									</div>
								</div>
							) : (
								<div className='bg-[rgba(39,117,202,0.25)] flex flex-col items-center justify-center gap-2 p-2 w-full rounded-[5px] my-2'>
									<div className='flex items-center justify-between w-full'>
										<p>{pos?.v3Position?.token0?.symbol} Amount</p>
										<p>
											{Number(
												formatUnits(pos?.v3Position?.amount0, 18)
											).toFixed(6)}
										</p>
									</div>
									<div className='flex items-center justify-between w-full'>
										<p>{pos?.v3Position?.token1?.symbol} Amount</p>
										<p>
											{Number(
												formatUnits(pos?.v3Position?.amount1, 18)
											).toFixed(6)}
										</p>
									</div>
								</div>
							)}
							<button
								className='p-2 text-center bg-[rgba(39,117,202,0.25)] text-[#2775CA] w-full rounded-[5px] disabled:opacity-30'
								onClick={() => openRemoveModal(pos)}
								disabled={
									getVersion(pos.protocolVersion) === "V3" ||
									getVersion(pos.protocolVersion) === "V4"
								}
							>
								Remove Liquidity
							</button>
						</div>
					))}
				</div>
			) : (
				<div className='flex flex-col items-center justify-center gap-2 border-[1px] rounded-[10px] border-gray-300 w-full min-h-[450px]'>
					<div className='bg-[rgba(39,117,202,0.25)] text-[#2775CA] w-[50px] h-[50px] rounded-[5px] flex items-center justify-center'>
						<FaWaterLadder className='text-[1.7rem]' />
					</div>
					<h2 className='font-semibold text-[1.15rem]'>
						No Liquidity Positions Found
					</h2>
					<p className='text-gray-600'>
						Add liquidity to a pool and view your positions here
					</p>
					<button className='bg-[rgba(39,117,202,0.25)] text-[#2775CA] py-[6px] px-[30px] rounded-[5px]'>
						Add Liquidity
					</button>
				</div>
			)}
			<Dialog
				open={openModal}
				onClose={closeModal}
				fullWidth
				PaperProps={{
					sx: {
						width: "450px",
						maxWidth: "90vw",
						borderRadius: "12px",
					},
				}}
			>
				<div className='flex items-center justify-between gap-3 w-full px-[1rem] bg-[#FFFFE3]'>
					<IoMdClose
						onClick={closeModal}
						className='cursor-pointer text-2xl text-[1.6rem]'
					/>
					<DialogTitle>Remove Liquidity</DialogTitle>
					<IoMdClose className='cursor-pointer opacity-0' />
				</div>
				<DialogContent sx={{ background: "#FFFFE3" }}>
					{selectedPos && (
						<div className='flex flex-col items-start justify-center gap-1'>
							<div className='flex items-center justify-start gap-2'>
								<p className='text-2xl'>
									{selectedPos?.v2Pair?.token0?.symbol ||
										selectedPos?.v3Position?.token0?.symbol ||
										selectedPos?.v4Position?.poolPosition?.token0?.symbol}
									/
									{selectedPos?.v2Pair?.token1?.symbol ||
										selectedPos?.v3Position?.token1?.symbol ||
										selectedPos?.v4Position?.poolPosition?.token1?.symbol}
								</p>
								<p className='bg-[rgba(39,117,202,0.25)] text-[#2775CA] px-2 py-1 rounded-[5px] text-xs'>
									{getVersion(selectedPos.protocolVersion)}
								</p>
							</div>
							<div className='flex items-center justify-start gap-2'>
								<span class='relative flex size-3'>
									<span class='absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF007A] opacity-75'></span>
									<span class='relative inline-flex size-3 rounded-full bg-[#FF007A]'></span>
								</span>
								<p className='text-[#FF007A]'>In range</p>
							</div>
						</div>
					)}
					<Box className='mt-6'>
						<Typography gutterBottom>Withdrawal amount</Typography>
						<div className='relative inline-flex items-center justify-center w-full'>
							<span
								ref={spanRef}
								className='absolute invisible whitespace-pre text-7xl font-bold'
							>
								{percentage || "0"}
							</span>
							<input
								type='text'
								inputmode='numeric'
								step={1}
								min={0}
								max={100}
								value={percentage}
								onChange={(e) => setPercentage(e.target.value)}
								className='border-none bg-transparent text-7xl font-bold outline-none'
								style={{ width }}
							/>
							<span className='text-7xl font-bold translate-x-[-5px]'>%</span>
						</div>
						<Stack
							direction='row'
							spacing={1}
							justifyContent='center'
							className='mt-2'
						>
							<Button
								size='small'
								variant='outlined'
								onClick={() => setPercentage(25)}
							>
								{" "}
								25%
							</Button>
							<Button
								size='small'
								variant='outlined'
								onClick={() => setPercentage(50)}
							>
								50%
							</Button>
							<Button
								size='small'
								variant='outlined'
								onClick={() => setPercentage(75)}
							>
								75%
							</Button>
							<Button
								size='small'
								variant='outlined'
								onClick={() => setPercentage(100)}
							>
								Max
							</Button>
						</Stack>
					</Box>
				</DialogContent>
				<DialogActions sx={{ background: "#FFFFE3", padding: "0px" }}>
					<button
						onClick={handleConfirm}
						disabled={
							isBusy ||
							typeof currentAllowance === "undefined" ||
							isRemovalSuccess ||
							percentage === 0
						}
						className='w-full bg-[rgba(39,117,202,0.25)] text-[#2775CA] py-2 px-4 text-center font-semibold'
					>
						{buttonText}
					</button>
				</DialogActions>
			</Dialog>
		</div>
	);
}
