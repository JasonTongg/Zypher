import Link from "next/link";
import Image from "next/image";
import React from "react";
import Logo from "../public/assets/Logo.webp";
import { GiHamburgerMenu } from "react-icons/gi";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Navbar() {
	const [anchorEl, setAnchorEl] = React.useState(null);
	const open = Boolean(anchorEl);
	const handleClick = (event) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};
	return (
		<nav className='flex w-full z-[99] p-4 items-center justify-between gap-4 padding-section fixed max-w-screen-2xl px-4 sm:px-6 lg:px-8 top-0 left-1/2 translate-x-[-50%]'>
			<div className='items-center justify-center gap-5 md:flex hidden'>
				<Link href='/'>
					<Image src={Logo} className='w-[65px]' />
				</Link>
				<Link href='/create'>Create</Link>
				<Link href='/swap'>Swap</Link>
				<Link href='/pool'>Pool</Link>
			</div>
			<ConnectButton></ConnectButton>
			<GiHamburgerMenu
				className='text-3xl md:hidden block cursor-pointer'
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
				<div className='bg-black text-white'>
					<Link href='/create' onClick={handleClose}>
						<MenuItem>Create</MenuItem>
					</Link>
					<Link href='/swap' onClick={handleClose}>
						<MenuItem>Swap</MenuItem>
					</Link>
					<Link href='/pool' onClick={handleClose}>
						<MenuItem>Pool</MenuItem>
					</Link>
				</div>
			</Menu>
		</nav>
	);
}
