import React from "react";
import { FaLongArrowAltRight } from "react-icons/fa";
import { MdOutlineElectricBolt } from "react-icons/md";

import Link from "next/link";

import Button from "@/components/Button/Button";

const HomeHero = () => {
	return (
		<section className='bg-surface/40 flex items-center justify-center border-t border-gray-300 py-[4rem] md:py-[5rem]'>
			<div className='bg-background grid w-full max-w-[1096px] grid-cols-1 items-center gap-4 rounded-sm p-6 shadow-sm sm:gap-6 md:grid-cols-2 md:gap-8 md:p-9'>
				<div className='flex flex-col items-center gap-2 sm:items-start'>
					<h2 className='text-accent-pink text-center text-3xl font-bold sm:text-start'>
						Ready to supercharge your liquidity?
					</h2>
					<p className='text-secondary text-center sm:text-start'>
						Start earning fees in minutes with our one-click liquidity
						provision. No complex setups, just pure DeFi efficiency.
					</p>
				</div>
				<div className='flex flex-col gap-2'>
					<div className='flex flex-wrap justify-center gap-2 sm:justify-start'>
						<Link href={"/pools"}>
							<Button className='gap-1 !text-lg'>
								Launch App Now
								<MdOutlineElectricBolt className='text-accent-pink' />
							</Button>
						</Link>
						<Link href='#howitwork'>
							<Button className='!bg-accent-blue/20 !text-accent-blue hover:!bg-accent-blue/30 gap-1 !text-lg'>
								Learn More
								<FaLongArrowAltRight className='text-accent-blue' />
							</Button>
						</Link>
					</div>
					<p className='text-secondary text-center text-sm sm:text-start'>
						No credit card required. Start earning in seconds.
					</p>
				</div>
			</div>
		</section>
	);
};

export default HomeHero;
