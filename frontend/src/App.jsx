import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Registrar from './pages/Registrar'
import Verificar from './pages/Verificar'
import Auth from './pages/Auth'
import AdminGuard from './pages/admin/AdminGuard'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminVouchers from './pages/admin/AdminVouchers'
import AdminClientes from './pages/admin/AdminClientes'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/registrar" element={<Registrar />} />
          <Route path="/verificar" element={<Verificar />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/cadastro" element={<Auth />} />
          <Route path="/admin" element={<AdminGuard />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="vouchers" element={<AdminVouchers />} />
            <Route path="clientes" element={<AdminClientes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
