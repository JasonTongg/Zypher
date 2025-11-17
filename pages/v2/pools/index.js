"use client";

import { useEffect, useState } from "react";
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

import { fetchListPositions } from "../../../store/data";

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

	const { data: apiResult, loading } = useSelector(
		(state) => state.data.listPositions
	);
	const positions = apiResult?.positions || [];

	const [openModal, setOpenModal] = useState(false);
	const [selectedPos, setSelectedPos] = useState(null);
	const [txResult, setTxResult] = useState(null);
	const [liquidityAmount, setLiquidityAmount] = useState(0n);
	const [statusMessage, setStatusMessage] = useState("");
	const [percentage, setPercentage] = useState(100);

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
			setStatusMessage(
				"Approval successful! Proceeding to remove liquidity..."
			);
			refetchAllowance();
			executeRemoveLiquidity();
		}
	}, [isApprovalSuccess]);

	useEffect(() => {
		if (isRemovalSuccess) {
			setStatusMessage("Liquidity removed successfully! ✅");
			setTxResult({ step: "Remove Confirmed", hash: removeTxHash });
			if (address) {
				dispatch(fetchListPositions({ address }));
			}
		}
	}, [isRemovalSuccess, dispatch, address, removeTxHash]);

	function openRemoveModal(pos) {
		setSelectedPos(pos);
		setTxResult(null);
		setStatusMessage("");
		setLiquidityAmount(BigInt(pos.v2Pair.liquidity));
		setPercentage(100);
		setOpenModal(true);
	}

	function closeModal() {
		setOpenModal(false);
		setSelectedPos(null);
		setTxResult(null);
		setStatusMessage("");
		setLiquidityAmount(0n);
		setPercentage(100);
		resetApprove();
		resetRemove();
	}

	const liquidityToRemove = (liquidityAmount * BigInt(percentage)) / 100n;

	async function handleConfirm() {
		if (!selectedPos || !address || !contractAddress) return;

		setStatusMessage("");
		setTxResult(null);

		try {
			if (currentAllowance < liquidityToRemove) {
				setStatusMessage(
					"Please approve spending your LP tokens in your wallet..."
				);
				const tx = await approveAsync({
					address: selectedPos.v2Pair.liquidityToken.address,
					abi: erc20Abi,
					functionName: "approve",
					args: [contractAddress, liquidityToRemove],
				});
				setStatusMessage(
					"Approval transaction sent. Waiting for confirmation..."
				);
				setTxResult({ step: "Approval Sent", hash: tx });
			} else {
				setStatusMessage(
					"Allowance confirmed. Please confirm removal in your wallet..."
				);
				await executeRemoveLiquidity();
			}
		} catch (err) {
			console.error(err);
			setStatusMessage(`Error: ${err.message}`);
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
			setStatusMessage("Remove transaction sent! Waiting for confirmation...");
			setTxResult({ step: "Remove Sent", hash: tx });
		} catch (err) {
			console.error(err);
			setStatusMessage(`Error: ${err.message}`);
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
	else if (isRemovalSuccess) buttonText = "Done ✅";
	else if (needsApproval) buttonText = "Approve & Remove";

	return (
		<div className='p-10 max-w-2xl mx-auto space-y-6'>
			<h1 className='text-2xl font-bold'>My Liquidity Positions</h1>
			{loading ? (
				<div className='flex justify-center p-6'>
					<CircularProgress />
				</div>
			) : (
				<div className='space-y-4'>
					{positions.map((pos, i) => (
						<div
							key={i}
							className='p-4 border rounded-xl flex justify-between items-center'
						>
							<div>
								<p className='font-semibold'>
									{pos.v2Pair.token0.symbol}/ {pos.v2Pair.token1.symbol}
								</p>
								<p className='text-sm text-gray-600'>
									LP: {pos.v2Pair.liquidity}
								</p>
							</div>
							<Button variant='contained' onClick={() => openRemoveModal(pos)}>
								Remove
							</Button>
						</div>
					))}
				</div>
			)}
			<Dialog open={openModal} onClose={closeModal} fullWidth maxWidth='sm'>
				<DialogTitle>Remove Liquidity</DialogTitle>
				<DialogContent>
					{selectedPos && (
						<div className='space-y-2'>
							<p>
								Pair:
								<b>
									{selectedPos.v2Pair.token0.symbol} /{" "}
									{selectedPos.v2Pair.token1.symbol}
								</b>
							</p>
							<p>Total Liquidity: {selectedPos.v2Pair.liquidity}</p>
						</div>
					)}
					<Box className='mt-6'>
						<Typography gutterBottom>
							Amount to Remove: {percentage}%
						</Typography>
						<Slider
							aria-label='Percentage'
							value={percentage}
							onChange={(e, newValue) => setPercentage(newValue)}
							step={1}
							min={1}
							max={100}
						/>
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
					{statusMessage && (
						<Typography variant='body2' className='text-center mt-4'>
							{statusMessage}
						</Typography>
					)}
					{isBusy && !isRemovalSuccess && (
						<div className='flex justify-center mt-4'>
							<CircularProgress />
						</div>
					)}
					{txResult && (
						<pre className='bg-gray-100 p-3 rounded mt-4 text-sm whitespace-pre-wrap'>
							{JSON.stringify(txResult, null, 2)}
						</pre>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={closeModal}>
						{isRemovalSuccess ? "Close" : "Cancel"}
					</Button>
					<Button
						variant='contained'
						onClick={handleConfirm}
						disabled={
							isBusy ||
							typeof currentAllowance === "undefined" ||
							isRemovalSuccess ||
							percentage === 0
						}
					>
						{buttonText}
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}
