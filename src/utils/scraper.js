// Scraper code to be injected into Shopee page
export const getScraperCode = () => `
(function() {
  window.__SHOPEE_SCRAPER__ = {
    findCards: function(mode) {
      mode = mode || 'main';
      var selectors = ['.shop-search-result-view__item', '.shopee-search-item-result__item', '[data-sqe="item"]', '.col-xs-2-4'];
      for (var i = 0; i < selectors.length; i++) {
        var els = document.querySelectorAll(selectors[i]);
        if (els.length >= 3) return Array.from(els);
      }
      return [];
    },
    
    extractName: function(card) {
      var el = card.querySelector('.line-clamp-2, [class*="line-clamp"]');
      if (el && el.innerText) return el.innerText.trim().substring(0, 200);
      var img = card.querySelector('img[alt]:not([alt=""])');
      if (img && img.alt && img.alt.length > 10) return img.alt;
      return 'N/A';
    },
    
    extractPrice: function(card) {
      var match = card.innerText.match(/Rp[\\s]*([\\d.,]+)/);
      return match ? 'Rp' + match[1].replace(/\\s/g, '') : 'N/A';
    },
    
    extractDiscount: function(card) {
      var match = card.innerText.match(/-?\\d+%/);
      return match ? match[0] : '-';
    },
    
    extractSold: function(card) {
      var match = card.innerText.match(/(\\d+[RBKrb]*\\+?\\s*terjual)/i);
      return match ? match[1] : '-';
    },
    
    extractRating: function(card) {
      var match = card.innerText.match(/([0-5]\\.\\d)/);
      return match ? match[1] : '-';
    },
    
    extractLocation: function(card) {
      var cities = ['Jakarta', 'Bandung', 'Surabaya', 'Tangerang', 'Bekasi', 'Depok', 'Semarang', 'Yogyakarta', 'Medan', 'Makassar'];
      for (var i = 0; i < cities.length; i++) {
        if (card.innerText.includes(cities[i])) return cities[i];
      }
      return '-';
    },
    
    extractLink: function(card) {
      var link = card.querySelector('a[href*="-i."]');
      return link ? link.href : 'N/A';
    },
    
    extractImage: function(card) {
      var imgs = card.querySelectorAll('img');
      for (var i = 0; i < imgs.length; i++) {
        var src = imgs[i].src || imgs[i].getAttribute('data-src');
        if (src && (src.includes('susercontent.com') || src.includes('shopee'))) return src;
      }
      return '';
    },
    
    scrape: function() {
      var cards = this.findCards();
      var products = [];
      var self = this;
      cards.forEach(function(card, i) {
        products.push({
          no: i + 1,
          name: self.extractName(card),
          price: self.extractPrice(card),
          discount: self.extractDiscount(card),
          sold: self.extractSold(card),
          rating: self.extractRating(card),
          location: self.extractLocation(card),
          link: self.extractLink(card),
          image: self.extractImage(card)
        });
      });
      return products;
    },
    
    getPageInfo: function() {
      var current = 1, total = 1;
      var activeBtn = document.querySelector('.shopee-page-controller .shopee-button-solid--primary');
      if (activeBtn) current = parseInt(activeBtn.innerText) || 1;
      var miniTotal = document.querySelector('.shopee-mini-page-controller__total');
      if (miniTotal) total = parseInt(miniTotal.innerText) || 1;
      return { current: current, total: total };
    },
    
    goNext: function() {
      var btn = document.querySelector('.shopee-mini-page-controller__next-btn:not([disabled])');
      if (btn) { btn.click(); return true; }
      btn = document.querySelector('.shopee-page-controller .shopee-icon-button--right:not([disabled])');
      if (btn) { btn.click(); return true; }
      return false;
    }
  };
  return 'ready';
})();
`;

// Export functions for CSV/JSON
export const exportToCSV = (products, filename) => {
  if (!products || products.length === 0) return;
  
  const headers = Object.keys(products[0]);
  const rows = products.map(row => 
    headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""').replace(/\n/g, ' ')}"`).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  
  downloadFile(csv, filename || `shopee_${Date.now()}.csv`, 'text/csv');
};

export const exportToJSON = (products, filename) => {
  if (!products || products.length === 0) return;
  const json = JSON.stringify(products, null, 2);
  downloadFile(json, filename || `shopee_${Date.now()}.json`, 'application/json');
};

export const exportToMD = (products, filename) => {
  if (!products || products.length === 0) return;
  
  let md = `# Shopee Products\n\n`;
  md += `> Scraped on ${new Date().toLocaleString()} | Total: **${products.length} products**\n\n`;
  md += `| No | Name | Price | Discount | Sold | Rating |\n`;
  md += `|----|------|-------|----------|------|--------|\n`;
  
  products.forEach(p => {
    const name = p.name.length > 50 ? p.name.substring(0, 50) + '...' : p.name;
    md += `| ${p.no} | ${name} | ${p.price} | ${p.discount} | ${p.sold} | ${p.rating} |\n`;
  });
  
  downloadFile(md, filename || `shopee_${Date.now()}.md`, 'text/markdown');
};

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Format currency
export const formatPrice = (price) => {
  if (!price || price === 'N/A') return '-';
  return price;
};

// Format number with suffix
export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};
