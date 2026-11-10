/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      // En px: la letra no depende del rem de 14 px del html
      fontSize: {
        xs: ['11px', '15px'],
        sm: ['12px', '17px'],
        base: ['13px', '19px'],
        lg: ['15px', '21px'],
        xl: ['18px', '24px'],
        '2xl': ['24px', '30px'],
        '3xl': ['24px', '30px'],
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        cond: ['"IBM Plex Sans Condensed"', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      },
      colors: {
        'marco': 'var(--marco)',
        'marco-2': 'var(--marco-2)',
        'marco-texto': 'var(--marco-texto)',
        'marco-texto-2': 'var(--marco-texto-2)',
        'marco-linea': 'var(--marco-linea)',
        'marco-foco': 'var(--marco-foco)',
        'suelo': 'var(--suelo)',
        'panel': 'var(--panel)',
        'placa': 'var(--placa)',
        'panel-titulo': 'var(--panel-titulo)',
        'panel-titulo-texto': 'var(--panel-titulo-texto)',
        'barra-pantalla': 'var(--barra-pantalla)',
        'navegador': 'var(--navegador)',
        'fila-total': 'var(--fila-total)',
        'linea': 'var(--linea)',
        'linea-fila': 'var(--linea-fila)',
        'borde-campo': 'var(--borde-campo)',
        'texto': 'var(--texto)',
        'texto-2': 'var(--texto-2)',
        'accion': 'var(--accion)',
        'accion-texto': 'var(--accion-texto)',
        'accion-hover': 'var(--accion-hover)',
        'seleccion': 'var(--seleccion)',
        'rango': 'var(--rango)',
        'rango-fondo': 'var(--rango-fondo)',
        'estado-alta': 'var(--estado-alta)',
        'estado-alta-sobre': 'var(--estado-alta-sobre)',
        'estado-media': 'var(--estado-media)',
        'estado-baja': 'var(--estado-baja)',
        'estado-invalido': 'var(--estado-invalido)',
        'estado-contorno': 'var(--estado-contorno)',
        'eq-frio': 'var(--eq-frio)',
        'eq-desc': 'var(--eq-desc)',
        'eq-escurre': 'var(--eq-escurre)',
        'eq-escurre-borde': 'var(--eq-escurre-borde)',
        'eq-manual': 'var(--eq-manual)',
        'eq-sobre': 'var(--eq-sobre)',
        'eq-sobre-claro': 'var(--eq-sobre-claro)',
        brand: {
          DEFAULT: 'var(--brand)',
          foreground: 'var(--brand-foreground)'
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)'
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)'
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)'
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)'
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)'
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)'
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}
