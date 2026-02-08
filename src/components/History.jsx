import { Clock, Download, Trash2, Upload, Package } from 'lucide-react'
import { useScraperStore } from '../store/useScraperStore'
import { exportToCSV, exportToJSON } from '../utils/scraper'

export default function History() {
  const { history, loadFromHistory, deleteFromHistory, products, saveToHistory } = useScraperStore()
  
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  const handleExport = (entry, format) => {
    const filename = `shopee_${new Date(entry.date).toISOString().split('T')[0]}`
    if (format === 'csv') {
      exportToCSV(entry.products, `${filename}.csv`)
    } else {
      exportToJSON(entry.products, `${filename}.json`)
    }
  }
  
  const handleSaveCurrent = () => {
    if (products.length > 0) {
      saveToHistory()
      alert('Saved to history!')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-50">History</h1>
          <p className="text-dark-400 mt-1">Your saved scraping sessions</p>
        </div>
        
        {products.length > 0 && (
          <button onClick={handleSaveCurrent} className="btn btn-primary">
            <Upload className="w-4 h-4" />
            Save Current ({products.length})
          </button>
        )}
      </div>
      
      {/* History List */}
      {history.length > 0 ? (
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="card p-6 hover:border-dark-700 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-shopee-500/20 to-shopee-600/20 flex items-center justify-center">
                    <Package className="w-6 h-6 text-shopee-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-dark-100">{entry.count} Products</p>
                    <p className="text-sm text-dark-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(entry.date)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => loadFromHistory(entry.id)}
                    className="btn btn-secondary"
                  >
                    Load
                  </button>
                  
                  <div className="relative group">
                    <button className="btn btn-ghost">
                      <Download className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-36 bg-dark-800 border border-dark-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <button 
                        onClick={() => handleExport(entry, 'csv')} 
                        className="w-full px-4 py-2 text-left text-sm hover:bg-dark-700 rounded-t-xl"
                      >
                        Export CSV
                      </button>
                      <button 
                        onClick={() => handleExport(entry, 'json')} 
                        className="w-full px-4 py-2 text-left text-sm hover:bg-dark-700 rounded-b-xl"
                      >
                        Export JSON
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (confirm('Delete this entry?')) {
                        deleteFromHistory(entry.id)
                      }
                    }}
                    className="btn btn-ghost text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Preview */}
              <div className="mt-4 pt-4 border-t border-dark-800">
                <p className="text-sm text-dark-400 mb-2">Preview:</p>
                <div className="flex flex-wrap gap-2">
                  {entry.products.slice(0, 5).map((p, i) => (
                    <div key={i} className="bg-dark-800/50 rounded-lg px-3 py-2 text-sm">
                      <span className="text-dark-300 line-clamp-1 max-w-[150px]">{p.name.substring(0, 30)}...</span>
                      <span className="text-shopee-400 ml-2">{p.price}</span>
                    </div>
                  ))}
                  {entry.products.length > 5 && (
                    <div className="bg-dark-800/50 rounded-lg px-3 py-2 text-sm text-dark-400">
                      +{entry.products.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-dark-500" />
          </div>
          <h3 className="text-lg font-semibold text-dark-200 mb-2">No history yet</h3>
          <p className="text-dark-400">
            Your saved scraping sessions will appear here
          </p>
        </div>
      )}
    </div>
  )
}
