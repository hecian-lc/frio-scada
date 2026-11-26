import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './lib/theme'
import { Toaster } from 'sonner'
import App from './App'
import '@fontsource/barlow-condensed/500.css'   // títulos, barra y bandas de panel (marca HECIAN LC v0.1.0)
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './marca/colores.css'          // HECIAN LC marca v0.1.0: antes que los tokens, que la conectan con el portal
import './marca/hecian-botones.css'
import './hmi/tokens.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// PWA: registrar el service worker (instalable + shell offline)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* PWA opcional */ })
  })
}
