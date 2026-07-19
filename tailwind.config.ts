import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
    	extend: {
    		boxShadow: {
    			sm: '0px 0px 12px rgba(255, 255, 255, 0.1)',
    			'custom-md': '0 4px 6px rgba(0, 0, 0, 0.15)',
    			'custom-lg': '0 10px 15px rgba(0, 0, 0, 0.2)',
    			'custom-xl': '0 20px 25px rgba(0, 0, 0, 0.25)',
    			'custom-inset': 'inset 0 4px 6px rgba(0, 0, 0, 0.1)',
    			custom: '0px 0px 3px 0px rgba(0,0,0,0.17)'
    		},
    		screens: {
    			ssm: '450px',
    			sm: '640px',
    			md: '768px',
    			md2: '896px',
    			lg: '1024px',
    			xl: '1280px',
    			xxl: '1600px'
    		},
    		colors: {
    			background: {
    				DEFAULT: 'hsl(var(--background))',
    				foreground: '#eeeeee',
    				background: '#515151',
    				white: '#FFFFFF',
    				whatsapp: {
    					user: 'hsl(169, 100%, 18%)',
    					from: 'hsl(0, 0%, 21%)'
    				}
    			},
    			foreground: 'hsl(var(--foreground))',
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			primary: {
    				'50': '#e9eff7',
    				'100': '#cdddeb',
    				'200': '#adcbe1',
    				'300': '#82b3d3',
    				'400': '#5c96c1',
    				'500': '#23518C',
    				'600': '#1e487d',
    				'700': '#1a3e6c',
    				'800': '#18355a',
    				'900': '#182f4d',
    				'950': '#111d33',
    				DEFAULT: '#23518C'
    			},
    			secondary: {
    				'50': '#eaf0fa',
    				'100': '#dce7f7',
    				'200': '#c4d7f2',
    				'300': '#a1bfee',
    				'400': '#7c9fee',
    				'500': '#306EBF',
    				'600': '#265cb7',
    				'700': '#204ca6',
    				'800': '#1e4088',
    				'900': '#1d396e',
    				'950': '#152445',
    				DEFAULT: '#306EBF'
    			},
    			accent: {
    				'50': '#f0f6fd',
    				'100': '#e1eefe',
    				'200': '#cce0fc',
    				'300': '#b0cffb',
    				'400': '#80B2F2',
    				'500': '#6ab0f9',
    				'600': '#50a0f6',
    				'700': '#3b8cf3',
    				'800': '#3474cf',
    				'900': '#3061a9',
    				'950': '#1d3b6a',
    				DEFAULT: '#80B2F2'
    			},
    			warning: {
    				'50': '#FFF8E6',
    				'100': '#FFE6C7',
    				'200': '#FFD7A8',
    				'300': '#FFCC80',
    				'400': '#FFB860',
    				'500': '#FBC248',
    				'600': '#E5A535',
    				'700': '#D18C22',
    				'800': '#BF721F',
    				'900': '#AB581B',
    				DEFAULT: '#FBC248'
    			},
    			danger: {
    				'50': '#FEF2F2',
    				'100': '#FEE2E2',
    				'200': '#FCD5D5',
    				'300': '#FCA5A5',
    				'400': '#F87171',
    				'500': '#EF4444',
    				'600': '#DC2626',
    				'700': '#B91C1C',
    				'800': '#991B1B',
    				'900': '#7F1D1D',
    				DEFAULT: '#B91C1C'
    			},
    			'black-white': {
    				DEFAULT: '#FFFFFF',
    				black: '#000000',
    				white: '#FFFFFF',
    				gray: '#CCCCCC'
    			},
    			neutrals: {
    				'50': '#F8F8F8',
    				'100': '#EFEFEF',
    				'200': '#E0E0E0',
    				'300': '#C8C8C8',
    				'400': '#B0B0B0',
    				'500': '#969696',
    				'600': '#7C7C7C',
    				'700': '#626262',
    				'800': '#484848',
    				'900': '#18303A',
    				DEFAULT: '#18303A'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			text: {
    				DEFAULT: 'hsl(var(--foreground))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			border: 'hsl(var(--border))',
    			input: {
    				DEFAULT: 'hsl(var(--input))',
    				background: 'hsl(var(--input-background))',
    				border: '#8a8a8a'
    			},
    			ring: 'hsl(var(--ring))',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			},
    			table: {
    				border: '#E6E6E6'
    			},
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			}
    		},
    		fontFamily: {
    			inter: [
    				'Inter',
    				'sans-serif'
    			]
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		}
    	}
    },
    plugins: [require("tailwindcss-animate")], // Adicione este plugin se ainda não o tiver
};

export default config;
