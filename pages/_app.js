import "../styles/globals.css";
import Layout from "../layout/default";
import { Provider } from "react-redux";
import Store from "../store/store";
import "@rainbow-me/rainbowkit/styles.css";
import {
	getDefaultConfig,
	RainbowKitProvider,
	lightTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import Head from "next/head";

const helachain_mainnet = {
	id: 8668,
	name: "Helachain mainnet",
	iconBackground: "#fff",
	nativeCurrency: { name: "Hela", symbol: "HLUSD", decimals: 18 },
	rpcUrls: {
		default: { http: ["https://mainnet-rpc.helachain.com"] },
	},
	blockExplorers: {
		default: {
			name: "Helascan",
			url: "https://helascan.io/",
		},
	},
	testnet: false,
};

const config = getDefaultConfig({
	appName: "My RainbowKit App",
	projectId: "0e50ad124798913a4af212355f956d06",
	chains: [helachain_mainnet],
	ssr: true,
});

function MyApp({ Component, pageProps }) {
	const queryClient = new QueryClient();
	return (
		<Provider store={Store}>
			<Head>
				<meta charSet='UTF-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1.0' />
				<title>Tales of Gold & Glory</title>

				<meta name='title' content='Tales of Gold & Glory' />
				<meta name='description' content='Tales of Gold & Glory' />
			</Head>
			<ToastContainer />
			<WagmiProvider config={config}>
				<QueryClientProvider client={queryClient}>
					<RainbowKitProvider
						theme={lightTheme({
							accentColor: "#F5BE52",
							accentColorForeground: "#000000",
							borderRadius: "large",
							overlayBlur: "small",
						})}
						coolMode={true}
					>
						<Layout>
							<Component {...pageProps} />
						</Layout>
					</RainbowKitProvider>
				</QueryClientProvider>
			</WagmiProvider>
		</Provider>
	);
}

export default MyApp;
