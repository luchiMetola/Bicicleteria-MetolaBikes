import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google' // <--- NUEVO IMPORT

// REEMPLAZÁ ESTO POR TU ID DE CLIENTE REAL
const GOOGLE_CLIENT_ID = "484477705574-o568rp2oru74m9bslul7oi88s92j6scp.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Envolvemos la App con el proveedor de Google */}
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)