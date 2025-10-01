import React, { useEffect, useState } from "react";
import LandingTitle from "../public/assets/LandingTitle.png";
import Image from "next/image";
import LandingFrame from "../public/assets/LandingFrame.png";
import LandingFrameMobile from "../public/assets/LandingFrameMobile.png";
import PlayNowButton from "../public/assets/PlayNowButton.png";
import Link from "next/link";

export default function Index() {
	const [jokesCount, setJokesCount] = useState([]);
	const [data, setData] = useState([]);

	async function getJokesCount() {
		try {
			const res = await fetch("/api/jokesCount", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!res.ok) {
				throw new Error("Failed to fetch jokes count");
			}

			const data = await res.json();
			setJokesCount(data);
			return data;
		} catch (err) {
			console.error("Error fetching jokes count:", err);
			return [];
		}
	}

	async function getWalletPoints() {
		try {
			const res = await fetch(
				`/api/getPoints?address=0x0000000000000000000000000000000000000000`
			);
			const data = await res.json();
			setData(data.data);
		} catch (error) {
			toast.dark("Error fetching wallet points:");
		}
	}

	useEffect(() => {
		getJokesCount();
		getWalletPoints();
	}, []);

	return (
		<div className='w-full relative min-h-screen flex items-center justify-center flex-col'>
			<div className='bg-[rgba(48,38,29,1)] flex w-full items-center flex-col justify-center '>
				<Image
					src={LandingTitle}
					alt='Landing Title'
					className='w-[25vw] h-auto min-w-[300px] p-4'
				/>
				<Link
					href='https://helalabs.gitbook.io/tales-of-gold-and-glory-doc'
					target='_blank'
					className='border-y-4 border-[#8E805B] text-[#A99D8D] py-4 beleren text-center w-full text-base'
				>
					DOCUMENTATION
				</Link>
			</div>
			<div className='w-full relative bg-landing flex items-center justify-center flex-col'>
				<div className='min-h-[500px] flex items-end justify-center gap-6 pb-[1.5rem] max-w-[800px]'>
					<div className='flex items-center justify-center gap-6 md:flex-row flex-col'>
						<div className='flex items-center gap-2 justify-center flex-col'>
							<h1 className='text-3xl sm:text-5xl beleren text-white font-bold text-center'>
								AMUSE THE KING, <br></br> CLAIM YOUR FORTUNE
							</h1>
							<p className='text-[rgba(255,255,255,0.75)] text-base sm:text-lg font-bold text-center'>
								A CLAIMING ADVENTURE WHERE WILL MEETS WEALTH.
							</p>
						</div>
						<Link href='/play'>
							<Image src={PlayNowButton} className='w-[220px] h-auto'></Image>
						</Link>
					</div>
				</div>
				<p className='text-[rgba(255,255,255,0.75)] text-base sm:text-lg font-bold text-center max-w-[800px] uppercase text-white beleren'>
					<span className='text-2xl sm:text-3xl font-bolder beleren'>
						The darkness falls upon our!!!
					</span>{" "}
					<br></br>
					The Kingdom is ensared ancient malevent spell. Brave amuse your King
					with your king, save forth and claim glorious rewards!
				</p>
				<div className='w-full relative max-w-[800px]'>
					<Image
						src={LandingFrame}
						alt='Landing Frame'
						className='w-screen h-auto pointer-events-none sm:block hidden'
					/>
					<Image
						src={LandingFrameMobile}
						alt='Landing Frame Mobile'
						className='w-screen h-auto pointer-events-none block sm:hidden'
					/>
					<div className='w-full grid grid-cols-1 sm:grid-cols-2 gap-3 absolute top-[28.9%] sm:top-[43.36%] left-1/2 translate-x-[-50%] overflow-auto max-h-[56.84%] sm:max-h-[36.78%] h-[100%] max-w-[84.32%]'>
						<div className='w-full h-[100%] flex flex-col items-center justify-start gap-1 p-4'>
							<h2 className='text-[#5A5149] text-xl sm:text-2xl font-bold'>
								Top Witty Jesters
							</h2>
							<div className='w-full'>
								{jokesCount
									?.filter((_, index) => index < 8)
									?.map((joke, index) => (
										<div
											key={index}
											className='w-full flex items-center justify-between'
										>
											<p className='text-[#5A5149] text-lg'>
												{joke.wallet.slice(0, 5)}...{joke.wallet.slice(-5)}
											</p>
											<p className='text-[#5A5149] text-lg'>
												{joke.totalJokes}
											</p>
										</div>
									))}
							</div>
						</div>
						<div className='w-full h-[100%] flex flex-col items-center justify-start gap-1 p-4'>
							<h2 className='text-[#5A5149] text-xl sm:text-2xl font-bold'>
								Top Token Earners
							</h2>
							<div className='w-full'>
								{data
									?.filter((_, index) => index < 8)
									?.map((item, index) => (
										<div
											key={index}
											className='w-full flex items-center justify-between'
										>
											<p className='text-[#5A5149] text-lg'>
												{item.address.slice(0, 5)}...{item.address.slice(-5)}
											</p>
											<p className='text-[#5A5149] text-lg'>{item.point}</p>
										</div>
									))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
