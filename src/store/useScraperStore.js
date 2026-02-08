import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useScraperStore = create(
  persist(
    (set, get) => ({
      // Data
      products: [],
      history: [],
      
      // UI State
      isLoading: false,
      currentPage: 1,
      totalPages: 1,
      scrapedPages: 0,
      error: null,
      
      // Settings
      settings: {
        maxPages: 5,
        delay: 2000,
        autoScroll: true,
        includeImages: true,
      },
      
      // Actions
      setProducts: (products) => set({ products }),
      
      addProducts: (newProducts) => set((state) => ({
        products: [...state.products, ...newProducts]
      })),
      
      clearProducts: () => set({ products: [], scrapedPages: 0 }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      setPageInfo: (currentPage, totalPages) => set({ currentPage, totalPages }),
      
      incrementScrapedPages: () => set((state) => ({
        scrapedPages: state.scrapedPages + 1
      })),
      
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      
      saveToHistory: () => {
        const { products } = get()
        if (products.length === 0) return
        
        const historyEntry = {
          id: Date.now(),
          date: new Date().toISOString(),
          count: products.length,
          products: products,
        }
        
        set((state) => ({
          history: [historyEntry, ...state.history].slice(0, 10) // Keep last 10
        }))
      },
      
      loadFromHistory: (id) => {
        const { history } = get()
        const entry = history.find(h => h.id === id)
        if (entry) {
          set({ products: entry.products })
        }
      },
      
      deleteFromHistory: (id) => set((state) => ({
        history: state.history.filter(h => h.id !== id)
      })),
    }),
    {
      name: 'shopee-scraper-storage',
      partialize: (state) => ({ 
        history: state.history,
        settings: state.settings,
      }),
    }
  )
)
