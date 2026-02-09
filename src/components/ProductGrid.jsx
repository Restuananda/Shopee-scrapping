import { useState } from 'react'
import { Grid3X3, List, Search, Download, Trash2, ExternalLink, Star, MapPin } from 'lucide-react'
import { useScraperStore } from '../store/useScraperStore'
import { exportToCSV, exportToJSON, exportToMD } from '../utils/scraper'
import Pagination from './Pagination'
import clsx from 'clsx'

export default function ProductGrid({ viewMode, setViewMode }) {
  const { 
    products = [], 
    clearProducts, 
    saveToHistory,
    itemsPerPage = 20,
    currentDataPage = 1,
    totalDataPages = 1,
    setItemsPerPage,
    setCurrentDataPage
  } = useScraperStore()
  const [search, setSearch] = useState('')
  
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.location.toLowerCase().includes(search.toLowerCase())
  )
  
  // Apply pagination
  const safeItemsPerPage = itemsPerPage || 20; // Fallback to 20
  const totalFilteredPages = filteredProducts.length > 0
    ? Math.ceil(filteredProducts.length / safeItemsPerPage)
    : 1;
  const startIndex = (currentDataPage - 1) * safeItemsPerPage;
  const endIndex = startIndex + safeItemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  const handleExport = (format) => {
    const filename = `shopee_${new Date().toISOString().split('T')[0]}`
    switch (format) {
      case 'csv': exportToCSV(products, `${filename}.csv`); break
      case 'json': exportToJSON(products, `${filename}.json`); break
      case 'md': exportToMD(products, `${filename}.md`); break
    }
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
          
          <div className="flex items-center gap-2">
            <div className="relative group">
              <button className="btn btn-secondary">
                <Download className="w-4 h-4" />
                Export
              </button>
              <div className="absolute right-0 top-full mt-2 w-40 bg-dark-800 border border-dark-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <button onClick={() => handleExport('csv')} className="w-full px-4 py-2 text-left text-sm hover:bg-dark-700 rounded-t-xl">Export CSV</button>
                <button onClick={() => handleExport('json')} className="w-full px-4 py-2 text-left text-sm hover:bg-dark-700">Export JSON</button>
                <button onClick={() => handleExport('md')} className="w-full px-4 py-2 text-left text-sm hover:bg-dark-700 rounded-b-xl">Export Markdown</button>
              </div>
            </div>
            
            <button onClick={handleClear} className="btn btn-secondary text-red-400 hover:text-red-300">
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </div>
      
      {/* Grid */}
      {filteredProducts.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProducts.map((product, index) => (
            <div 
              key={index} 
              className="card overflow-hidden group hover:border-dark-700 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image */}
              <div className="aspect-square bg-dark-800 relative overflow-hidden">
                {product.image && product.image !== 'N/A' ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-dark-500">No Image</div>'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-dark-500">
                    No Image
                  </div>
                )}
                
                {/* Discount Badge */}
                {product.discount !== '-' && (
                  <div className="absolute top-3 left-3 bg-shopee-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                    {product.discount}
                  </div>
                )}
                
                {/* Number Badge */}
                <div className="absolute top-3 right-3 bg-dark-900/80 backdrop-blur-sm text-dark-300 text-xs font-mono px-2 py-1 rounded-lg">
                  #{product.no}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <h3 className="font-medium text-dark-100 line-clamp-2 mb-2 min-h-[48px]">
                  {product.name}
                </h3>
                
                <p className="text-xl font-bold text-shopee-400 mb-3">
                  {product.price}
                </p>
                
                <div className="flex items-center justify-between text-sm text-dark-400 mb-3">
                  {product.rating !== '-' && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      {product.rating}
                    </span>
                  )}
                  <span>{product.sold}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-sm text-dark-400">
                    <MapPin className="w-4 h-4" />
                    {product.location}
                  </span>
                  
                  {product.link !== 'N/A' && (
                    <a 
                      href={product.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-ghost p-2 text-shopee-400"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        <Pagination
          currentPage={currentDataPage}
          totalPages={totalFilteredPages}
          onPageChange={setCurrentDataPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={filteredProducts.length}
          itemName="products"
        />
      </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-4">
            <Grid3X3 className="w-8 h-8 text-dark-500" />
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
