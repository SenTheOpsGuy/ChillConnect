import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { Toaster } from 'react-hot-toast'

import App from './App'
import { store } from './store/store'
import './index.css'

const paypalOptions = {
  "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "",
  currency: "INR",
  intent: "capture"
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <PayPalScriptProvider options={paypalOptions}>
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </PayPalScriptProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)