import { Package, TrendingUp, MapPin, Star, ArrowRight, Clock } from 'lucide-react'
import { useScraperStore } from '../store/useScraperStore'

export default function Dashboard({ onNavigate }) {
  const { products, history, scrapedPages } = useScraperStore()
  
  // Calculate stats
  const totalProducts = products.length
  const avgRating = products.length > 0 
    ? (products.reduce((acc, p) => acc + (parseFloat(p.rating) || 0), 0) / products.filter(p => p.rating !== '-').length).toFixed(1)
    : 0
  
  const locations = products.reduce((acc, p) => {
    if (p.location && p.location !== '-') {
      acc[p.location] = (acc[p.location] || 0) + 1
    }
    return acc
  }, {})
  const topLocation = Object.entries(locations).sort((a, b) => b[1] - a[1])[0]
  
  const withDiscount = products.filter(p => p.discount && p.discount !== '-').length

  const stats = [
    {
      label: 'Total Products',
      value: totalProducts,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      shadowColor: 'shadow-blue-500/30',
    },
    {
      label: 'Pages Scraped',
      value: scrapedPages,
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      shadowColor: 'shadow-emerald-500/30',
    },
    {
      label: 'Avg Rating',
      value: avgRating || '-',
      icon: Star,
      color: 'from-amber-500 to-amber-600',
      shadowColor: 'shadow-amber-500/30',
    },
    {
      label: 'With Discount',
      value: withDiscount,
      icon: TrendingUp,
      color: 'from-shopee-500 to-shopee-600',
      shadowColor: 'shadow-shopee-500/30',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark-50">Dashboard</h1>
        <p className="text-dark-400 mt-1">Overview of your scraped data</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-stagger">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card p-6 group hover:border-dark-700 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-dark-400 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-dark-50 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Quick Actions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button 
              onClick={() => onNavigate('products')}
              className="w-full flex items-center justify-between p-4 bg-dark-800/50 hover:bg-dark-800 rounded-xl transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-dark-100">View Products</p>
                  <p className="text-sm text-dark-400">{totalProducts} products scraped</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-dark-400 group-hover:text-dark-100 group-hover:translate-x-1 transition-all duration-200" />
            </button>
            
            <button 
              onClick={() => onNavigate('history')}
              className="w-full flex items-center justify-between p-4 bg-dark-800/50 hover:bg-dark-800 rounded-xl transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-dark-100">Scrape History</p>
                  <p className="text-sm text-dark-400">{history.length} saved sessions</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-dark-400 group-hover:text-dark-100 group-hover:translate-x-1 transition-all duration-200" />
            </button>
          </div>
        </div>
        
        {/* Top Locations */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Top Locations</h2>
          {Object.keys(locations).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(locations)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([location, count], index) => (
                  <div key={location} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-dark-800 flex items-center justify-center text-sm font-bold text-dark-400">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-dark-200">{location}</span>
                        <span className="text-sm text-dark-400">{count} products</span>
                      </div>
                      <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-shopee-500 to-shopee-600 rounded-full transition-all duration-500"
                          style={{ width: `${(count / totalProducts) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-dark-400">
              <MapPin className="w-12 h-12 mb-3 opacity-30" />
              <p>No location data yet</p>
              <p className="text-sm">Start scraping to see locations</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Products Preview */}
      {products.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-100">Recent Products</h2>
            <button 
              onClick={() => onNavigate('products')}
              className="text-sm text-shopee-400 hover:text-shopee-300 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.slice(0, 4).map((product, index) => (
              <div key={index} className="bg-dark-800/50 rounded-xl p-4 hover:bg-dark-800 transition-all duration-200">
                {product.image && product.image !== 'N/A' && (
                  <div className="aspect-square rounded-lg overflow-hidden bg-dark-700 mb-3">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
                <h3 className="font-medium text-dark-100 text-sm line-clamp-2 mb-2">{product.name}</h3>
                <p className="text-shopee-400 font-bold">{product.price}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-dark-400">
                  {product.rating !== '-' && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400" /> {product.rating}
                    </span>
                  )}
                  {product.sold !== '-' && <span>{product.sold}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
