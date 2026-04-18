import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PropertiesProvider } from './context/PropertiesProvider'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PropertiesProvider>
        <App />
      </PropertiesProvider>
    </BrowserRouter>
  </StrictMode>,
)
