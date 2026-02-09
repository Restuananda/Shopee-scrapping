// Proxy Manager for IP Rotation and Anti-Detection
export class ProxyManager {
  constructor(config = {}) {
    this.proxies = config.proxies || [];
    this.currentProxyIndex = 0;
    this.proxyHealth = new Map();
    this.requestCounts = new Map();
    this.blacklistedProxies = new Set();
    
    // Configuration
    this.maxRequestsPerProxy = config.maxRequestsPerProxy || 40; // Stay below 44 page limit
    this.rotationStrategy = config.rotationStrategy || 'round-robin'; // 'round-robin', 'random', 'least-used'
    this.retryAttempts = config.retryAttempts || 3;
    this.healthCheckInterval = config.healthCheckInterval || 300000; // 5 minutes
    
    // User-Agent rotation
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    this.initializeProxies();
  }

  // Initialize proxy health tracking
  initializeProxies() {
    this.proxies.forEach(proxy => {
      this.proxyHealth.set(proxy.id, {
        healthy: true,
        lastChecked: Date.now(),
        failures: 0,
        successRate: 100
      });
      this.requestCounts.set(proxy.id, 0);
    });
  }

  // Add proxy to the pool
  addProxy(proxy) {
    const proxyWithId = { ...proxy, id: proxy.id || this.generateProxyId() };
    this.proxies.push(proxyWithId);
    this.proxyHealth.set(proxyWithId.id, {
      healthy: true,
      lastChecked: Date.now(),
      failures: 0,
      successRate: 100
    });
    this.requestCounts.set(proxyWithId.id, 0);
    return proxyWithId;
  }

  // Remove proxy from pool
  removeProxy(proxyId) {
    this.proxies = this.proxies.filter(p => p.id !== proxyId);
    this.proxyHealth.delete(proxyId);
    this.requestCounts.delete(proxyId);
    this.blacklistedProxies.delete(proxyId);
  }

  // Generate unique proxy ID
  generateProxyId() {
    return `proxy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get next proxy based on rotation strategy
  getNextProxy() {
    const availableProxies = this.proxies.filter(p => 
      !this.blacklistedProxies.has(p.id) &&
      this.proxyHealth.get(p.id)?.healthy &&
      this.requestCounts.get(p.id) < this.maxRequestsPerProxy
    );

    if (availableProxies.length === 0) {
      // Reset request counts if all proxies are exhausted
      this.resetRequestCounts();
      return this.getNextProxy();
    }

    let selectedProxy;

    switch (this.rotationStrategy) {
      case 'random':
        selectedProxy = availableProxies[Math.floor(Math.random() * availableProxies.length)];
        break;
      
      case 'least-used':
        selectedProxy = availableProxies.reduce((min, proxy) => 
          this.requestCounts.get(proxy.id) < this.requestCounts.get(min.id) ? proxy : min
        );
        break;
      
      case 'round-robin':
      default:
        this.currentProxyIndex = (this.currentProxyIndex + 1) % availableProxies.length;
        selectedProxy = availableProxies[this.currentProxyIndex];
        break;
    }

    // Increment request count
    this.requestCounts.set(selectedProxy.id, this.requestCounts.get(selectedProxy.id) + 1);
    
    return selectedProxy;
  }

  // Get random User-Agent
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  // Mark proxy as failed
  markProxyFailed(proxyId, error) {
    const health = this.proxyHealth.get(proxyId);
    if (!health) return;

    health.failures++;
    health.successRate = Math.max(0, health.successRate - 10);
    
    // Blacklist if too many failures
    if (health.failures >= 3 || health.successRate < 30) {
      health.healthy = false;
      this.blacklistedProxies.add(proxyId);
      console.warn(`Proxy ${proxyId} blacklisted due to failures`);
    }

    this.proxyHealth.set(proxyId, health);
  }

  // Mark proxy as successful
  markProxySuccess(proxyId) {
    const health = this.proxyHealth.get(proxyId);
    if (!health) return;

    health.failures = Math.max(0, health.failures - 1);
    health.successRate = Math.min(100, health.successRate + 2);
    health.lastChecked = Date.now();
    
    this.proxyHealth.set(proxyId, health);
  }

  // Reset request counts for all proxies
  resetRequestCounts() {
    this.requestCounts.forEach((_, proxyId) => {
      this.requestCounts.set(proxyId, 0);
    });
    console.log('Request counts reset for all proxies');
  }

  // Reset blacklisted proxies
  resetBlacklist() {
    this.blacklistedProxies.clear();
    this.proxyHealth.forEach((health, proxyId) => {
      health.healthy = true;
      health.failures = 0;
      health.successRate = 100;
    });
    console.log('Proxy blacklist cleared');
  }

  // Get proxy statistics
  getStats() {
    const stats = {
      total: this.proxies.length,
      healthy: 0,
      blacklisted: this.blacklistedProxies.size,
      proxies: []
    };

    this.proxies.forEach(proxy => {
      const health = this.proxyHealth.get(proxy.id);
      const requests = this.requestCounts.get(proxy.id);
      
      if (health?.healthy) stats.healthy++;
      
      stats.proxies.push({
        id: proxy.id,
        host: proxy.host,
        port: proxy.port,
        type: proxy.type,
        healthy: health?.healthy || false,
        blacklisted: this.blacklistedProxies.has(proxy.id),
        requests: requests || 0,
        maxRequests: this.maxRequestsPerProxy,
        successRate: health?.successRate || 0,
        failures: health?.failures || 0
      });
    });

    return stats;
  }

  // Build proxy configuration for fetch/axios
  buildProxyConfig(proxy) {
    if (!proxy) return null;

    const config = {
      protocol: proxy.type || 'http',
      host: proxy.host,
      port: proxy.port
    };

    if (proxy.username && proxy.password) {
      config.auth = {
        username: proxy.username,
        password: proxy.password
      };
    }

    return config;
  }

  // Format proxy URL
  getProxyUrl(proxy) {
    if (!proxy) return null;

    let url = `${proxy.type || 'http'}://`;
    
    if (proxy.username && proxy.password) {
      url += `${proxy.username}:${proxy.password}@`;
    }
    
    url += `${proxy.host}:${proxy.port}`;
    
    return url;
  }

  // Export proxy list
  exportProxies() {
    return this.proxies.map(p => ({
      id: p.id,
      host: p.host,
      port: p.port,
      type: p.type,
      username: p.username,
      country: p.country
    }));
  }

  // Import proxy list
  importProxies(proxies) {
    proxies.forEach(proxy => this.addProxy(proxy));
  }
}

// Delay utility with randomization for human-like behavior
export const randomDelay = (min = 2000, max = 5000) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Detect if IP is banned (based on response patterns)
export const detectBan = (response, html) => {
  const banIndicators = [
    'captcha',
    'unusual traffic',
    'blocked',
    'access denied',
    'rate limit',
    'too many requests',
    'suspended',
    'verification required'
  ];

  const responseText = (html || '').toLowerCase();
  
  // Check response status
  if (response?.status === 429 || response?.status === 403) {
    return {
      isBanned: true,
      reason: `HTTP ${response.status} - Rate limit or forbidden`
    };
  }

  // Check response content
  for (const indicator of banIndicators) {
    if (responseText.includes(indicator)) {
      return {
        isBanned: true,
        reason: `Detected ban indicator: "${indicator}"`
      };
    }
  }

  return {
    isBanned: false,
    reason: null
  };
};

// Request headers with fingerprint randomization
export const getRandomizedHeaders = (userAgent = null) => {
  const headers = {
    'User-Agent': userAgent || getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
  };

  // Randomize some headers for fingerprint variation
  if (Math.random() > 0.5) {
    headers['Accept-Language'] = 'id-ID,id;q=0.9,en;q=0.8';
  }

  return headers;
};

// Get random User-Agent
const getRandomUserAgent = () => {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};
