import React from "react";
import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import HomeTitle from "../public/assets/HomeTitle.png";
import ConnectWalletButton from "../public/assets/ConnectWalletButton.png";
import StartButton from "../public/assets/StartButton.png";

export default function Hero() {
  const { address, isConnected } = useAccount();
  const { data: balance, isLoading } = useBalance({ address });
  const router = useRouter();

  return (
    <div className="bg-home w-full min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ transform: "translateX(-100px)", opacity: 0 }}
        whileInView={{ transform: "translateX(0px)", opacity: 1 }}
        exit={{ transform: "translateX(-100px)", opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-screen-2xl py-[2rem] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-5"
      >
        <Image src={HomeTitle} alt="Home title" className="!h-[70vh] w-auto" />

        {isConnected ? (
          <Link href="/jokes">
            <Image src={StartButton} className="w-[150px] h-auto"></Image>
          </Link>
        ) : (
          <ConnectButton.Custom>
            {({ account, chain, openConnectModal, mounted }) => {
              return (
                <button
                  onClick={openConnectModal}
                  className="focus:outline-none"
                >
                  <Image
                    src={ConnectWalletButton}
                    alt="Connect wallet"
                    className="w-[200px] h-auto hover:scale-105 transition-transform active:scale-95"
                  />
                </button>
              );
            }}
          </ConnectButton.Custom>
        )}
      </motion.div>
    </div>
  );
}
