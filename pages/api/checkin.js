import { useWriteContract } from "wagmi";

const CHECKIN_ABI = [
    {
        inputs: [],
        name: "checkIn",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];

export default function CheckInButton() {
    const { writeContract, data: hash, isPending } = useWriteContract();

    const handleCheckIn = () => {
        writeContract({
            address: "0x751A0Ae62742DbC831b5536bEe01Eb4EfB7AB2c7", // contract address
            abi: CHECKIN_ABI,
            functionName: "checkIn",
            args: [],
        });
    };

    return (
        <button onClick={handleCheckIn} disabled={isPending}>
            {isPending ? "Processing..." : "Check In"}
            {hash && <p>Tx hash: {hash}</p>}
        </button>
    );
}
