import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HeroUIProvider } from '@heroui/react'
import { ThemeProvider } from './components/ThemeProvider'
import { ShopProvider } from './context/ShopContext'
import { UserProvider } from './context/UserContext'
import App from './App'
import './index.css'

const rootElement = document.getElementById('root')
createRoot(rootElement).render(
  <React.StrictMode>
    <HeroUIProvider>
      <ThemeProvider>
        <ShopProvider>
          <UserProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <App />
            </BrowserRouter>
          </UserProvider>
        </ShopProvider>
      </ThemeProvider>
    </HeroUIProvider>
  </React.StrictMode>
)


