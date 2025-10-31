import React, { useEffect, useState } from "react";
import LandingTitle from "../public/assets/LandingTitle.png";
import Image from "next/image";
import LandingFrame from "../public/assets/LandingFrame.png";
import LandingFrameMobile from "../public/assets/LandingFrameMobile.png";
import PlayNowButton from "../public/assets/PlayNowButton.png";
import Link from "next/link";
import { FaXTwitter } from "react-icons/fa6";
import Btn from "../public/assets/Btn.png";
import Btn2 from "../public/assets/Btn2.png";
import Script from "next/script";

export default function Index() {
	const [jokesCount, setJokesCount] = useState([]);
	const [data, setData] = useState([]);
	const [stats, setStats] = useState({ walletCount: 0, totalJokes: 0 });

	useEffect(() => {
		const hideBranding = () => {
			document
				.querySelectorAll(
					'.eapps-widget-toolbar, a[title="Free Twitter Feed widget"], a[href*="elfsight.com/twitter-feed-widget"]'
				)
				.forEach((el) => el.style.setProperty("display", "none", "important"));
		};

		// Run multiple times because the widget loads dynamically
		const interval = setInterval(hideBranding, 200);
		setTimeout(() => clearInterval(interval), 2000);
	}, []);

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
			setJokesCount(data.details);
			setStats({
				walletCount: data.walletCount,
				totalJokes: data.totalJokes,
			});
			console.log(data);
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
		<div className='w-full relative min-h-screen flex items-center justify-center flex-col '>
			<div className='bg-[rgba(48,38,29,1)] flex w-full items-center flex-col justify-center relative z-[100]'>
				<Image
					src={LandingTitle}
					alt='Landing Title'
					className='w-[25vw] h-auto min-w-[300px] p-4'
				/>
				<div className='border-y-4 border-[#8E805B] text-[#ffffff] py-4 flex items-center justify-center w-full'>
					<div
						className='grid gap-3 w-full justify-center justify-items-center'
						style={{
							gridTemplateColumns: "repeat(auto-fit, minmax(150px, 150px))",
						}}
					>
						<Link
							href='https://github.com/JasonTongg/Tales-of-gold-and-glory'
							target='_blank'
							className='beleren text-center w-full text-base flex items-center justify-center gap-1'
						>
							GITHUB
						</Link>
						<Link
							href='https://helalabs.gitbook.io/tales-of-gold-and-glory-doc'
							target='_blank'
							className='beleren text-center w-full text-base'
						>
							DOCUMENTATION
						</Link>
						<Link
							href='https://x.com/talesofgg'
							target='_blank'
							className='beleren text-center w-full text-base flex items-center justify-center gap-1'
						>
							<FaXTwitter className='text-[#ffffff]' /> (TWITTER)
						</Link>
					</div>
				</div>
			</div>
			<div className='bg-landing flex flex-col items-center justify-center w-full'>
				<div className='w-full relative flex items-center justify-center flex-col'>
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
					<div className='flex items-center justify-center flex-wrap my-6'>
						<div className='relative'>
							<Image src={Btn} className='w-[250px]'></Image>
							<p className='flex flex-col items-center justify-center p-4 absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] w-full'>
								<span className='beleren text-center font-bold text-[#693F19] sm:text-lg text-base'>
									CONNECTED WALLET
								</span>{" "}
								<span className='beleren text-center font-bold text-[#693F19]  text-2xl sm:text-3xl'>
									{stats?.walletCount}
								</span>
							</p>
						</div>

						<div className='relative'>
							<Image src={Btn} className='w-[250px]'></Image>
							<p className='flex flex-col items-center justify-center p-4 absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] w-full'>
								<span className='beleren text-center font-bold text-[#693F19] sm:text-lg text-base'>
									SUBMITTED JOKES
								</span>{" "}
								<span className='beleren text-center font-bold text-[#693F19]  text-2xl sm:text-3xl'>
									{stats?.totalJokes}
								</span>
							</p>
						</div>
					</div>
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
						<div className='w-full grid grid-cols-1 sm:grid-cols-2 gap-3  absolute top-[28.9%] sm:top-[43.36%] left-1/2 translate-x-[-50%] overflow-auto max-h-[56.84%] sm:max-h-[36.78%] max-w-[84.32%] h-auto'>
							<div className='w-full h-[100%] flex flex-col items-center justify-start gap-1 p-4 '>
								<h2 className='text-[#5A5149] text-xl sm:text-2xl font-bold beleren'>
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
							<div className='w-full h-[100%] flex flex-col items-center justify-start gap-1 p-4 '>
								<h2 className='text-[#5A5149] text-xl sm:text-2xl font-bold beleren'>
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
				<div className='flex flex-col items-center justify-center gap-3 w-full'>
					<div className='flex items-center justify-center gap-6 flex-wrap mt-[4rem] mb-[2.5rem]'>
						<div className='flex flex-col items-center justify-center gap-2 min-w-[210px]'>
							<h2 className='sm:text-5xl text-3xl font-bold text-[#D1D2CD] beleren'>
								Follow Us On X
							</h2>
							<p className='sm:text-2xl text-xl font-bold text-[#A99D8D] beleren text-center'>
								Follow to get the latest <br /> information from us
							</p>
						</div>
						<Image src={Btn2} className='w-[300px]' />
					</div>
					<Script src='https://elfsightcdn.com/platform.js' async></Script>
					<div
						class='elfsight-app-b27e497a-dbc2-496a-b155-1dbbec5b5041'
						data-elfsight-app-lazy
					></div>
				</div>
			</div>
		</div>
	);
}
