import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // veya './App.css' sende hangisi varsa

ReactDOM.createRoot(document.getElementById('root')).render(
    // DİKKAT: <React.StrictMode> BURADAN SİLİNMİŞ OLMALI!
    <App />
)