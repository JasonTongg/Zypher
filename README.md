# Zypher

Zypher DEX is a next-generation DeFi interface that enables **liquidity management**, **token swaps**, and **portfolio insights** across Uniswap V2, V3, and V4 — all from a single seamless dashboard.
The platform simplifies complex LP workflows using automated range-strategy helpers, smart routing, token conversions, and real-time on-chain analytics.

**Live Product:** https://zypher-dex.vercel.app/

## Project Overview

Zypher provides a **unified and simplified experience** for interacting with Uniswap’s liquidity and swap systems across multiple versions.

Users can:

- Create & manage liquidity positions (V2, V3, V4)
- Swap tokens across optimized routes
- Track balances and LP positions

Zypher integrates custom liquidity logic with Uniswap’s routers and SDKs to deliver a smooth and powerful DeFi experience.

## Features

### **Liquidity**
- Add/remove liquidity for **Uniswap V2, V3, V4**
- Strategy-based price range helpers (V3)
- Auto-calculated optimal token ratios
- Fee APR estimation
  
### **Swaps**
- Token swaps across V2, V3, and V4 pools
- Smart routing for best price execution
- ETH ↔ Token & Token ↔ Token swaps

### **Tools**
- Token → ETH and ETH → Token converters
- Pool explorer

### **UI / UX**
- Connect wallet (MetaMask, WalletConnect, Coinbase)
- Responsive interface
- Smooth transitions & lightweight state management

## Tech Stack

**Frontend**
- Next.js  
- React  
- Tailwind CSS  
- Material UI

**Blockchain Interaction**
- Wagmi  
- Viem  
- RainbowKit

**State Management**
- Redux Toolkit  

## Getting Started

### **Prerequisites**
- Node.js v16+  
- Web3 wallet (MetaMask recommended)  
- Test tokens / ETH on supported networks  

## How It Works
**Swaps**
- User selects token pair
- Smart contract executes swap
- Tokens arrive instantly in wallet

**Liquidity**
- Select Uniswap version
- Input token amounts
- (V3) Set custom range or use automated strategy
- Approve + supply liquidity
- LP position becomes visible instantly in Portfolio

**Portfolio Sync**
- Fetches wallet balances via Viem
- Reads Uniswap positions on-chain

## Future Enhancements
- Multi-chain expansion (Base, Arbitrum, Optimism, Polygon)
- Full pool analytics dashboard
- Historical LP yield tracking
- Automated liquidity rebalancing bots
- One-click “Zap In / Zap Out” liquidity
- Fee collection automation

## Author  

**Jason Tong**  

- **Product:** [Zypher](https://zypher-dex.vercel.app/).
- **GitHub:** [JasonTongg](https://github.com/JasonTongg).
- **Linkedin:** [Jason Tong](https://www.linkedin.com/in/jason-tong-42600319a/).
