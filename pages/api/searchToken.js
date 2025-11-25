// pages/api/searchToken.js
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { tokenAddress } = req.body;
    if (!tokenAddress) {
        return res.status(400).json({ error: "tokenAddress is required" });
    }

    const url = "https://interface.gateway.uniswap.org/v2/Search.v1.SearchService/SearchTokens";
    const payload = {
        searchQuery: tokenAddress,
        chainIds: [11155111], // Sepolia
        searchType: "TOKEN",
        page: 1,
        size: 15,
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Origin: "https://app.uniswap.org",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (err) {
        console.error("Fetch error:", err);
        return res.status(500).json({ error: "Failed to search token" });
    }
}
