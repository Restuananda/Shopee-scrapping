import { useState } from 'react'
import { RefreshCw, Download, FileJson, FileCode, Settings as SettingsIcon, CheckCircle, AlertCircle, Upload } from 'lucide-react'
import { DataTransformer, presets, downloadTransformedData } from '../utils/dataTransformer'
import { useScraperStore } from '../store/useScraperStore'

export default function DataTransform() {
  const { products } = useScraperStore()
  const [preset, setPreset] = useState('shopeeToBook')
  const [transformedData, setTransformedData] = useState(null)
  const [previewCount, setPreviewCount] = useState(5)
  const [outputFormat, setOutputFormat] = useState('typescript')
  const [customTemplate, setCustomTemplate] = useState(null)
  const [customMappings, setCustomMappings] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleTransform = () => {
    if (products.length === 0) {
      alert('No products to transform. Please scrape or import data first.')
      return
    }

    try {
      let transformer

      // Get transformer based on preset
      switch (preset) {
        case 'shopeeToBook':
          transformer = presets.shopeeToBook()
          break
        case 'custom':
          if (!customTemplate) {
            alert('Please upload a template first')
            return
          }
          transformer = createCustomTransformer(customTemplate, customMappings)
          break
        default:
          transformer = presets.shopeeToBook()
      }

      // Transform data
      const result = transformer.transformBatch(products)
      setTransformedData(result)
    } catch (error) {
      alert('Error transforming data: ' + error.message)
      console.error(error)
    }
  }

  const handleTemplateUpload = async (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      let template

      if (file.name.endsWith('.json')) {
        template = JSON.parse(text)
      } else if (file.name.endsWith('.ts') || file.name.endsWith('.js')) {
        // Parse TypeScript/JavaScript object literal
        template = parseObjectLiteral(text)
      } else {
        alert('Please upload .json, .ts, or .js file')
        return
      }

      // If template is an array, take first element
      if (Array.isArray(template)) {
        template = template[0]
      }

      setCustomTemplate(template)
      setPreset('custom')
      alert(`✅ Template uploaded successfully!\n\nFields detected: ${Object.keys(template).join(', ')}`)
    } catch (error) {
      alert('Error parsing template: ' + error.message)
      console.error('Template parse error:', error)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleTemplateUpload(e)
  }

  const parseObjectLiteral = (text) => {
    try {
      // First, try to parse as JSON directly
      try {
        return JSON.parse(text)
      } catch (e) {
        // Not valid JSON, try to parse as JS/TS object literal
      }

      // Extract the object from various formats
      let objStr = text

      // Remove comments
      objStr = objStr.replace(/\/\/.*$/gm, '')  // Single-line comments
      objStr = objStr.replace(/\/\*[\s\S]*?\*\//g, '')  // Multi-line comments

      // Find object literal - look for the first { ... }
      const firstBrace = objStr.indexOf('{')
      const lastBrace = objStr.lastIndexOf('}')
      
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('No object found in file')
      }

      objStr = objStr.substring(firstBrace, lastBrace + 1)

      // Convert TypeScript/JavaScript to JSON
      // Step 1: Add quotes to unquoted keys
      objStr = objStr.replace(/(\s*)(\w+)(\s*):/g, '$1"$2"$3:')
      
      // Step 2: Convert single quotes to double quotes for strings
      // But be careful with strings that contain single quotes
      objStr = objStr.replace(/:\s*'([^']*)'/g, ': "$1"')
      
      // Step 3: Remove trailing commas before } or ]
      objStr = objStr.replace(/,(\s*[}\]])/g, '$1')

      // Step 4: Handle boolean and null values (should not be in quotes)
      objStr = objStr.replace(/:\s*"(true|false|null)"/g, ': $1')

      // Step 5: Handle numbers that might have been quoted
      objStr = objStr.replace(/:\s*"(\d+\.?\d*)"/g, ': $1')

      // Try to parse
      const parsed = JSON.parse(objStr)
      
      // If it's an array, take the first element
      if (Array.isArray(parsed)) {
        return parsed[0] || {}
      }
      
      return parsed
    } catch (error) {
      console.error('Parse error:', error)
      console.error('Text:', text)
      throw new Error(`Failed to parse template: ${error.message}. Please ensure the file contains a valid JavaScript/TypeScript object literal.`)
    }
  }

  const createCustomTransformer = (template, mappings) => {
    const transformer = new DataTransformer()
    transformer.setTemplate(template)
    
    // Auto-create mappings based on template keys
    const autoMappings = {}
    Object.keys(template).forEach(key => {
      // Try to find matching field in source data
      const sampleProduct = products[0]
      if (sampleProduct) {
        // Direct match
        if (sampleProduct[key]) {
          autoMappings[key] = key
        }
        // Common mappings
        else if (key === 'title' && sampleProduct.name) {
          autoMappings['name'] = 'title'
        }
        else if (key === 'coverImage' && sampleProduct.image) {
          autoMappings['image'] = 'coverImage'
        }
      }
    })
    
    transformer.addFieldMappings(mappings || autoMappings)
    
    // Add type converters based on template types
    Object.entries(template).forEach(([key, value]) => {
      if (typeof value === 'number') {
        transformer.addTypeConverter(key, DataTransformer.typeConverters.toNumber)
      } else if (typeof value === 'boolean') {
        transformer.addTypeConverter(key, DataTransformer.typeConverters.toBoolean)
      }
    })
    
    return transformer
  }

  const handleDownload = () => {
    if (!transformedData) return

    const filename = `transformed_${preset}_${Date.now()}`
    downloadTransformedData(transformedData, filename, outputFormat)
  }

  const handleCopyToClipboard = () => {
    if (!transformedData) return

    const transformer = new DataTransformer()
    const content = transformer.export(transformedData, outputFormat)
    
    navigator.clipboard.writeText(content)
      .then(() => alert('✅ Copied to clipboard!'))
      .catch(() => alert('❌ Failed to copy'))
  }

  const previewData = transformedData?.slice(0, previewCount) || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark-50">Data Transform</h1>
        <p className="text-dark-400 mt-1">Convert scraped data to different formats and structures</p>
      </div>

      {/* Configuration */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          Transformation Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preset Selection */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Preset Template
            </label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-100 focus:border-shopee-500 focus:ring-1 focus:ring-shopee-500 outline-none"
            >
              <option value="shopeeToBook">Shopee → Book Format</option>
              <option value="custom">Custom Template (Upload)</option>
            </select>
            <p className="text-xs text-dark-400 mt-1">
              {preset === 'custom' 
                ? 'Upload your own template.json/.ts/.js file'
                : 'Converts Shopee product data to book catalog format'}
            </p>
          </div>

          {/* Template Upload */}
          {preset === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Upload Template
              </label>
              <label 
                className={`flex items-center justify-center w-full px-4 py-8 bg-dark-800 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-shopee-500 bg-shopee-500/10' 
                    : 'border-dark-700 hover:border-shopee-500'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-shopee-400' : 'text-dark-400'}`} />
                  <span className="block text-sm text-dark-300 mb-1">
                    {customTemplate 
                      ? '✅ Template loaded' 
                      : isDragging 
                        ? '📥 Drop your file here' 
                        : '📤 Drop your template file here'}
                  </span>
                  <span className="block text-xs text-dark-500">
                    or click to browse (.json, .ts, .js)
                  </span>
                  {customTemplate && (
                    <div className="mt-2 px-3 py-1 bg-shopee-500/20 rounded text-xs text-shopee-400 inline-block">
                      {Object.keys(customTemplate).length} fields detected: {Object.keys(customTemplate).slice(0, 3).join(', ')}
                      {Object.keys(customTemplate).length > 3 && '...'}
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept=".json,.ts,.js"
                  onChange={handleTemplateUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-dark-400 mt-1">
                Upload a template with your desired output structure
              </p>
            </div>
          )}

          {/* Output Format */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Output Format
            </label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-100 focus:border-shopee-500 focus:ring-1 focus:ring-shopee-500 outline-none"
            >
              <option value="typescript">TypeScript (.ts) - Object Notation</option>
              <option value="javascript">JavaScript (.js) - Object Notation</option>
              <option value="json">JSON - Standard Format</option>
            </select>
            <p className="text-xs text-dark-400 mt-1">
              TypeScript/JavaScript format uses unquoted keys like your example
            </p>
          </div>
        </div>

        {/* Transform Button */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleTransform}
            disabled={products.length === 0}
            className="btn btn-primary flex-1"
          >
            <RefreshCw className="w-4 h-4" />
            Transform Data ({products.length} products)
          </button>

          {transformedData && (
            <>
              <button
                onClick={handleDownload}
                className="btn btn-secondary"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={handleCopyToClipboard}
                className="btn btn-ghost"
              >
                <FileCode className="w-4 h-4" />
                Copy
              </button>
            </>
          )}
        </div>
      </div>

      {/* Template Preview */}
      <div className="card p-6 bg-blue-500/10 border-blue-500/20">
        <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
          <FileJson className="w-4 h-4" />
          Template Structure (Book Format)
        </h3>
        <div className="bg-dark-800 rounded-lg p-4 overflow-x-auto">
          <pre className="text-xs text-dark-300 font-mono">
{`{
  id: '9',
  title: 'Book Title',
  author: 'Author Name',
  price: 24.099,
  originalPrice: 29.99,
  coverImage: 'https://...',
  rating: 4.5,
  reviewCount: 2847,
  category: 'fiction',
  description: 'Book description...',
  publisher: 'Publisher Name',
  publishedYear: 2020,
  pages: 304,
  isbn: '978-0525559474',
  inStock: true,
  discount: 17,
  badge: 'bestseller'
}`}
          </pre>
        </div>
      </div>

      {/* Field Mapping Info */}
      {preset === 'shopeeToBook' && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-dark-100 mb-3">Field Mapping</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-dark-400">id</span>
              <span className="text-dark-500">→</span>
              <span className="text-shopee-400">product.id (extracted)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-dark-400">title</span>
              <span className="text-dark-500">→</span>
              <span className="text-shopee-400">product.name</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-dark-400">author</span>
              <span className="text-dark-500">→</span>
              <span className="text-shopee-400">extracted from name</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-dark-400">price</span>
              <span className="text-dark-500">→</span>
              <span className="text-shopee-400">product.price (converted)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-dark-400">coverImage</span>
              <span className="text-dark-500">→</span>
              <span className="text-shopee-400">product.image</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-dark-400">rating</span>
              <span className="text-dark-500">→</span>
              <span className="text-shopee-400">product.rating (float)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-dark-400">publisher</span>
              <span className="text-dark-500">→</span>
              <span className="text-shopee-400">extracted from name</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-dark-400">discount</span>
              <span className="text-dark-500">→</span>
              <span className="text-shopee-400">product.discount (%)</span>
            </div>
          </div>
          <p className="text-xs text-dark-400 mt-3">
            ℹ️ Fields not in source data will use template defaults
          </p>
        </div>
      )}

      {/* Results */}
      {transformedData && (
        <>
          <div className="card p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Transformation Complete
              </h2>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-400">{transformedData.length}</p>
                <p className="text-xs text-dark-400">products transformed</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-800/50 rounded-lg p-3">
                <p className="text-xs text-dark-400">Total Items</p>
                <p className="text-xl font-bold text-dark-100">{transformedData.length}</p>
              </div>
              <div className="bg-dark-800/50 rounded-lg p-3">
                <p className="text-xs text-dark-400">Output Format</p>
                <p className="text-xl font-bold text-blue-400">{outputFormat.toUpperCase()}</p>
              </div>
              <div className="bg-dark-800/50 rounded-lg p-3">
                <p className="text-xs text-dark-400">Fields</p>
                <p className="text-xl font-bold text-purple-400">
                  {Object.keys(transformedData[0] || {}).length}
                </p>
              </div>
              <div className="bg-dark-800/50 rounded-lg p-3">
                <p className="text-xs text-dark-400">File Size</p>
                <p className="text-xl font-bold text-yellow-400">
                  {(JSON.stringify(transformedData).length / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-dark-100">Preview</h3>
              <select
                value={previewCount}
                onChange={(e) => setPreviewCount(Number(e.target.value))}
                className="px-3 py-1 bg-dark-800 border border-dark-700 rounded text-xs text-dark-100"
              >
                <option value="5">Show 5 items</option>
                <option value="10">Show 10 items</option>
                <option value="20">Show 20 items</option>
                <option value="50">Show 50 items</option>
              </select>
            </div>

            <div className="bg-dark-800 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
              <pre className="text-xs text-dark-300 font-mono">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            </div>
          </div>
        </>
      )}

      {/* Help */}
      {!transformedData && (
        <div className="card p-6 bg-yellow-500/10 border-yellow-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-dark-300">
              <p className="font-semibold text-yellow-400 mb-2">How to Use</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Make sure you have products in the dashboard (scrape or import first)</li>
                <li>Select a transformation preset (e.g., Shopee → Book Format)</li>
                <li>Choose output format (JSON, TypeScript, or JavaScript)</li>
                <li>Click "Transform Data" to convert your data</li>
                <li>Preview the results and download or copy the output</li>
              </ol>
              <p className="mt-3 text-xs text-dark-400">
                💡 The transformer will map fields, convert types, and fill missing data with defaults
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
