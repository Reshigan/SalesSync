import api from './api'

export const brandService = {
  getBrands: async () => {
    return api.get('/brands')
  },

  getBrand: async (id: string) => {
    return api.get(`/brands/${id}`)
  },

  createBrand: async (data: any) => {
    return api.post('/brands', data)
  },

  updateBrand: async (id: string, data: any) => {
    return api.put(`/brands/${id}`, data)
  },

  deleteBrand: async (id: string) => {
    return api.delete(`/brands/${id}`)
  }
}
