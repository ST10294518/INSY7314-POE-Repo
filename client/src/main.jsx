// Documentation references added during final review (9 November 2026).
// REACT: https://react.dev/reference/react
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
