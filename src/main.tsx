import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StoreConfigProvider } from './contexts/StoreConfigContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreConfigProvider>
      <App />
    </StoreConfigProvider>
  </StrictMode>,
)
