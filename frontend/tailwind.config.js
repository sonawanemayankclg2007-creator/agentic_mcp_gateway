/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#08070f',
        surface: '#12101c',
        'surface-2': '#1c1929',
        accent: '#8B5CF6',
        'accent-deep': '#5B21B6',
        'accent-light': '#C4B5FD',
        border: '#DDD6FE',
        'border-dim': 'rgba(99, 102, 241, 0.18)',
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        'text-primary': '#F4F4F5',
        'text-muted': '#94A3B8',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(139, 92, 246, 0.45)',
        'glow-sm': '0 0 24px -8px rgba(139, 92, 246, 0.35)',
        panel: '0 24px 48px -12px rgba(0, 0, 0, 0.55)',
      },
      animation: {
        'pulse-dot': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.45s ease-out',
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        shimmer: 'shimmer 2.2s linear infinite',
        float: 'float 5s ease-in-out infinite',
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
        'scale-in': 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'gradient-shift': 'gradientShift 18s ease infinite',
        'border-glow': 'borderGlow 5s linear infinite',
        wiggle: 'wiggle 0.38s ease-in-out',
        breathe: 'breathe 4s ease-in-out infinite',
        'soft-pulse': 'softPulse 2.5s ease-in-out infinite',
        marquee: 'marquee 14s linear infinite',
        'drawer-in': 'drawerIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(14px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.65', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.15)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        borderGlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        wiggle: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-5px)' },
          '40%': { transform: 'translateX(5px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        softPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(139, 92, 246, 0.25)' },
          '50%': { boxShadow: '0 0 28px 2px rgba(139, 92, 246, 0.15)' },
        },
        marquee: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        drawerIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
