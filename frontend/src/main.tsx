import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Clean up stale PWA service workers left from earlier PWA experiment
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister())
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
