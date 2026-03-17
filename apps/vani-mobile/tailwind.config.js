/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./app/**/*.{js,jsx,ts,tsx}",
		"./components/**/*.{js,jsx,ts,tsx}",
	],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			colors: {
				// Brand Colors - Warm Amber/Orange
				brand: {
					primary: '#F59E0B',         // Amber-500
					'primary-light': '#FCD34D', // Amber-300
					'primary-dark': '#D97706',  // Amber-600
					secondary: '#FB923C',       // Orange-400
					'secondary-light': '#FED7AA', // Orange-200
					'secondary-dark': '#EA580C',  // Orange-600
				},
				// Dark theme backgrounds
				dark: {
					bg: '#0a0a0a',              // neutral-950
					'bg-secondary': '#171717',  // neutral-900
					'bg-tertiary': '#262626',   // neutral-800
					card: '#171717',
					border: '#404040',          // neutral-700
				},
			},
		},
	},
	plugins: [],
}