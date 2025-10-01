# Tales of Gold & Glory

<p align="center">
  <a href="https://talesofgoldglory.com/">
    <img src="https://github.com/JasonTongg/Tales-of-gold-and-glory/blob/main/public/assets/Banner.jpg" alt="Tales of Gold & Glory" width="300"/>
  </a>
</p>

**Quest Available:**  
Brave adventurer, the King awaits your jokes!  
Test your humor, earn glory, and see if fortune favors you.

👉 **[Start Adventure Now](https://talesofgoldglory.com/)**

---

## What is Tales of Gold & Glory?

Tales of Gold & Glory is a web-based game built with the Next.js framework (React) where players amuse a king by submitting witty jokes. Each joke submission triggers a blockchain transaction (using the HLUSD stablecoin) and is automatically rated by an AI (via the OpenAI API). The app’s code is a Next.js project (Node.js) with a front-end UI and local data storage. To develop or customize this project, clone the repo and follow the instructions below. HLUSD (HeLa USD) is a stablecoin (≈ $1.00) used for on-chain fees, so the account you use must hold enough HLUSD tokens.

## Prerequisites

- Node.js 18.17.0+ – Next.js requires Node 18.17.0 or newer. Ensure you have a compatible Node.js LTS version installed.
- Package Manager – Use npm to install dependencies. Next.js includes scripts (e.g. npm run dev, npm run build, npm run start) in package.json.
- Blockchain Tokens – A funded account with HLUSD tokens on mainnet. The project uses your PRIVATE_KEY (below) to pay gas in HLUSD when submitting jokes, so this account must hold enough HLUSD.
- OpenAI API Key – An OPENAI_API_KEY is required for the AI joke-rating feature. Sign up on OpenAI to get an API key. This key is only used server-side to query the OpenAI API.

## Installation and Setup

- Clone the Repository:

```bash
  git clone https://github.com/JasonTongg/Tales-of-gold-and-glory.git
  cd Tales-of-gold-and-glory
```

- Install Dependencies:

```bash
  npm install

```

- Configure Environment Variables:

```bash
  cp .env.example .env
```

- Run the Dev Server:

```bash
  npm run dev
```

- Building for Production (optional):

```bash
  npm run build
  npm run start
```

## Environment Variables

The .env file (based on .env.example) must define the following variables:

- PRIVATE_KEY – The private key (in hex format) of an account on the blockchain. This account will pay gas (in HLUSD) when a user submits a joke. Important: This key grants control of the account, so keep it secret. Ensure this account holds sufficient HLUSD tokens on the Mainnet.
- NEXT_PUBLIC_TOKEN_CONTRACT – The address of the token contract on the blockchain (ERC-20 contract). The NEXT_PUBLIC prefix is required so that Next.js can bundle this variable into the client code. After build, process.env.NEXT_PUBLIC_TOKEN_CONTRACT will be inlined into the JavaScript sent to the browser.
- OPENAI_API_KEY – Your OpenAI API key for the AI joke-rating service. This key is used server-side to authenticate with the OpenAI API (not exposed to the browser).

For example, .env might look like:

```bash
RPC_URL=https://mainnet-rpc.helachain.com
PRIVATE_KEY=your_0x...
NEXT_PUBLIC_TOKEN_CONTRACT=0xAbC123...
OPENAI_API_KEY=sk-XXXX...
```

Make sure the NEXT_PUBLIC_TOKEN_CONTRACT value matches the correct contract address on the network. The NEXT_PUBLIC prefix ensures this address is accessible to front-end code as described in the Next.js docs.

## Project Structure

- public/assets/ – Static assets (images, icons, ttf, etc.) belong here. Any files in public/assets are served directly at the root path (e.g. public/assets/logo.png → /assets/logo.png). You can replace or add assets in this folder, but keep the same dimensions as the originals to avoid breaking the layout or responsive design. Next.js automatically serves everything under public/ as static files
- data/ – This directory holds persistent user data for the game (e.g. submitted jokes, scores, or other state). The app reads from and writes to files here to maintain game state. Do not manually edit these files unless you intend to reset or seed game data. Ensure your changes respect the JSON/data format expected by the code.
- Pages / App – The main application code is in the Next.js app/ (or pages/) directory. Routes are determined by file structure here. For example, app/page.tsx (or pages/index.js) is the home page. Familiarize yourself with Next.js routing if you need to add new pages or components.

## Running the Application

Once setup is complete:
Run the development server with npm run dev. By default it listens on port 3000.
Open http://localhost:3000 in a browser to play the game locally.
When submitting a joke, the app will use the configured PRIVATE_KEY to send the transaction. Check the browser console and terminal for any logs or errors.

## Assets and Customization

- Images: All images used in the UI are in public/assets/. To customize graphics (e.g. backgrounds, icons), replace the files here. Important: Maintain the same image sizes (width/height) to match the existing CSS and ensure responsiveness is not affected.
- Styling: The project likely includes CSS and Tailwind for layout. If you add or remove assets, you may also need to adjust styles accordingly.

## Smart Contract: ERC-20 Token

```bash
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract Token is ERC20, ERC20Burnable, ERC20Permit {
    using ECDSA for bytes32;

    mapping(address => uint256) public tokenNonces;
    mapping(address => bool) public isMinter;

    constructor(address recipient, address defaultAdmin, address minter)
        ERC20("Tales of Gold & Glory", "TGG")
        ERC20Permit("Tales of Gold & Glory")
    {
        _mint(recipient, 1_000_000 * 10 ** decimals());
        isMinter[defaultAdmin] = true;
        isMinter[minter] = true;
    }

    function mintWithSig(address to, uint256 amount, bytes calldata signature) external {
        uint256 nonce = tokenNonces[to];

        bytes32 msgHash = keccak256(abi.encodePacked(address(this), to, amount, nonce));

        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(msgHash);

        address signer = ethHash.recover(signature);
        require(isMinter[signer], "Invalid signature");

        tokenNonces[to]++;

        _mint(to, amount);
    }

    function mint(address to, uint256 amount) external {
        require(isMinter[msg.sender], "Not minter");
        _mint(to, amount);
    }
}
```

### Standards Used:

- ERC20: Standard fungible token interface.
- ERC20Burnable: Allows token holders to burn their tokens.
- ERC20Permit: Enables EIP-2612 permit() (gasless approvals via signatures).
- ECDSA & MessageHashUtils: Used for signature recovery and message hashing.

### Token Metadata

- Name: Tales of Gold & Glory (can be changed in constructor)
- Symbol: TGG (can be changed in constructor)
- Decimals: 18 (default from ERC20)
- Initial Supply: 1,000,000 TGG (minted to the recipient provided in constructor)

### Constructor Parameters

The constructor requires three addresses:

- recipient – Address that receives the initial 1,000,000 tokens.
- defaultAdmin – Address automatically assigned as a minter.
- minter – Another address granted minting rights at deployment.

### Roles & Permissions

- mint(address to, uint256 amount)
  - Only callable by an address with isMinter == true.
  - Mints amount tokens to to.
- mintWithSig(address to, uint256 amount, bytes signature)
  - Allows minting with an off-chain signature from a minter.
  - Steps:
    - Hash is generated from (contractAddress, to, amount, nonce).
    - Signature is verified against an authorized minter.
    - If valid, tokens are minted and nonce increments.

### Customization

If you fork this project, you can change:

- Token name & symbol → Edit constructor parameters.
- Initial supply & recipient → Adjust \_mint() in constructor.
- Minters → Pass different defaultAdmin and minter addresses when deploying.
- Additional minters → Update contract to include more addresses in isMinter.

## How to Deploy Using Remix IDE

You can deploy the ERC-20 contract directly on Remix IDE without extra tooling.

- Open Remix
  - Go to [Remix IDE](https://remix.ethereum.org) in your browser.
  - Make sure MetaMask (or another wallet) is installed and connected to Helachain Mainnet network.
- Create the Contract File
  - In Remix, create a new file
  ```bash
  contracts/Token.sol
  ```
  - Copy the entire Token.sol contract code into this file.
- Compiler Settings
  - In the Solidity Compiler tab:
    - Select 0.8.24 (must match the pragma).
    - Enable Auto Compile or click Compile Token.sol.
    - Click on Advanced Configuration and change EVM VERSION to homestead
- Deployment
  - Go to the Deploy & Run Transactions tab:
    - Environment: Choose Injected Provider – MetaMask.
    - Contract: Select Token.
    - Constructor Parameters: Fill in:
      - recipient → Wallet address that will receive initial supply.
      - defaultAdmin → Admin wallet (authorized minter).
      - minter → Another minter wallet.
    - Click Deploy and confirm in MetaMask.
- Verify Deployment
  - After deployment, you’ll see the contract under Deployed Contracts in Remix.
  - Expand it to test functions like name(), symbol(), totalSupply(), mint(), and mintWithSig().
- Configure Frontend
  - Copy the deployed contract address from Remix.
  - Add it to your .env
  ```bash
  NEXT_PUBLIC_TOKEN_CONTRACT=0xYourContractAddress
  ```

## Contributing

This project is open for forking. If you want to add features or fixes:

- Fork the repository to your own GitHub account and clone it locally.
- Create a new branch for your feature or fix (e.g. feature/add-scoreboard).
- Commit changes with clear messages. Follow any existing code style and naming conventions.
- Push and open a Pull Request against the main branch of the original repo. Describe what you changed and why.
