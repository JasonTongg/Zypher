/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**", // allow every domain
			},
		],
	},
};

export default nextConfig;
