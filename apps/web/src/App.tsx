import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { ProductsPage } from '@/pages/ProductsPage'
import { WamLandingPage } from '@/pages/WamLandingPage'
import { OpsPage } from '@/pages/ops/OpsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/produits" element={<ProductsPage />} />
        <Route path="/produits/whatsapp-manager" element={<WamLandingPage />} />
        <Route path="/ops" element={<OpsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
