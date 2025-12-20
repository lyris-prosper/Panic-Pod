# Panic Pod - Cross-Chain Emergency Evacuation

> One Click, All Chains, Safe Exit

A Web3 application for emergency evacuation of crypto assets across Bitcoin, Ethereum (multi-chain), and ZetaChain, powered by ZetaChain's cross-chain technology.

## Features

- 🚀 **One-Click Evacuation**: Simultaneously evacuate BTC, ETH (Sepolia, Base, Linea), and ZETA assets
- 🔗 **Cross-Chain**: Powered by ZetaChain for seamless cross-chain operations
- 🤖 **AI-Powered**: Configure custom triggers using natural language (Qwen API)
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
- **Asset Overview**: Real-time portfolio value and asset cards for BTC, ETH (multi-chain), ZETA
- **Manual Refresh**: User-controlled balance refresh (improved UX)
- **Strategy Configuration**: Set safe addresses and AI-powered trigger conditions
- **Emergency Controls**: Configure strategy or trigger PANIC evacuation

### 3. Execute Page
- **Real-time Status**: Live execution progress for all three chains
- **Step Tracking**: Detailed step-by-step progress (Approve → Swap → Bridge)
- **Execution Log**: Timestamped log of all operations
- **Summary**: Complete evacuation summary with total value, gas spent, and time taken

## Features in Detail

### Real & Mock Implementation

**Real Features:**
- Real wallet balances via RPC calls (Bitcoin, Ethereum testnets, ZetaChain)
- Real-time price feeds via CoinGecko API
- Real AI parsing using Qwen API (Alibaba Cloud)
- Manual balance refresh for better UX

**Mock Features:**
- Execution progress (simulated with timeouts)
- Transaction broadcasting (not yet implemented)

### Strategy Configuration

Configure your evacuation strategy with:
- **Safe Addresses**:
  - BTC Safe Address (required)
  - EVM Safe Address (optional, defaults to USDC on ZetaChain)

- **AI Trigger (Qwen API)**:
  - Natural language input: "If ETH drops below $2000 or BTC drops below $40000"
  - Automatic parsing into executable conditions (AND/OR logic)
  - Visual execution plan preview with asset-specific strategies

### Execution Simulation

The execute page simulates a full evacuation:
1. **BTC**: Direct transfer to safe address
2. **ETH**: Approve → Swap to USDC → Bridge to ZetaChain
3. **ZETA**: Process assets → Send to safe address

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

## Environment Variables

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_QWEN_API_KEY=your_qwen_api_key_here
```

Get your Qwen API key from [Alibaba Cloud DashScope](https://dashscope.aliyun.com/).

## Future Enhancements

- [x] Real wallet balance fetching
- [x] Live price feeds (CoinGecko API)
- [x] Real AI parsing (Qwen API)
- [x] Manual balance refresh
- [ ] ZetaChain smart contract integration
- [ ] Transaction signing and broadcasting
- [ ] Historical execution records
- [ ] Mobile responsive optimization
- [ ] Multi-language support

## License

MIT

---

**⚠️ Disclaimer**: This is a prototype application with mock implementations. Do not use with real funds without proper testing and auditing.
