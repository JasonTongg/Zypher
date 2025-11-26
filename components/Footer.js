import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaLinkedin } from "react-icons/fa6";
import { FiGithub } from "react-icons/fi";

export default function Navbar() {
	return (
		<div className='w-full flex items-center justify-center px-4 py-8 border-t-[1px] border-gray-300'>
			<motion.div
				initial={{ transform: "translateX(-100px)", opacity: 0 }}
				whileInView={{ transform: "translateX(0px)", opacity: 1 }}
				exit={{ transform: "translateX(-100px)", opacity: 0 }}
				transition={{ duration: 0.5 }}
				className='max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-2'
			>
				<p className='text-lg text-center'>
					&copy; {new Date().getFullYear()}{" "}
					<span className='text-[#FF007A] font-semibold'>Zypher</span>. Make
					with &hearts; by{" "}
					<Link
						target='_blank'
						href='https://www.linkedin.com/in/jason-tong-42600319a/'
						className='text-[#FF007A] font-semibold'
					>
						Jason
					</Link>
				</p>
				<div className='flex items-center justify-center gap-2'>
					<Link
						target='_blank'
						href='https://www.linkedin.com/in/jason-tong-42600319a/'
					>
						<FaLinkedin className='text-2xl' />
					</Link>
					<Link target='_blank' href='https://github.com/JasonTongg'>
						<FiGithub className='text-2xl' />
					</Link>
				</div>
			</motion.div>
		</div>
	);
}
