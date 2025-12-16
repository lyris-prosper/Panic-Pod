import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        danger: {
          DEFAULT: '#ef4444',
          dark: '#dc2626',
          glow: 'rgba(239, 68, 68, 0.5)',
        },
        safe: {
          DEFAULT: '#22c55e',
          dark: '#16a34a',
          glow: 'rgba(34, 197, 94, 0.5)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
        pod: {
          bg: '#0a0a0f',
          surface: '#131318',
          border: '#1f1f28',
          text: '#e4e4e7',
          muted: '#71717a',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        'scan-line': 'repeating-linear-gradient(0deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 1px, transparent 1px, transparent 2px)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-danger': 'pulse-danger 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 8s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-danger': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 40px rgba(239, 68, 68, 0.8)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
