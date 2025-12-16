# Panic Pod - Cross-Chain Emergency Evacuation

> One Click, All Chains, Safe Exit

A Web3 application for emergency evacuation of crypto assets across Bitcoin, Ethereum, and Solana chains, powered by ZetaChain's cross-chain technology.

## Features

- 🚀 **One-Click Evacuation**: Simultaneously evacuate BTC, ETH, and SOL assets
- 🔗 **Cross-Chain**: Powered by ZetaChain for seamless cross-chain operations
- 🤖 **AI-Powered**: Configure custom triggers using natural language
- ⚡ **Real-Time**: Live execution status with detailed progress tracking
- 🎨 **Modern UI**: Sci-fi inspired emergency pod interface with HUD elements

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Fonts**: Orbitron (display) + IBM Plex Mono (body)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Panic-Pod
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Application Flow

### 1. Landing Page
- Hero section with project introduction
- "Connect Wallet" button (mock implementation)
- Auto-redirect to dashboard after connection

### 2. Dashboard
- **Asset Overview**: Real-time portfolio value and asset cards for BTC, ETH, SOL
- **Strategy Configuration**: Set safe addresses and AI-powered trigger conditions
- **Emergency Controls**: Configure strategy or trigger PANIC evacuation

### 3. Execute Page
- **Real-time Status**: Live execution progress for all three chains
- **Step Tracking**: Detailed step-by-step progress (Approve → Swap → Bridge)
- **Execution Log**: Timestamped log of all operations
- **Summary**: Complete evacuation summary with total value, gas spent, and time taken

## Features in Detail

### Mock Implementation

Currently, the following features use mock data:
- Wallet connection (simulated with OKX Wallet)
- Asset balances and prices
- AI parsing (returns pre-configured results)
- Execution progress (simulated with timeouts)

### Strategy Configuration

Configure your evacuation strategy with:
- **Safe Addresses**:
  - BTC Safe Address (required)
  - EVM Safe Address (optional, defaults to USDC on ZetaChain)
  - Solana Safe Address (optional, defaults to USDC on ZetaChain)

- **AI Trigger**:
  - Natural language input: "If ETH drops below $2000 or BTC drops below $40000"
  - Automatic parsing into executable conditions
  - Visual execution plan preview

### Execution Simulation

The execute page simulates a full evacuation:
1. **BTC**: Direct transfer to safe address
2. **ETH**: Approve → Swap to USDC → Bridge to ZetaChain
3. **SOL**: Approve → Swap to USDC → Bridge to ZetaChain

All executions run in parallel with realistic timing and visual feedback.

## Design System

### Colors
- **Danger Red**: `#ef4444` - Emergency/panic elements
- **Safe Green**: `#22c55e` - Success/safe states
- **Warning Amber**: `#f59e0b` - Processing/attention
- **Pod Background**: `#0a0a0f` - Main background
- **Pod Surface**: `#131318` - Card backgrounds

### Typography
- **Display (Orbitron)**: Headers, titles, numbers
- **Mono (IBM Plex Mono)**: Body text, data, addresses

### Visual Effects
- Scan lines and grid patterns
- Glow effects on critical elements
- Pulse animations for active states
- HUD corner decorations
- Glass morphism panels

## Project Structure

```
Panic-Pod/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Dashboard page
│   ├── execute/           # Execute page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard-specific components
│   ├── execute/          # Execute page components
│   └── layout/           # Layout components
├── store/                # Zustand state management
├── types/                # TypeScript type definitions
├── lib/                  # Utilities and mock data
└── public/               # Static assets
```

## Future Enhancements

- [ ] Real wallet integration (OKX Wallet SDK)
- [ ] Live price feeds (CoinGecko/CoinMarketCap API)
- [ ] Real AI parsing (OpenAI/Claude API)
- [ ] ZetaChain smart contract integration
- [ ] Transaction signing and broadcasting
- [ ] Historical execution records
- [ ] Mobile responsive optimization
- [ ] Multi-language support

## License

MIT

---

**⚠️ Disclaimer**: This is a prototype application with mock implementations. Do not use with real funds without proper testing and auditing.
