import * as React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// Ultimate memory protection system
import './utils/memoryGuardian.js'

createRoot(document.getElementById('root')).render(
  <App />
)
