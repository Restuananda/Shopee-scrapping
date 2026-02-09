import { useState } from 'react'
import { Upload, FileText, Database, Download, AlertCircle, CheckCircle, XCircle, Trash2, BarChart3 } from 'lucide-react'
import { DataMerger, readFileAsText, downloadFile } from '../utils/dataMerger'
import { useScraperStore } from '../store/useScraperStore'

export default function ImportMerge() {
  const { setProducts } = useScraperStore()
  const [files, setFiles] = useState([])
  const [mergeResult, setMergeResult] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [options, setOptions] = useState({
    removeDuplicates: true,
    renumberProducts: true,
    addMetadata: true
  })

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files)
    const validFiles = []

    for (const file of selectedFiles) {
      const ext = file.name.split('.').pop().toLowerCase()
      if (['csv', 'json', 'md'].includes(ext)) {
        const content = await readFileAsText(file)
        validFiles.push({
          name: file.name,
          size: file.size,
          type: ext,
          content: content
        })
      }
    }

    setFiles([...files, ...validFiles])
  }

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleMerge = async () => {
    if (files.length === 0) {
      alert('Please select files to merge')
      return
    }

    setIsProcessing(true)
    try {
      const merger = new DataMerger()
      const result = await merger.mergeFiles(files, options)
      setMergeResult(result)
    } catch (error) {
      alert('Error merging files: ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImportToProducts = () => {
    if (mergeResult?.products) {
      setProducts(mergeResult.products)
      alert(`✅ Imported ${mergeResult.products.length} products to dashboard`)
    }
  }

  const handleExportSQL = () => {
    if (!mergeResult?.products) return
    
    const merger = new DataMerger()
    merger.mergedData = mergeResult.products
    
    const createTable = merger.generateCreateTable('shopee_products')
    const inserts = merger.generateSQL('shopee_products', { batchSize: 100 })
    
    const sql = createTable + inserts
    downloadFile(sql, `shopee_merged_${Date.now()}.sql`, 'text/plain')
  }

  const handleExportJSON = () => {
    if (!mergeResult?.products) return
    
    const merger = new DataMerger()
    merger.mergedData = mergeResult.products
    
    const json = merger.exportJSON()
    downloadFile(json, `shopee_merged_${Date.now()}.json`, 'application/json')
  }

  const handleExportCSV = () => {
    if (!mergeResult?.products) return
    
    const merger = new DataMerger()
    merger.mergedData = mergeResult.products
    
    const csv = merger.exportCSV()
    downloadFile(csv, `shopee_merged_${Date.now()}.csv`, 'text/csv')
  }

  const handleExportMongoDB = () => {
    if (!mergeResult?.products) return
    
    const merger = new DataMerger()
    merger.mergedData = mergeResult.products
    
    const mongodb = merger.exportMongoDB()
    downloadFile(mongodb, `shopee_merged_mongodb_${Date.now()}.json`, 'application/json')
  }

  const handleExportPostgreSQL = () => {
    if (!mergeResult?.products) return
    
    const merger = new DataMerger()
    merger.mergedData = mergeResult.products
    
    const psql = merger.exportPostgreSQL('shopee_products')
    downloadFile(psql, `shopee_merged_${Date.now()}.psql`, 'text/plain')
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark-50">Import & Merge</h1>
        <p className="text-dark-400 mt-1">Combine multiple scrape files and export to database</p>
      </div>

      {/* Upload Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Files
        </h2>
        
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-dark-700 rounded-xl hover:border-shopee-500 transition-colors cursor-pointer bg-dark-800/50 hover:bg-dark-800">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 text-dark-400 mb-2" />
              <p className="text-sm text-dark-300 mb-1">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-dark-500">CSV, JSON, or Markdown files</p>
            </div>
            <input
              type="file"
              multiple
              accept=".csv,.json,.md"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {/* Options */}
          <div className="bg-dark-800/50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-dark-200">Merge Options</p>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.removeDuplicates}
                onChange={(e) => setOptions({ ...options, removeDuplicates: e.target.checked })}
                className="w-4 h-4 text-shopee-500"
              />
              <span className="text-sm text-dark-300">Remove duplicate products</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.renumberProducts}
                onChange={(e) => setOptions({ ...options, renumberProducts: e.target.checked })}
                className="w-4 h-4 text-shopee-500"
              />
              <span className="text-sm text-dark-300">Renumber products sequentially</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.addMetadata}
                onChange={(e) => setOptions({ ...options, addMetadata: e.target.checked })}
                className="w-4 h-4 text-shopee-500"
              />
              <span className="text-sm text-dark-300">Add source file metadata</span>
            </label>
          </div>
        </div>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Selected Files ({files.length})
            </h2>
            <button
              onClick={handleMerge}
              disabled={isProcessing}
              className="btn btn-primary"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Merge Files
                </>
              )}
            </button>
          </div>

          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-dark-800/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-dark-100">{file.name}</p>
                    <p className="text-xs text-dark-400">{formatBytes(file.size)} • {file.type.toUpperCase()}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="btn btn-ghost p-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Merge Results */}
      {mergeResult && (
        <>
          {/* Statistics */}
          <div className="card p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20">
            <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              Merge Results
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-xs text-dark-400">Total Products</p>
                </div>
                <p className="text-2xl font-bold text-green-400">{mergeResult.stats.totalProducts}</p>
              </div>

              <div className="bg-dark-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-dark-400">Files Merged</p>
                </div>
                <p className="text-2xl font-bold text-blue-400">{mergeResult.stats.totalFiles}</p>
              </div>

              <div className="bg-dark-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-yellow-400" />
                  <p className="text-xs text-dark-400">Duplicates</p>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{mergeResult.stats.duplicatesRemoved}</p>
              </div>

              <div className="bg-dark-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-xs text-dark-400">Errors</p>
                </div>
                <p className="text-2xl font-bold text-red-400">{mergeResult.stats.errors}</p>
              </div>
            </div>

            {mergeResult.errors.length > 0 && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-400 mb-2">Errors encountered:</p>
                <ul className="space-y-1">
                  {mergeResult.errors.map((err, i) => (
                    <li key={i} className="text-xs text-red-300">
                      <span className="font-semibold">{err.file}:</span> {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Export Options */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Merged Data
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Import to Dashboard */}
              <button
                onClick={handleImportToProducts}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-shopee-500 to-shopee-600 rounded-xl hover:from-shopee-600 hover:to-shopee-700 transition-all duration-200"
              >
                <Upload className="w-5 h-5 text-white" />
                <div className="text-left">
                  <p className="font-semibold text-white">Import to Dashboard</p>
                  <p className="text-xs text-white/80">Load in Products view</p>
                </div>
              </button>

              {/* MySQL/MariaDB */}
              <button
                onClick={handleExportSQL}
                className="flex items-center gap-3 p-4 bg-dark-800 rounded-xl hover:bg-dark-700 transition-all duration-200"
              >
                <Database className="w-5 h-5 text-blue-400" />
                <div className="text-left">
                  <p className="font-semibold text-dark-100">MySQL / MariaDB</p>
                  <p className="text-xs text-dark-400">SQL INSERT statements</p>
                </div>
              </button>

              {/* PostgreSQL */}
              <button
                onClick={handleExportPostgreSQL}
                className="flex items-center gap-3 p-4 bg-dark-800 rounded-xl hover:bg-dark-700 transition-all duration-200"
              >
                <Database className="w-5 h-5 text-indigo-400" />
                <div className="text-left">
                  <p className="font-semibold text-dark-100">PostgreSQL</p>
                  <p className="text-xs text-dark-400">COPY format</p>
                </div>
              </button>

              {/* MongoDB */}
              <button
                onClick={handleExportMongoDB}
                className="flex items-center gap-3 p-4 bg-dark-800 rounded-xl hover:bg-dark-700 transition-all duration-200"
              >
                <Database className="w-5 h-5 text-green-400" />
                <div className="text-left">
                  <p className="font-semibold text-dark-100">MongoDB</p>
                  <p className="text-xs text-dark-400">JSON documents</p>
                </div>
              </button>

              {/* JSON */}
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-3 p-4 bg-dark-800 rounded-xl hover:bg-dark-700 transition-all duration-200"
              >
                <FileText className="w-5 h-5 text-yellow-400" />
                <div className="text-left">
                  <p className="font-semibold text-dark-100">JSON</p>
                  <p className="text-xs text-dark-400">Standard format</p>
                </div>
              </button>

              {/* CSV */}
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-3 p-4 bg-dark-800 rounded-xl hover:bg-dark-700 transition-all duration-200"
              >
                <FileText className="w-5 h-5 text-emerald-400" />
                <div className="text-left">
                  <p className="font-semibold text-dark-100">CSV</p>
                  <p className="text-xs text-dark-400">Excel compatible</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Help Section */}
      <div className="card p-6 bg-blue-500/10 border-blue-500/20">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">💡 How to Use</h3>
        <ul className="space-y-1 text-sm text-dark-300">
          <li>• Upload multiple CSV, JSON, or Markdown export files</li>
          <li>• Click "Merge Files" to combine them into a single dataset</li>
          <li>• Duplicates are automatically detected and removed</li>
          <li>• Export to database-ready formats (SQL, PostgreSQL, MongoDB)</li>
          <li>• Or import directly to the dashboard for viewing</li>
        </ul>
      </div>
    </div>
  )
}
