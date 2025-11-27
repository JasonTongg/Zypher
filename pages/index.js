import React, { useEffect } from "react";
import Hero from "@/components/Hero";
import HowItWork from "@/components/HowItWork";
import LaunchApp from "@/components/LaunchApp";
import HowSwapWork from "@/components/HowSwapWork";
import { useDispatch } from "react-redux";
import { setNavbarActive } from "../store/data";

export default function Index() {
	const dispatch = useDispatch();
	useEffect(() => {
		dispatch(setNavbarActive(""));
	}, []);
	return (
		<div className='w-full'>
			<Hero />
			<HowItWork />
			<HowSwapWork />
			<LaunchApp />
		</div>
	);
}
