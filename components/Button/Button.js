import React from "react";

import classNames from "classnames";

const Button = ({
	id,
	children,
	className,
	onClick,
	disabled = false,
	variant = "primary",
	type = "button",
}) => {
	return (
		<button
			id={id}
			type={type}
			onClick={!disabled ? onClick : undefined}
			disabled={disabled}
			className={classNames(
				"inline-flex items-center justify-center rounded-sm px-5 py-2.5 md:py-3",
				"text-sm font-medium transition-colors focus:outline-none md:text-base",
				{
					// Primary variant
					"bg-accent-pink/20 text-accent-pink hover:bg-accent-pink/30 cursor-pointer":
						variant === "primary" && !disabled,
					"bg-accent-pink/20 cursor-not-allowed text-white":
						variant === "primary" && disabled,

					// Blue variant
					"bg-accent-blue/90 hover:bg-accent-blue cursor-pointer text-white":
						variant === "blue" && !disabled,
					"bg-accent-blue/40 !cursor-not-allowed text-white":
						variant === "blue" && disabled,

					// Secondary variant
					"bg-background hover:bg-surface hover:!border-surface cursor-pointer border":
						variant === "secondary" && !disabled,
					"bg-surface text-muted cursor-not-allowed":
						variant === "secondary" && disabled,
				},
				className
			)}
		>
			{children}
		</button>
	);
};

export default Button;
