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
      
<<<<<<< HEAD
=======
      // Pagination State
      itemsPerPage: 20,
      currentDataPage: 1,
      totalDataPages: 1,
      
>>>>>>> testing
      // Settings
      settings: {
        maxPages: 5,
        delay: 2000,
        autoScroll: true,
        includeImages: true,
<<<<<<< HEAD
      },
      
      // Actions
      setProducts: (products) => set({ products }),
      
      addProducts: (newProducts) => set((state) => ({
        products: [...state.products, ...newProducts]
      })),
=======
        // Proxy settings
        useProxy: false,
        maxRequestsPerProxy: 40,
        rotationStrategy: 'round-robin', // 'round-robin', 'random', 'least-used'
        randomizeDelay: true,
        minDelay: 2000,
        maxDelay: 5000,
        randomizeHeaders: true,
        autoRotateOnBan: true,
      },
      
      // Proxy management
      proxies: [],
      activeProxy: null,
      proxyStats: null,
      banDetected: false,
      lastBanReason: null,
      
      // Actions
      setProducts: (products) => set((state) => {
        const totalDataPages = products.length > 0 
          ? Math.ceil(products.length / state.itemsPerPage)
          : 1;
        return {
          products,
          totalDataPages,
          currentDataPage: 1
        };
      }),
      
      addProducts: (newProducts) => set((state) => {
        const products = [...state.products, ...newProducts];
        const totalDataPages = products.length > 0
          ? Math.ceil(products.length / state.itemsPerPage)
          : 1;
        return {
          products,
          totalDataPages
        };
      }),
>>>>>>> testing
      
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
<<<<<<< HEAD
=======
      
      // Proxy management actions
      setProxies: (proxies) => set({ proxies }),
      
      addProxy: (proxy) => set((state) => ({
        proxies: [...state.proxies, proxy]
      })),
      
      removeProxy: (proxyId) => set((state) => ({
        proxies: state.proxies.filter(p => p.id !== proxyId)
      })),
      
      setActiveProxy: (proxy) => set({ activeProxy: proxy }),
      
      setProxyStats: (stats) => set({ proxyStats: stats }),
      
      setBanDetected: (detected, reason = null) => set({ 
        banDetected: detected,
        lastBanReason: reason
      }),
      
      clearBanStatus: () => set({ 
        banDetected: false,
        lastBanReason: null
      }),
      
      // Pagination actions
      setItemsPerPage: (count) => set((state) => {
        const totalDataPages = state.products.length > 0
          ? Math.ceil(state.products.length / count)
          : 1;
        return {
          itemsPerPage: count,
          totalDataPages,
          currentDataPage: 1 // Reset to first page
        };
      }),
      
      setCurrentDataPage: (page) => set({ currentDataPage: page }),
      
      updatePagination: () => set((state) => ({
        totalDataPages: state.products.length > 0
          ? Math.ceil(state.products.length / state.itemsPerPage)
          : 1
      })),
      
      getPaginatedProducts: () => {
        const state = get();
        const start = (state.currentDataPage - 1) * state.itemsPerPage;
        const end = start + state.itemsPerPage;
        return state.products.slice(start, end);
      },
>>>>>>> testing
    }),
    {
      name: 'shopee-scraper-storage',
      partialize: (state) => ({ 
<<<<<<< HEAD
        history: state.history,
        settings: state.settings,
=======
        products: state.products,        // Save products data
        history: state.history,
        settings: state.settings,
        proxies: state.proxies,
        itemsPerPage: state.itemsPerPage,
        currentDataPage: state.currentDataPage,  // Save current page
>>>>>>> testing
      }),
    }
  )
)
