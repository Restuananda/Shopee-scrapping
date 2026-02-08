import { useState } from 'react'
import { useScraperStore } from './store/useScraperStore'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ProductTable from './components/ProductTable'
import ProductGrid from './components/ProductGrid'
import History from './components/History'
import Settings from './components/Settings'
import ScraperPanel from './components/ScraperPanel'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [viewMode, setViewMode] = useState('table') // table or grid
  const { products } = useScraperStore()

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} />
      case 'products':
        return viewMode === 'table' 
          ? <ProductTable viewMode={viewMode} setViewMode={setViewMode} />
          : <ProductGrid viewMode={viewMode} setViewMode={setViewMode} />
      case 'history':
        return <History />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard onNavigate={setCurrentView} />
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="flex-1 ml-64">
        <div className="p-8">
          {renderView()}
        </div>
      </main>
      
      <ScraperPanel />
    </div>
  )
}

export default App
