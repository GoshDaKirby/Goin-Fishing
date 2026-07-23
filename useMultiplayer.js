import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import BackgroundMusic from '@/components/game/BackgroundMusic';
// Add page imports here
import Home from './pages/Home';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router basename={import.meta.env.BASE_URL}>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
        <BackgroundMusic />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
