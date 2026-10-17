import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router'
import { router } from './routes/router'
import { Toaster as HotToaster } from "react-hot-toast";
import ConfirmDialog from "./components/Ui/ConfirmDialog";

createRoot(document.getElementById('root')!).render(
  
  <StrictMode>
    <HotToaster
      toastOptions={{
        className: "!bg-white !text-gray-900 dark:!bg-gray-800 dark:!text-gray-100 !shadow-lg",
        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
        },
      }}
    />

    <ConfirmDialog />

    <RouterProvider router={router} />
  </StrictMode>,
)
