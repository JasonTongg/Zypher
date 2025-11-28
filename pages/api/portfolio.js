// pages/api/portfolio.js
export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { address } = req.body;

	if (!address) {
		return res.status(400).json({ error: "Address is required" });
	}

	const url =
		"https://interface.gateway.uniswap.org/v2/data.v1.DataApiService/GetPortfolio";
	const payload = {
		chainIds: [11155111],
		modifier: {
			address: address,
			includeUnverifiedAssets: true,
		},
		walletAccount: {
			platformAddresses: [
				{
					address: address,
				},
			],
		},
	};

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				origin: "https://app.uniswap.org",
				referer: "https://app.uniswap.org/",
				accept: "*/*",
				"sec-fetch-site": "same-site",
				"sec-fetch-mode": "cors",
			},
			body: JSON.stringify(payload),
		});

		const data = await response.json();
		return res.status(200).json(data);
	} catch (err) {
		console.error("Fetch error:", err);
		return res.status(500).json({ error: "Failed to fetch portfolio" });
	}
}
