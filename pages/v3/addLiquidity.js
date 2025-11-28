import Image from "next/image";
import React from "react";
import ErrorImage from "../../public/assets/error.png";
import ErrorText from "../../public/assets/COMINGSOON.png";
import Link from "next/link";

export default function Error() {
	return (
		<div className='flex flex-col items-center justify-center gap-8 px-4'>
			<Image src={ErrorImage} alt='Error' className='max-w-[70vw]' />
			<Image src={ErrorText} alt='Error Text' />
			<Link
				href='/'
				className='blue-button px-6 py-1 rounded-[5px] text-md sm:text-lg '
			>
				Go back to Home
			</Link>
		</div>
	);
}
