import { useState } from 'react'
import { useScraperStore } from '../store/useScraperStore'
import { Shield, Plus, Trash2, RefreshCw, AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react'

export default function ProxyManagerComponent() {
  const { 
    proxies, 
    addProxy, 
    removeProxy, 
    settings,
    updateSettings,
    proxyStats,
    banDetected,
    lastBanReason,
    clearBanStatus
  } = useScraperStore()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newProxy, setNewProxy] = useState({
    host: '',
    port: '',
    type: 'http',
    username: '',
    password: '',
    country: ''
  })

  const handleAddProxy = () => {
    if (!newProxy.host || !newProxy.port) {
      alert('Host and port are required')
      return
    }

    const proxy = {
      ...newProxy,
      id: `proxy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      port: parseInt(newProxy.port)
    }

    addProxy(proxy)
    setNewProxy({
      host: '',
      port: '',
      type: 'http',
      username: '',
      password: '',
      country: ''
    })
    setShowAddForm(false)
  }

  const handleImportProxies = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.txt'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const content = event.target.result
          let imported = []

          if (file.name.endsWith('.json')) {
            imported = JSON.parse(content)
          } else {
            // Parse text format: host:port:type:username:password
            const lines = content.split('\n').filter(l => l.trim())
            imported = lines.map((line, idx) => {
              const [host, port, type = 'http', username = '', password = ''] = line.split(':')
              return {
                id: `proxy_${Date.now()}_${idx}`,
                host: host.trim(),
                port: parseInt(port),
                type: type.trim() || 'http',
                username: username.trim(),
                password: password.trim()
              }
            })
          }

          imported.forEach(proxy => addProxy(proxy))
          alert(`Imported ${imported.length} proxies`)
        } catch (err) {
          alert('Error importing proxies: ' + err.message)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleExportProxies = () => {
    const data = JSON.stringify(proxies, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `proxies_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getProxyStatusColor = (proxy) => {
    if (!proxyStats?.proxies) return 'text-gray-400'
    const stats = proxyStats.proxies.find(p => p.id === proxy.id)
    if (!stats) return 'text-gray-400'
    
    if (stats.blacklisted) return 'text-red-500'
    if (stats.requests >= stats.maxRequests) return 'text-yellow-500'
    if (stats.healthy && stats.successRate > 80) return 'text-green-500'
    return 'text-gray-400'
  }

  const getProxyStatusIcon = (proxy) => {
    if (!proxyStats?.proxies) return <Shield className="w-4 h-4" />
    const stats = proxyStats.proxies.find(p => p.id === proxy.id)
    if (!stats) return <Shield className="w-4 h-4" />
    
    if (stats.blacklisted) return <XCircle className="w-4 h-4" />
    if (stats.requests >= stats.maxRequests) return <AlertTriangle className="w-4 h-4" />
    if (stats.healthy && stats.successRate > 80) return <CheckCircle className="w-4 h-4" />
    return <Shield className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      {/* Ban Alert */}
      {banDetected && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800">IP Ban Detected!</h4>
                <p className="text-sm text-red-700 mt-1">
                  {lastBanReason || 'Your IP has been blocked by Shopee. Please use a proxy or wait before continuing.'}
                </p>
                <p className="text-xs text-red-600 mt-2">
                  Recommendation: Enable proxy rotation or reset your network connection.
                </p>
              </div>
            </div>
            <button
              onClick={clearBanStatus}
              className="text-red-500 hover:text-red-700"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Proxy Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Proxy & Anti-Detection Settings
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Enable Proxy Rotation</label>
            <input
              type="checkbox"
              checked={settings.useProxy}
              onChange={(e) => updateSettings({ useProxy: e.target.checked })}
              className="w-4 h-4 text-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">Rotation Strategy</label>
              <select
                value={settings.rotationStrategy}
                onChange={(e) => updateSettings({ rotationStrategy: e.target.value })}
                disabled={!settings.useProxy}
                className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100"
              >
                <option value="round-robin">Round Robin</option>
                <option value="random">Random</option>
                <option value="least-used">Least Used</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Max Requests per Proxy</label>
              <input
                type="number"
                value={settings.maxRequestsPerProxy}
                onChange={(e) => updateSettings({ maxRequestsPerProxy: parseInt(e.target.value) })}
                disabled={!settings.useProxy}
                min="1"
                max="44"
                className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Randomize Request Delay</label>
            <input
              type="checkbox"
              checked={settings.randomizeDelay}
              onChange={(e) => updateSettings({ randomizeDelay: e.target.checked })}
              className="w-4 h-4 text-orange-500"
            />
          </div>

          {settings.randomizeDelay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Min Delay (ms)</label>
                <input
                  type="number"
                  value={settings.minDelay}
                  onChange={(e) => updateSettings({ minDelay: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Max Delay (ms)</label>
                <input
                  type="number"
                  value={settings.maxDelay}
                  onChange={(e) => updateSettings({ maxDelay: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Randomize Headers</label>
            <input
              type="checkbox"
              checked={settings.randomizeHeaders}
              onChange={(e) => updateSettings({ randomizeHeaders: e.target.checked })}
              className="w-4 h-4 text-orange-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Auto-Rotate on Ban Detection</label>
            <input
              type="checkbox"
              checked={settings.autoRotateOnBan}
              onChange={(e) => updateSettings({ autoRotateOnBan: e.target.checked })}
              className="w-4 h-4 text-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Proxy Statistics */}
      {proxyStats && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            Proxy Pool Statistics
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Proxies</p>
              <p className="text-2xl font-bold text-gray-900">{proxyStats.total}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">Healthy</p>
              <p className="text-2xl font-bold text-green-600">{proxyStats.healthy}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">Blacklisted</p>
              <p className="text-2xl font-bold text-red-600">{proxyStats.blacklisted}</p>
            </div>
          </div>
        </div>
      )}

      {/* Proxy List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Proxy List ({proxies.length})</h3>
          <div className="flex gap-2">
            <button
              onClick={handleImportProxies}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Import
            </button>
            {proxies.length > 0 && (
              <button
                onClick={handleExportProxies}
                className="px-3 py-1.5 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Export
              </button>
            )}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Proxy
            </button>
          </div>
        </div>

        {/* Add Proxy Form */}
        {showAddForm && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium mb-3">Add New Proxy</h4>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Host (e.g., 192.168.1.1)"
                value={newProxy.host}
                onChange={(e) => setNewProxy({ ...newProxy, host: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Port (e.g., 8080)"
                value={newProxy.port}
                onChange={(e) => setNewProxy({ ...newProxy, port: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <select
                value={newProxy.type}
                onChange={(e) => setNewProxy({ ...newProxy, type: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="socks5">SOCKS5</option>
              </select>
              <input
                type="text"
                placeholder="Country (optional)"
                value={newProxy.country}
                onChange={(e) => setNewProxy({ ...newProxy, country: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Username (optional)"
                value={newProxy.username}
                onChange={(e) => setNewProxy({ ...newProxy, username: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="password"
                placeholder="Password (optional)"
                value={newProxy.password}
                onChange={(e) => setNewProxy({ ...newProxy, password: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAddProxy}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
              >
                Add Proxy
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Proxy Table */}
        {proxies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No proxies configured</p>
            <p className="text-sm mt-1">Add proxies to enable IP rotation and avoid bans</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Host</th>
                  <th className="px-4 py-2 text-left">Port</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Country</th>
                  <th className="px-4 py-2 text-left">Requests</th>
                  <th className="px-4 py-2 text-left">Success Rate</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {proxies.map((proxy) => {
                  const stats = proxyStats?.proxies?.find(p => p.id === proxy.id)
                  return (
                    <tr key={proxy.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className={`flex items-center gap-2 ${getProxyStatusColor(proxy)}`}>
                          {getProxyStatusIcon(proxy)}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{proxy.host}</td>
                      <td className="px-4 py-3">{proxy.port}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {proxy.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">{proxy.country || '-'}</td>
                      <td className="px-4 py-3">
                        {stats ? `${stats.requests}/${stats.maxRequests}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {stats ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  stats.successRate > 80 ? 'bg-green-500' :
                                  stats.successRate > 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${stats.successRate}%` }}
                              />
                            </div>
                            <span className="text-xs">{stats.successRate}%</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeProxy(proxy.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Import Format Help */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-gray-700">
          <p className="font-semibold mb-1">Import Format:</p>
          <p><strong>JSON:</strong> Array of proxy objects with host, port, type, username, password</p>
          <p><strong>TXT:</strong> One proxy per line: host:port:type:username:password</p>
          <p className="mt-1 text-gray-600">Example: 192.168.1.1:8080:http:user:pass</p>
        </div>
      </div>
    </div>
  )
}
