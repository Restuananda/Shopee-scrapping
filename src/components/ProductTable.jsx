import { useState } from 'react'
import { Grid3X3, List, Search, Download, Trash2, ExternalLink, Star, Copy, Check } from 'lucide-react'
import { useScraperStore } from '../store/useScraperStore'
import { exportToCSV, exportToJSON, exportToMD } from '../utils/scraper'
import clsx from 'clsx'

export default function ProductTable({ viewMode, setViewMode }) {
  const { products, clearProducts, saveToHistory } = useScraperStore()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('no')
  const [sortOrder, setSortOrder] = useState('asc')
  const [copied, setCopied] = useState(false)
  
  const filteredProducts = products
    .filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      
      if (sortBy === 'price') {
        aVal = parseInt(aVal.replace(/[^0-9]/g, '')) || 0
        bVal = parseInt(bVal.replace(/[^0-9]/g, '')) || 0
      }
      if (sortBy === 'rating') {
        aVal = parseFloat(aVal) || 0
        bVal = parseFloat(bVal) || 0
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      }
      return aVal < bVal ? 1 : -1
    })
  
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }
  
  const handleExport = (format) => {
    const filename = `shopee_${new Date().toISOString().split('T')[0]}`
    switch (format) {
      case 'csv':
        exportToCSV(products, `${filename}.csv`)
        break
      case 'json':
        exportToJSON(products, `${filename}.json`)
        break
      case 'md':
        exportToMD(products, `${filename}.md`)
        break
    }
  }
  
  const handleCopyAll = () => {
    navigator.clipboard.writeText(JSON.stringify(products, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleClear = () => {
    if (products.length > 0 && confirm('Save to history before clearing?')) {
      saveToHistory()
    }
    clearProducts()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-50">Products</h1>
          <p className="text-dark-400 mt-1">{products.length} products scraped</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={clsx('btn btn-ghost', viewMode === 'table' && 'bg-dark-800')}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={clsx('btn btn-ghost', viewMode === 'grid' && 'bg-dark-800')}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="relative group">
              <button className="btn btn-secondary">
                <Download className="w-4 h-4" />
                Export
              </button>
              <div className="absolute right-0 top-full mt-2 w-40 bg-dark-800 border border-dark-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <button onClick={() => handleExport('csv')} className="w-full px-4 py-2 text-left text-sm hover:bg-dark-700 rounded-t-xl">
                  Export CSV
                </button>
                <button onClick={() => handleExport('json')} className="w-full px-4 py-2 text-left text-sm hover:bg-dark-700">
                  Export JSON
                </button>
                <button onClick={() => handleExport('md')} className="w-full px-4 py-2 text-left text-sm hover:bg-dark-700 rounded-b-xl">
                  Export Markdown
                </button>
              </div>
            </div>
            
            <button onClick={handleCopyAll} className="btn btn-secondary">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            
            <button onClick={handleClear} className="btn btn-secondary text-red-400 hover:text-red-300">
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </div>
      
      {/* Table */}
      {filteredProducts.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('no')} className="cursor-pointer hover:bg-dark-700/50">
                    # {sortBy === 'no' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Image</th>
                  <th onClick={() => handleSort('name')} className="cursor-pointer hover:bg-dark-700/50">
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('price')} className="cursor-pointer hover:bg-dark-700/50">
                    Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Discount</th>
                  <th>Sold</th>
                  <th onClick={() => handleSort('rating')} className="cursor-pointer hover:bg-dark-700/50">
                    Rating {sortBy === 'rating' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Location</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <tr key={index} className="group">
                    <td className="font-mono text-dark-400">{product.no}</td>
                    <td>
                      {product.image && product.image !== 'N/A' ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-dark-700">
                          <img 
                            src={product.image} 
                            alt="" 
                            className="w-full h-full object-cover"
                            onError={(e) => e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-dark-500 text-xs">No img</div>'}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-dark-700 flex items-center justify-center text-dark-500 text-xs">
                          No img
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="max-w-xs">
                        <p className="font-medium text-dark-100 line-clamp-2">{product.name}</p>
                      </div>
                    </td>
                    <td>
                      <span className="font-semibold text-shopee-400">{product.price}</span>
                    </td>
                    <td>
                      {product.discount !== '-' ? (
                        <span className="badge badge-error">{product.discount}</span>
                      ) : (
                        <span className="text-dark-500">-</span>
                      )}
                    </td>
                    <td className="text-dark-300">{product.sold}</td>
                    <td>
                      {product.rating !== '-' ? (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          {product.rating}
                        </span>
                      ) : (
                        <span className="text-dark-500">-</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-info">{product.location}</span>
                    </td>
                    <td>
                      {product.link !== 'N/A' && (
                        <a 
                          href={product.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-ghost p-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-dark-500" />
          </div>
          <h3 className="text-lg font-semibold text-dark-200 mb-2">No products found</h3>
          <p className="text-dark-400">
            {products.length === 0 
              ? 'Start scraping to see products here'
              : 'Try adjusting your search'}
          </p>
        </div>
      )}
    </div>
  )
}
