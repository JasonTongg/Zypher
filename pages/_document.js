import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
	return (
		<Html lang='en'>
			<Head>
				<meta charset='UTF-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1.0' />

				<link rel='preconnect' href='https://fonts.googleapis.com' />
				<link rel='preconnect' href='https://fonts.gstatic.com' crossorigin />
				<link
					href='https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;1,300&family=Ubuntu:wght@300&display=swap'
					rel='stylesheet'
				/>
				<link rel='icon' href='./Image/uniswap2.png' />
				<title>Zypher</title>

				<meta name='title' content='Zypher' />
				<meta
					name='description'
					content='Easily provide or withdraw liquidity on Uniswap V2, V3, and V4. Perform efficient token swaps while we handle all the underlying complexity, ensuring a smooth and secure experience.'
				/>

				<meta property='og:type' content='website' />
				<meta property='og:title' content='Zypher' />
				<meta
					property='og:description'
					content='Easily provide or withdraw liquidity on Uniswap V2, V3, and V4. Perform efficient token swaps while we handle all the underlying complexity, ensuring a smooth and secure experience.'
				/>

				<meta name='twitter:card' content='summary_large_image' />
				<meta property='twitter:title' content='Zypher' />
				<meta
					property='twitter:description'
					content='Easily provide or withdraw liquidity on Uniswap V2, V3, and V4. Perform efficient token swaps while we handle all the underlying complexity, ensuring a smooth and secure experience.'
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
