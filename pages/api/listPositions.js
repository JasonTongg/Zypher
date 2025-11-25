// pages/api/listPositions.js
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { address } = req.body;
    if (!address) {
        return res.status(400).json({ error: "Address is required" });
    }

    const url = "https://interface.gateway.uniswap.org/v2/data.v1.DataApiService/ListPositions";
    const payload = {
        address,
        chainIds: [11155111], // Sepolia
        includeHidden: true,
        pageSize: 25,
        pageToken: "",
        positionStatuses: [
            "POSITION_STATUS_IN_RANGE",
            "POSITION_STATUS_OUT_OF_RANGE",
        ],
        protocolVersions: [
            "PROTOCOL_VERSION_V4",
            "PROTOCOL_VERSION_V3",
            "PROTOCOL_VERSION_V2",
        ],
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
        res.status(500).json({ error: "Failed to fetch positions" });
    }
}
