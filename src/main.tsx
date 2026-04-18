import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PropertiesProvider } from './context/PropertiesProvider'
import { bootstrapSupabaseEnv } from './lib/supabaseClient'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')!

void bootstrapSupabaseEnv().then(() => {
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <PropertiesProvider>
          <App />
        </PropertiesProvider>
      </BrowserRouter>
    </StrictMode>,
  )
})
