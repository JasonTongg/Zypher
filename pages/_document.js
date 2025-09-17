// pages/_document.js
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
	return (
		<Html lang='en'>
			<Head>
				{/* Keep only things that must be in <head> of every document
            and never change per-page, e.g. fonts or favicons */}
				<link rel='preconnect' href='https://fonts.googleapis.com' />
				<link
					rel='preconnect'
					href='https://fonts.gstatic.com'
					crossOrigin=''
				/>
				<link
					href='https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;1,300&family=Ubuntu:wght@300&display=swap'
					rel='stylesheet'
				/>
				<link rel='icon' href='https://Domain/assets/Logo' />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
