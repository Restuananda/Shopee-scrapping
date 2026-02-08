import { Save, RotateCcw } from 'lucide-react'
import { useScraperStore } from '../store/useScraperStore'
import { useState } from 'react'

const defaultSettings = {
  maxPages: 5,
  delay: 2000,
  autoScroll: true,
  includeImages: true,
}

export default function Settings() {
  const { settings, updateSettings } = useScraperStore()
  const [localSettings, setLocalSettings] = useState(settings)
  const [saved, setSaved] = useState(false)
  
  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
  }
  
  const handleSave = () => {
    updateSettings(localSettings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  
  const handleReset = () => {
    setLocalSettings(defaultSettings)
    updateSettings(defaultSettings)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark-50">Settings</h1>
        <p className="text-dark-400 mt-1">Configure scraper behavior</p>
      </div>
      
      {/* Settings Form */}
      <div className="card p-6 space-y-6">
        {/* Max Pages */}
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Max Pages to Scrape
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={localSettings.maxPages}
            onChange={(e) => handleChange('maxPages', parseInt(e.target.value) || 1)}
            className="input w-32"
          />
          <p className="text-sm text-dark-400 mt-1">
            Maximum number of pages to scrape automatically
          </p>
        </div>
        
        {/* Delay */}
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Delay Between Pages (ms)
          </label>
          <input
            type="number"
            min="500"
            max="10000"
            step="100"
            value={localSettings.delay}
            onChange={(e) => handleChange('delay', parseInt(e.target.value) || 2000)}
            className="input w-32"
          />
          <p className="text-sm text-dark-400 mt-1">
            Wait time between page navigations (recommended: 2000ms)
          </p>
        </div>
        
        {/* Auto Scroll */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-dark-200">
              Auto Scroll
            </label>
            <p className="text-sm text-dark-400">
              Automatically scroll to load all products
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.autoScroll}
              onChange={(e) => handleChange('autoScroll', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-shopee-500"></div>
          </label>
        </div>
        
        {/* Include Images */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-dark-200">
              Include Images
            </label>
            <p className="text-sm text-dark-400">
              Extract product image URLs
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.includeImages}
              onChange={(e) => handleChange('includeImages', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-shopee-500"></div>
          </label>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-dark-800">
          <button onClick={handleSave} className="btn btn-primary">
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
          <button onClick={handleReset} className="btn btn-secondary">
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>
        </div>
      </div>
      
      {/* Info */}
      <div className="card p-6 bg-blue-500/10 border-blue-500/20">
        <h3 className="font-semibold text-blue-400 mb-2">💡 Tips</h3>
        <ul className="text-sm text-dark-300 space-y-1">
          <li>• Use longer delays if you're getting blocked</li>
          <li>• Lower max pages for faster results</li>
          <li>• Disable images to reduce data size</li>
          <li>• Make sure you're on a Shopee shop/search page</li>
        </ul>
      </div>
    </div>
  )
}
