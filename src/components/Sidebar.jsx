import { LayoutDashboard, Package, History, Settings, ShoppingBag, Shield, Upload, Repeat } from 'lucide-react'
import { useScraperStore } from '../store/useScraperStore'
import clsx from 'clsx'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'import', label: 'Import & Merge', icon: Upload },
  { id: 'transform', label: 'Transform Data', icon: Repeat },
  { id: 'proxy', label: 'Proxy Manager', icon: Shield },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ currentView, setCurrentView }) {
  const { products } = useScraperStore()
  
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-900/90 backdrop-blur-xl border-r border-dark-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-dark-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-shopee-500 to-shopee-600 flex items-center justify-center shadow-lg shadow-shopee-500/30">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-dark-50">Shopee Scraper</h1>
            <p className="text-xs text-dark-400">Dashboard v1.0</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentView(item.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200',
                    isActive 
                      ? 'bg-shopee-500/20 text-shopee-400 shadow-lg shadow-shopee-500/10' 
                      : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800/50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.id === 'products' && products.length > 0 && (
                    <span className="ml-auto bg-shopee-500/20 text-shopee-400 text-xs font-bold px-2 py-0.5 rounded-full">
                      {products.length}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-dark-800">
        <div className="bg-gradient-to-r from-shopee-500/10 to-shopee-600/10 rounded-xl p-4 border border-shopee-500/20">
          <p className="text-sm font-medium text-dark-200 mb-1">Quick Tip</p>
          <p className="text-xs text-dark-400">
            Open Shopee in another tab, then use the scraper panel to extract products.
          </p>
        </div>
      </div>
    </aside>
  )
}
