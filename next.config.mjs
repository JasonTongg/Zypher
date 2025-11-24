/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		esmExternals: "loose", // <-- fixes CJS inside ESM import mismatch
	},
	webpack: (config) => {
		config.module.rules.push({
			test: /@vanilla-extract\/sprinkles/,
			type: "javascript/auto", // <-- force CJS mode
		});

		return config;
	},
};

export default nextConfig;
