import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './gig-poster.css'
import App from './App.tsx'
import { registerSW } from './utils/serviceWorker'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for caching
if (import.meta.env.PROD) {
  registerSW();
}
