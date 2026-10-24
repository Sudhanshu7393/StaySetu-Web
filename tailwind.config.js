/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // StaySetu Brand Rose / Coral (matching the logo text "Setu" & window panes)
                brand: {
                    50: '#fff1f2',
                    100: '#ffe4e6',
                    200: '#fecdd3',
                    300: '#fda4af',
                    400: '#fb7185',
                    500: '#f43f5e',
                    600: '#e11d48',
                    700: '#be123c',
                    800: '#9f1239',
                    900: '#881337',
                },
                // Primary maps to brand rose
                primary: {
                    50: '#fff1f2',
                    100: '#ffe4e6',
                    200: '#fecdd3',
                    300: '#fda4af',
                    400: '#fb7185',
                    500: '#f43f5e',
                    600: '#e11d48',
                    700: '#be123c',
                    800: '#9f1239',
                    900: '#881337',
                },
                // Plum backward compatibility mapped to brand rose
                plum: {
                    50: '#fff1f2',
                    100: '#ffe4e6',
                    200: '#fecdd3',
                    300: '#fda4af',
                    400: '#fb7185',
                    500: '#f43f5e',
                    600: '#e11d48',
                    700: '#be123c',
                    800: '#9f1239',
                    900: '#881337',
                },
                // Charcoal Black (matching the logo house roof & "Stay" text)
                charcoal: {
                    800: '#27272a',
                    900: '#18181b',
                    950: '#09090b',
                },
                surface: '#FAFAFA',
                'surface-2': '#F4F4F5',
                'nav-surface': '#FFFFFF',
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
                '4xl': '2rem',
            },
            boxShadow: {
                'card': '0 4px 20px -2px rgba(24, 24, 27, 0.05), 0 2px 6px -1px rgba(24, 24, 27, 0.02)',
                'card-hover': '0 20px 35px -8px rgba(24, 24, 27, 0.1), 0 8px 12px -4px rgba(24, 24, 27, 0.04)',
                'capsule': '0 20px 40px -15px rgba(0, 0, 0, 0.25), 0 0 1px rgba(0, 0, 0, 0.2)',
                'glow-rose': '0 10px 25px -5px rgba(225, 29, 72, 0.35)',
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
                heading: ['Outfit', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
