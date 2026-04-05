import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sl_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const authAPI = {
  registrar: (dados) => api.post('/auth/registrar', dados),
  login: (dados) => api.post('/auth/login', dados),
  me: () => api.get('/auth/me'),
}

export const musicasAPI = {
  criar: (dados) => api.post('/musicas', dados),
  listar: () => api.get('/musicas'),
  buscar: (id) => api.get(`/musicas/${id}`),
  atualizar: (id, dados) => api.put(`/musicas/${id}`, dados),
  deletar: (id) => api.delete(`/musicas/${id}`),
  status: (id) => api.get(`/musicas/${id}/status`),
  verificar: (id) => api.get(`/musicas/${id}/verificar`),
}

export const blockchainAPI = {
  network: () => api.get('/blockchain/network'),
  balance: () => api.get('/blockchain/balance'),
  health: () => api.get('/health'),
}
