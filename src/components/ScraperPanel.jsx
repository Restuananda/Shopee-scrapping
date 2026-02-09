import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, Copy, Check, Play, Plus, Loader2, Info, Shield, AlertTriangle } from 'lucide-react'
import { useScraperStore } from '../store/useScraperStore'
import { getScraperCode } from '../utils/scraper'
import clsx from 'clsx'

export default function ScraperPanel() {
  const [isOpen, setIsOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  
  const { 
    addProducts, 
    setProducts, 
    products, 
    incrementScrapedPages,
    settings,
    activeProxy,
    banDetected,
    setBanDetected,
    lastBanReason
  } = useScraperStore()
  
  const scraperCode = getScraperCode()
  
  const scrapeCommand = `JSON.stringify(window.__SHOPEE_SCRAPER__.scrape())`
  
  const handleCopyInit = () => {
    navigator.clipboard.writeText(scraperCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleCopyScrape = () => {
    navigator.clipboard.writeText(scrapeCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleImport = () => {
    setError('')
    try {
      const data = JSON.parse(jsonInput)
      
      // Check if response indicates a ban
      if (data.banned || data.error) {
        setBanDetected(true, data.reason || 'Scraping blocked or page format changed')
        setError(data.reason || 'Ban detected! Enable proxy rotation in settings.')
        return
      }
      
      // Handle products array
      const products = data.products || data
      
      if (Array.isArray(products) && products.length > 0) {
        // Renumber products
        const numbered = products.map((p, i) => ({
          ...p,
          no: products.length + i + 1
        }))
        addProducts(numbered)
        incrementScrapedPages()
        setJsonInput('')
        setImporting(false)
        
        // Clear ban status on successful scrape
        if (banDetected) {
          setBanDetected(false)
        }
      } else {
        setError('Invalid data format. Expected an array of products.')
      }
    } catch (e) {
      setError('Invalid JSON. Make sure you copied the output correctly.')
    }
  }
  
  const handleReplace = () => {
    setError('')
    try {
      const data = JSON.parse(jsonInput)
      if (Array.isArray(data) && data.length > 0) {
        const numbered = data.map((p, i) => ({ ...p, no: i + 1 }))
        setProducts(numbered)
        setJsonInput('')
        setImporting(false)
      } else {
        setError('Invalid data format.')
      }
    } catch (e) {
      setError('Invalid JSON.')
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'fixed top-1/2 -translate-y-1/2 z-50 w-8 h-16 bg-shopee-500 rounded-l-lg flex items-center justify-center text-white shadow-lg shadow-shopee-500/30 hover:bg-shopee-600 transition-all duration-300',
          isOpen ? 'right-80' : 'right-0'
        )}
      >
        {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
      
      {/* Panel */}
      <div
        className={clsx(
          'fixed top-0 right-0 h-screen w-80 bg-dark-900/95 backdrop-blur-xl border-l border-dark-800 z-40 transition-transform duration-300 overflow-y-auto',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-lg font-bold text-dark-50">Scraper Console</h2>
            <p className="text-sm text-dark-400">Copy & paste to scrape</p>
            
            {/* Proxy Status */}
            {settings.useProxy && (
              <div className="mt-3 flex items-center gap-2 text-xs">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-dark-300">
                  Proxy: {activeProxy ? `${activeProxy.host}:${activeProxy.port}` : 'Not selected'}
                </span>
              </div>
            )}
            
            {/* Ban Warning */}
            {banDetected && (
              <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-red-400">Ban Detected!</p>
                    <p className="text-red-300 mt-1">{lastBanReason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-shopee-500 flex items-center justify-center text-xs font-bold text-white">1</div>
              <span className="font-medium text-dark-200">Initialize Scraper</span>
            </div>
            <p className="text-sm text-dark-400">
              Open Shopee shop page, then paste this in Console (F12):
            </p>
            <div className="relative">
              <pre className="bg-dark-800 rounded-xl p-3 text-xs text-dark-300 overflow-x-auto max-h-32">
                {scraperCode.substring(0, 200)}...
              </pre>
              <button
                onClick={handleCopyInit}
                className="absolute top-2 right-2 btn btn-ghost p-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {/* Step 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-shopee-500 flex items-center justify-center text-xs font-bold text-white">2</div>
              <span className="font-medium text-dark-200">Run Scraper</span>
            </div>
            <p className="text-sm text-dark-400">
              Paste this to scrape and copy the output:
            </p>
            <div className="relative">
              <pre className="bg-dark-800 rounded-xl p-3 text-xs text-emerald-400 font-mono">
                {scrapeCommand}
              </pre>
              <button
                onClick={handleCopyScrape}
                className="absolute top-2 right-2 btn btn-ghost p-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {/* Step 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-shopee-500 flex items-center justify-center text-xs font-bold text-white">3</div>
              <span className="font-medium text-dark-200">Import Data</span>
            </div>
            
            {!importing ? (
              <button
                onClick={() => setImporting(true)}
                className="btn btn-primary w-full"
              >
                <Plus className="w-4 h-4" />
                Paste JSON Data
              </button>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='Paste JSON here... (e.g. [{"name":"..."}])'
                  className="input min-h-[120px] text-xs font-mono"
                />
                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}
                <div className="flex gap-2">
                  <button onClick={handleImport} className="btn btn-primary flex-1">
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                  <button onClick={handleReplace} className="btn btn-secondary flex-1">
                    Replace All
                  </button>
                </div>
                <button
                  onClick={() => {
                    setImporting(false)
                    setJsonInput('')
                    setError('')
                  }}
                  className="btn btn-ghost w-full text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          
          {/* Current Status */}
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
            <p className="text-sm text-dark-400 mb-1">Current Data</p>
            <p className="text-2xl font-bold text-dark-50">{products.length}</p>
            <p className="text-sm text-dark-400">products loaded</p>
          </div>
          
          {/* Help */}
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-dark-300">
                <p className="font-medium text-blue-400 mb-1">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Go to any Shopee shop/search page</li>
                  <li>Open DevTools (F12) → Console</li>
                  <li>Paste Step 1 code, press Enter</li>
                  <li>Paste Step 2 code, press Enter</li>
                  <li>Copy the JSON output</li>
                  <li>Paste here to import</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
