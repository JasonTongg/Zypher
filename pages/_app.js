import "../styles/globals.css";
import Layout from "../layout/default";
import { Provider } from "react-redux";
import Store from "../store/store";
import "@rainbow-me/rainbowkit/styles.css";
import {
	getDefaultConfig,
	RainbowKitProvider,
	darkTheme,
	lightTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const config = getDefaultConfig({
	appName: "My RainbowKit App",
	projectId: "0e50ad124798913a4af212355f956d06",
	chains: [sepolia],
	ssr: true,
});

// ⭐ Custom theme
const customTheme = {
	blurs: {
		modalOverlay: "6px",
	},
	colors: {
		accentColor: "#ff4c9a",
		accentColorForeground: "#FFFFFF",
		actionButtonBorder: "#dadada",
		actionButtonBorderMobile: "#dadada",
		actionButtonSecondaryBackground: "#efefd5",
		closeButton: "#5e6a5e",
		closeButtonBackground: "#ffffe3",
		connectButtonBackground: "#ff4c9a",
		connectButtonBackgroundError: "#ff4c9a",
		connectButtonInnerBackground: "#ff4c9a",
		connectButtonText: "#FFFFFF",
		connectButtonTextError: "#FFFFFF",
		connectionIndicator: "#26a17b",
		downloadBottomCardBackground: "#efefd5",
		downloadTopCardBackground: "#ffffe3",
		error: "#ff4c9a",
		generalBorder: "#dadada",
		generalBorderDim: "#adad9b",
		menuItemBackground: "#efefd5",
		modalBackdrop: "rgba(0, 0, 0, 0.75)",
		modalBackground: "#ffffe3",
		modalBorder: "#dadada",
		modalText: "#0e100e",
		modalTextDim: "#5e6a5e",
		modalTextSecondary: "#adad9b",
		profileAction: "#efefd5",
		profileActionHover: "#ff4c9a",
		profileForeground: "#ffffe3",
		selectedOptionBorder: "#ff4c9a",
		standby: "#ff4c9a",
	},
	fonts: {
		body: "",
	},
	radii: {
		actionButton: "4px",
		connectButton: "4px",
		menuButton: "4px",
		modal: "6px",
		modalMobile: "6px",
	},
	shadows: {
		connectButton: "",
		dialog: "0px 10px 20px rgba(0, 0, 0, 0.3)",
		profileDetailsAction: "0px 2px 5px rgba(0, 0, 0, 0.2)",
		selectedOption: "0px 0px 6px rgba(255, 0, 122, 0.6)",
		selectedWallet: "0px 0px 10px rgba(255, 0, 122, 0.8)",
		walletLogo: "0px 2px 4px rgba(0, 0, 0, 0.2)",
	},
};

function MyApp({ Component, pageProps }) {
	const queryClient = new QueryClient();
	return (
		<Provider store={Store}>
			<WagmiProvider config={config}>
				<QueryClientProvider client={queryClient}>
					<RainbowKitProvider theme={customTheme} coolMode={true}>
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
