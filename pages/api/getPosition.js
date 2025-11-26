// pages/api/getPosition.js
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { owner, pairAddress, protocolVersion } = req.body;

    if (!owner || !pairAddress || !protocolVersion) {
        return res.status(400).json({ error: "owner, pairAddress, and protocolVersion are required" });
    }

    const url = "https://interface.gateway.uniswap.org/v2/data.v1.DataApiService/GetPosition";
    const payload = {
        chainId: 11155111, // Sepolia
        owner,
        pairAddress,
        protocolVersion,
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                origin: "https://app.uniswap.org",
                referer: "https://app.uniswap.org/",
                accept: "*/*",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (err) {
        console.error("Fetch error:", err);
        res.status(500).json({ error: "Failed to fetch position" });
    }
}
