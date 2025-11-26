import React from "react";

import Image from "next/image";
import Link from "next/link";

import classNames from "classnames";
import { MoveRightIcon } from "lucide-react";

import Button from "@/components/Button/Button";

const HomeHero = () => {
	return (
		<section className='bg-surface/40 flex min-h-[450px] w-full justify-center border-b border-gray-300 px-3 sm:min-h-[500px] md:min-h-[600px] pt-[5rem]'>
			<div className='relative flex w-full max-w-[1000px]'>
				<div
					className={
						"absolute top-1/2 z-0 grid w-full -translate-y-1/2 items-center gap-[6rem] lg:-left-[5rem]"
					}
				>
					<Image
						width={64}
						height={64}
						src={"/Image/usdc.png"}
						alt='usdc'
						className='size-11 sm:size-14 lg:size-16'
					/>
					<Image
						width={64}
						height={64}
						src={"/Image/usdt.png"}
						alt='usdt'
						className='ml-[100px] size-11 opacity-0 sm:size-14 lg:size-16 lg:opacity-100'
					/>
					<Image
						width={64}
						height={64}
						src={"/Image/dao.png"}
						alt='dai'
						className='size-11 sm:size-14 lg:size-16'
					/>
				</div>

				<div className='relative z-10 flex w-full flex-col items-center justify-center gap-3'>
					<div className='text-center text-2xl font-bold text-black sm:text-4xl md:space-y-1 lg:text-[40px] xl:text-5xl'>
						<p>
							Seamless <span className='text-accent-pink'>Liquidity</span>{" "}
							Provision{" "}
						</p>
						<p>
							and Token <span className='text-accent-pink'>Swaps</span>
						</p>
					</div>
					<p className='text-secondary text-center text-[15px] md:w-[520px] md:text-lg'>
						Easily provide or withdraw liquidity on Uniswap V2, V3, and V4.
						Perform efficient token swaps while we handle all the underlying
						complexity, ensuring a smooth and secure experience.
					</p>
					<Link href={"/pools"} className='mt-3'>
						<Button className='w-[200px] gap-1 bg-[rgba(255,0,122,0.2)] text-[#FF007A]'>
							<span>Get Started</span> <MoveRightIcon className='size-5' />
						</Button>
					</Link>
				</div>

				<div
					className={
						"absolute top-1/2 z-0 grid w-full -translate-y-1/2 items-center justify-end gap-[6rem] lg:-right-[5rem]"
					}
				>
					<Image
						width={64}
						height={64}
						src={"/Image/ether.png"}
						alt='eth'
						className='size-11 sm:size-14 lg:size-16'
					/>
					<Image
						width={64}
						height={64}
						src={"/Image/uniswap.png"}
						alt='uni'
						className='-ml-[100px] size-11 opacity-0 sm:size-14 lg:size-16 lg:opacity-100'
					/>
					<Image
						src={"/Image/btc.png"}
						alt='btc'
						width={64}
						height={64}
						className='size-11 sm:size-14 lg:size-16'
					/>
				</div>
			</div>
		</section>
	);
};

export default HomeHero;
