import Link from "next/link";
import Image from "next/image";
import React from "react";
import Logo from "../public/assets/logo.png";
import { GiHamburgerMenu } from "react-icons/gi";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSelector } from "react-redux";

export default function Navbar() {
	const [anchorEl, setAnchorEl] = React.useState(null);
	const navbarActive = useSelector((state) => state.data.navbarActive);
	const open = Boolean(anchorEl);
	const handleClick = (event) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};
	return (
		<nav className='flex w-full z-[99] p-8 items-center justify-between gap-4 padding-section fixed max-w-screen-2xl px-4 sm:px-6 lg:px-8 top-0 left-1/2 translate-x-[-50%]'>
			<div className='items-center justify-center gap-8 md:flex hidden'>
				<Link href='/'>
					<Image src={Logo} className='w-[140px]' />
				</Link>
				<Link
					href='/v2/pools/'
					className='text-lg font-semibold'
					style={
						navbarActive.toLowerCase() === "dashboard"
							? { opacity: "1" }
							: { opacity: "0.5" }
					}
				>
					Dashboard
				</Link>
				<Link
					href='/swap'
					className='text-lg font-semibold'
					style={
						navbarActive.toLowerCase() === "swap"
							? { opacity: "1" }
							: { opacity: "0.5" }
					}
				>
					Swap
				</Link>
				<Link
					href='/v2/pools/addLiquidity'
					className='text-lg font-semibold'
					style={
						navbarActive.toLowerCase() === "liquidity"
							? { opacity: "1" }
							: { opacity: "0.5" }
					}
				>
					Liquidity
				</Link>
			</div>
			<ConnectButton></ConnectButton>
			<GiHamburgerMenu
				className='text-3xl md:hidden block cursor-pointer text-[#FF007A]'
				onClick={handleClick}
			/>
			<Menu
				id='basic-menu'
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				MenuListProps={{
					"aria-labelledby": "basic-button",
				}}
			>
				<div className='bg-[#FFFFE3] text-black'>
					<Link href='/' onClick={handleClose}>
						<MenuItem>
							<Image src={Logo} className='w-[140px]' />
						</MenuItem>
					</Link>
					<Link href='/v2/pools/' onClick={handleClose}>
						<MenuItem>Dashboard</MenuItem>
					</Link>
					<Link href='/v2/swap' onClick={handleClose}>
						<MenuItem>Swap</MenuItem>
					</Link>
					<Link href='/v2/pools/addLiquidity' onClick={handleClose}>
						<MenuItem>Liquidity</MenuItem>
					</Link>
				</div>
			</Menu>
		</nav>
	);
}
