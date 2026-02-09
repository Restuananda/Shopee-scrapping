import { useState, useEffect } from 'react'
import { HardDrive, AlertTriangle, CheckCircle } from 'lucide-react'

export default function StorageMonitor() {
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 5242880, // 5MB typical localStorage limit
    percentage: 0,
    status: 'good'
  })

  const calculateStorageSize = () => {
    try {
      let total = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length
        }
      }
      return total * 2 // UTF-16 uses 2 bytes per character
    } catch (e) {
      return 0
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const updateStorageInfo = () => {
    const used = calculateStorageSize()
    const total = storageInfo.total
    const percentage = Math.round((used / total) * 100)
    
    let status = 'good'
    if (percentage >= 90) status = 'critical'
    else if (percentage >= 70) status = 'warning'
    
    setStorageInfo({
      used,
      total,
      percentage,
      status
    })
  }

  useEffect(() => {
    updateStorageInfo()
    
    // Update every 30 seconds
    const interval = setInterval(updateStorageInfo, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    switch (storageInfo.status) {
      case 'critical': return 'text-red-400'
      case 'warning': return 'text-yellow-400'
      default: return 'text-green-400'
    }
  }

  const getStatusIcon = () => {
    switch (storageInfo.status) {
      case 'critical': 
      case 'warning': 
        return <AlertTriangle className="w-4 h-4" />
      default: 
        return <CheckCircle className="w-4 h-4" />
    }
  }

  const clearOldData = () => {
    if (confirm('Clear all history but keep current products?')) {
      const storage = JSON.parse(localStorage.getItem('shopee-scraper-storage'))
      if (storage && storage.state) {
        storage.state.history = []
        localStorage.setItem('shopee-scraper-storage', JSON.stringify(storage))
        updateStorageInfo()
        alert('History cleared!')
      }
    }
  }

  // Don't show if storage is good
  if (storageInfo.status === 'good' && storageInfo.percentage < 50) {
    return null
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-dark-800 border ${
      storageInfo.status === 'critical' ? 'border-red-500' :
      storageInfo.status === 'warning' ? 'border-yellow-500' : 'border-dark-700'
    } rounded-lg p-4 shadow-lg max-w-sm z-50`}>
      <div className="flex items-start gap-3">
        <div className={getStatusColor()}>
          {getStatusIcon()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className={`w-4 h-4 ${getStatusColor()}`} />
            <span className="font-semibold text-dark-100 text-sm">Storage Usage</span>
          </div>
          
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-dark-400 mb-1">
                <span>{formatBytes(storageInfo.used)}</span>
                <span>{storageInfo.percentage}%</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    storageInfo.status === 'critical' ? 'bg-red-500' :
                    storageInfo.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                />
              </div>
            </div>

            {storageInfo.status !== 'good' && (
              <div className="text-xs text-dark-300">
                {storageInfo.status === 'critical' 
                  ? '⚠️ Storage almost full! Clear history or export data.'
                  : '💡 Consider clearing old data to free up space.'}
              </div>
            )}

            {storageInfo.status !== 'good' && (
              <button
                onClick={clearOldData}
                className="w-full px-3 py-1.5 bg-shopee-500 hover:bg-shopee-600 text-white text-xs rounded transition-colors"
              >
                Clear History
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
