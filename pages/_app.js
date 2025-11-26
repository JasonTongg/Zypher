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
const customTheme = lightTheme({
	accentColor: "#FF007A",
	accentColorForeground: "#FFFFE3",

	actionButtonBorder: "#FF007A",
	actionButtonBorderMobile: "#FF007A",
	actionButtonSecondaryBackground: "#FFFFE3",

	closeButton: "#FF007A",
	closeButtonBackground: "#FFFFE3",

	connectButtonBackground: "#FF007A",
	connectButtonBackgroundError: "#FC4A71",
	connectButtonInnerBackground: "#FF2A90",
	connectButtonText: "#FFFFE3",
	connectButtonTextError: "#FFFFE3",

	connectionIndicator: "#31DBB1",

	downloadBottomCardBackground: "#FFFFE3",
	downloadTopCardBackground: "#FFF6D5",

	error: "#FC4A71",

	generalBorder: "#FF007A",
	generalBorderDim: "#FF7FBF",

	menuItemBackground: "#FFFFE3",
	modalBackdrop: "rgba(0, 0, 0, 0.4)",

	modalBackground: "#FFFFE3",
	modalBorder: "#FF007A",

	modalText: "#000000",
	modalTextDim: "#4a4a4a",
	modalTextSecondary: "#6a6a6a",

	profileAction: "#FFF0D5",
	profileActionHover: "#FFE3BC",
	profileForeground: "#FFFFE3",

	selectedOptionBorder: "#FF007A",
	standby: "#FFDC30",
});

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
