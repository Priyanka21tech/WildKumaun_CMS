/**
 * Wild Kumaon — Tailwind theme (v3 config form).
 *
 * Derived from the live site's applied styles, not from framework defaults.
 * See design/design-tokens.md for provenance of every value; see
 * design/theme.css for the Tailwind v4 `@theme` equivalent.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx,html}'],
  theme: {
    // The site's real content width is Elementor's 1140px boxed container.
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', md: '2rem' },
      screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1140px', '2xl': '1140px' },
    },

    screens: {
      // Elementor's own breakpoints: mobile ≤767, tablet 768–1024, desktop ≥1025.
      sm: '640px',
      md: '768px',
      lg: '1025px',
      xl: '1200px',
    },

    extend: {
      colors: {
        brand: {
          DEFAULT: '#DCB415', // button fill at rest
          bright: '#FFD014',  // button fill on hover, highlight text
          amber: '#F2B01E',
          bronze: '#B59753',  // button border on hover
          50: '#FEFAE8',
          100: '#FDF3C4',
          200: '#FBE78B',
          300: '#F8D84F',
          400: '#FFD014',
          500: '#DCB415',
          600: '#F2B01E',
          700: '#B59753',
          800: '#8A7226',
          900: '#5C4B18',
        },
        ink: {
          DEFAULT: '#070707', // headings
          soft: '#272727',    // sub-headings, strong body
          deep: '#030C10',    // darkest headings / overlays
        },
        body: {
          DEFAULT: '#3A3A3A',
          muted: '#7A7A7A',
          light: '#999999',
        },
        paper: {
          DEFAULT: '#FFFFFF',
          off: '#FCFCFC',
        },
        surface: {
          DEFAULT: '#F4F4F4', // alternating section
          warm: '#FAF5F1',    // warm alternating section
          dark: '#11202A',    // dark slate section / footer
          black: '#070707',   // full-black section
        },
        rule: {
          DEFAULT: '#EAEAEA',
          strong: '#DDDDDD',
        },
        'on-dark': {
          DEFAULT: '#FFF9F9',                    // warm white over photography
          dim: 'rgba(255, 249, 249, 0.15)',
        },
        scrim: {
          DEFAULT: 'rgba(26, 8, 8, 0.44)',       // hero image overlay
          soft: 'rgba(8, 7, 7, 0.39)',
        },
        link: {
          DEFAULT: '#0274BE',
          bright: '#1085E4',
        },
        lime: '#D2DF64',
        danger: '#D9534F',
      },

      fontFamily: {
        sans: ['"Open Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        roboto: ['Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"GFS Didot"', 'Georgia', 'serif'],
        script: ['Sevillana', 'cursive'],
        slab: ['"Roboto Slab"', 'Georgia', 'serif'],
      },

      fontSize: {
        // Applied sizes from the live site, paired with their line heights.
        small: ['0.9375rem', { lineHeight: '1.7' }],   // 15px
        base: ['1rem', { lineHeight: '1.7' }],         // 16px
        'body-lg': ['1.125rem', { lineHeight: '1.7' }],// 18px
        lead: ['1.25rem', { lineHeight: '1.6' }],      // 20px
        h6: ['1.3125rem', { lineHeight: '1.35' }],     // 21px
        h5: ['1.5rem', { lineHeight: '1.3' }],         // 24px
        h4: ['1.625rem', { lineHeight: '1.25' }],      // 26px
        'h3-alt': ['1.875rem', { lineHeight: '1.25' }],// 30px
        h3: ['2.0625rem', { lineHeight: '1.2' }],      // 33px
        h2: ['2.1875rem', { lineHeight: '1.2' }],      // 35px
        'h2-alt': ['2.25rem', { lineHeight: '1.2' }],  // 36px
        h1: ['2.375rem', { lineHeight: '1.15' }],      // 38px
        display: ['2.625rem', { lineHeight: '1.1' }],  // 42px
      },

      fontWeight: {
        body: '400',
        button: '500',
        heading: '600',
      },

      lineHeight: {
        body: '1.7',
        heading: '1.2',
        tight: '1',
      },

      maxWidth: {
        container: '1140px',
        wide: '1200px',
        narrow: '1024px',
        measure: '68ch',
      },

      borderRadius: {
        brand: '10px', // the radius the site puts on its own buttons
      },

      transitionDuration: {
        button: '300ms',
      },

      boxShadow: {
        card: '0 2px 12px rgba(7, 7, 7, 0.08)',
      },
    },
  },
  plugins: [],
}
