import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HeroUIProvider } from '@heroui/react'
import { ThemeProvider } from './components/ThemeProvider'
import { ShopProvider } from './context/ShopContext'
import App from './App'
import './index.css'

const rootElement = document.getElementById('root')
createRoot(rootElement).render(
  <React.StrictMode>
    <HeroUIProvider defaultTheme="light" storageKey="heroui-theme">
      <ThemeProvider>
        <ShopProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ShopProvider>
      </ThemeProvider>
    </HeroUIProvider>
  </React.StrictMode>
)


