import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
    darkMode: 'class',
    content: [
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    50: '#ECFDF5',
                    100: '#D1FAE5',
                    200: '#A7F3D0',
                    300: '#6EE7B7',
                    400: '#34D399',
                    500: '#059669', // More vivid Emerald
                    600: '#059669',
                    700: '#047857',
                    800: '#065F46',
                    900: '#064E3B',
                    DEFAULT: '#059669',
                    foreground: '#FFFFFF',
                },
                secondary: {
                    50: '#ECFDF5',
                    100: '#D1FAE5',
                    200: '#A7F3D0',
                    300: '#6EE7B7',
                    400: '#34D399',
                    500: '#10B981',
                    600: '#059669',
                    700: '#047857',
                    800: '#065F46',
                    900: '#064E3B',
                    DEFAULT: '#10B981',
                    foreground: '#FFFFFF',
                },
                accent: {
                    50: '#F0FDFA',
                    100: '#CCFBF1',
                    200: '#99F6E4',
                    300: '#5EEAD4',
                    400: '#2DD4BF',
                    500: '#0D9488', // More vivid Teal
                    600: '#0D9488',
                    700: '#0F766E',
                    800: '#115E59',
                    900: '#134E4A',
                    DEFAULT: '#0D9488',
                    foreground: '#FFFFFF',
                },
                accent2: {
                    50: '#FDF2F8',
                    100: '#FCE7F3',
                    200: '#FBCFE8',
                    300: '#F9A8D4',
                    400: '#F472B6',
                    500: '#EC4899',
                    600: '#DB2777',
                    700: '#BE185D',
                    800: '#9D174D',
                    900: '#831843',
                    DEFAULT: '#F472B6',
                },
                sidebar: {
                    DEFAULT: '#064E3B', // Deep Emerald
                    hover: '#065F46',
                    active: '#059669', // Vivid Emerald
                },
                destructive: {
                    DEFAULT: '#DC2626',
                    foreground: '#FFFFFF',
                },
                muted: {
                    DEFAULT: '#F3F4F6',
                    foreground: '#6B7280',
                },
                popover: {
                    DEFAULT: '#FFFFFF',
                    foreground: '#030712',
                },
                card: {
                    DEFAULT: '#FFFFFF',
                    foreground: '#030712',
                },
                success: {
                    DEFAULT: '#10B981',
                    foreground: '#FFFFFF',
                },
                warning: {
                    DEFAULT: '#F59E0B',
                    foreground: '#FFFFFF',
                },
                error: {
                    DEFAULT: '#EF4444',
                    foreground: '#FFFFFF',
                },
                info: {
                    DEFAULT: '#3B82F6',
                    foreground: '#FFFFFF',
                },
            },
            borderRadius: {
                lg: '0.75rem',
                md: 'calc(0.75rem - 2px)',
                sm: 'calc(0.75rem - 4px)',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
                'slide-in': {
                    from: { transform: 'translateX(-100%)' },
                    to: { transform: 'translateX(0)' },
                },
                'slide-out': {
                    from: { transform: 'translateX(0)' },
                    to: { transform: 'translateX(-100%)' },
                },
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'slide-up': {
                    from: { opacity: '0', transform: 'translateY(10px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                spin: {
                    to: { transform: 'rotate(360deg)' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'slide-in': 'slide-in 0.3s ease-out',
                'slide-out': 'slide-out 0.3s ease-out',
                'fade-in': 'fade-in 0.3s ease-in-out',
                'slide-up': 'slide-up 0.3s ease-out',
                spin: 'spin 1s linear infinite',
            },
        },
    },
    plugins: [tailwindcssAnimate],
};

export default config;
