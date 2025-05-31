import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Versión temporal SIN StrictMode para debugging
// StrictMode causa doble renderizado que puede interferir con OpenLayers
createRoot(document.getElementById('root')).render(
  <App />
)