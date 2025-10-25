import * as React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// Memory guardian disabled - was causing page refreshes
// import './utils/memoryGuardian.js'

createRoot(document.getElementById('root')).render(
  <App />
)
