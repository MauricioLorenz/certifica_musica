import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sl_user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('sl_token') || null)

  const login = (userData, tokenData) => {
    setUser(userData)
    setToken(tokenData)
    localStorage.setItem('sl_user', JSON.stringify(userData))
    localStorage.setItem('sl_token', tokenData)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('sl_user')
    localStorage.removeItem('sl_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuth: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
