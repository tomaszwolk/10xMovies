// Enable dark mode immediately before any imports
document.documentElement.classList.add('dark');

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { http } from '@/lib/http'
import { setupAxiosInterceptors } from '@/lib/axios-interceptors'
import { Toaster } from '@/components/ui/sonner'
import './index.css'
import { router } from './router'

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Setup Axios interceptors for automatic token refresh
// The logout callback will be handled by AuthProvider
setupAxiosInterceptors(http, () => {
  // Clear tokens from localStorage
  localStorage.removeItem("myVOD_access_token");
  localStorage.removeItem("myVOD_refresh_token");
  // Redirect to login
  window.location.href = "/auth/login";
});


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
