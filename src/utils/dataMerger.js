// Data Merger Utility - Combine multiple scrape files and prepare for database

export class DataMerger {
  constructor() {
    this.supportedFormats = ['csv', 'json', 'md'];
    this.mergedData = [];
    this.duplicates = [];
    this.errors = [];
  }

  // Parse CSV content
  parseCSV(content) {
    try {
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length < 2) throw new Error('CSV file is empty or invalid');

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const products = [];

      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length === headers.length) {
          const product = {};
          headers.forEach((header, index) => {
            product[header] = values[index].replace(/^"|"$/g, '').trim();
          });
          products.push(product);
        }
      }

      return products;
    } catch (error) {
      throw new Error(`CSV parsing error: ${error.message}`);
    }
  }

  // Parse CSV line handling quoted values
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current); // Add last value

    return values;
  }

  // Parse JSON content
  parseJSON(content) {
    try {
      const data = JSON.parse(content);
      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array of products');
      }
      return data;
    } catch (error) {
      throw new Error(`JSON parsing error: ${error.message}`);
    }
  }

  // Parse Markdown content
  parseMarkdown(content) {
    try {
      const lines = content.split('\n');
      const products = [];
      let inTable = false;
      let headers = [];

      for (const line of lines) {
        const trimmed = line.trim();
        
        // Find table header
        if (trimmed.startsWith('| No |') || trimmed.startsWith('|No|')) {
          headers = trimmed.split('|')
            .map(h => h.trim())
            .filter(h => h.length > 0);
          inTable = true;
          continue;
        }

        // Skip separator line
        if (trimmed.match(/^\|[\s-|]+\|$/)) {
          continue;
        }

        // Parse table rows
        if (inTable && trimmed.startsWith('|')) {
          const values = trimmed.split('|')
            .map(v => v.trim())
            .filter((v, i) => i > 0 && i <= headers.length);

          if (values.length === headers.length) {
            const product = {};
            headers.forEach((header, index) => {
              product[header.toLowerCase()] = values[index];
            });
            products.push(product);
          }
        }

        // Stop at end of table
        if (inTable && !trimmed.startsWith('|')) {
          break;
        }
      }

      return products;
    } catch (error) {
      throw new Error(`Markdown parsing error: ${error.message}`);
    }
  }

  // Detect file format and parse
  parseFile(filename, content) {
    const ext = filename.split('.').pop().toLowerCase();
    
    switch (ext) {
      case 'csv':
        return this.parseCSV(content);
      case 'json':
        return this.parseJSON(content);
      case 'md':
        return this.parseMarkdown(content);
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  // Normalize product data structure
  normalizeProduct(product, index) {
    return {
      id: product.id || `product_${Date.now()}_${index}`,
      no: parseInt(product.no || product.No || index + 1),
      name: product.name || product.Name || 'N/A',
      price: product.price || product.Price || 'N/A',
      discount: product.discount || product.Discount || '-',
      sold: product.sold || product.Sold || '-',
      rating: product.rating || product.Rating || '-',
      location: product.location || product.Location || '-',
      link: product.link || product.Link || 'N/A',
      image: product.image || product.Image || '',
      // Database fields
      created_at: product.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source_file: product.source_file || '',
      import_batch: product.import_batch || Date.now()
    };
  }

  // Check if product is duplicate
  isDuplicate(product, existingProducts) {
    return existingProducts.some(existing => 
      (existing.link !== 'N/A' && existing.link === product.link) ||
      (existing.name === product.name && existing.price === product.price)
    );
  }

  // Merge multiple files
  async mergeFiles(files, options = {}) {
    const {
      removeDuplicates = true,
      renumberProducts = true,
      addMetadata = true
    } = options;

    this.mergedData = [];
    this.duplicates = [];
    this.errors = [];

    for (const file of files) {
      try {
        const products = this.parseFile(file.name, file.content);
        
        for (const product of products) {
          const normalized = this.normalizeProduct(product, this.mergedData.length);
          
          if (addMetadata) {
            normalized.source_file = file.name;
          }

          if (removeDuplicates && this.isDuplicate(normalized, this.mergedData)) {
            this.duplicates.push(normalized);
          } else {
            this.mergedData.push(normalized);
          }
        }
      } catch (error) {
        this.errors.push({
          file: file.name,
          error: error.message
        });
      }
    }

    // Renumber if requested
    if (renumberProducts) {
      this.mergedData.forEach((product, index) => {
        product.no = index + 1;
      });
    }

    return {
      products: this.mergedData,
      duplicates: this.duplicates,
      errors: this.errors,
      stats: {
        totalFiles: files.length,
        totalProducts: this.mergedData.length,
        duplicatesRemoved: this.duplicates.length,
        errors: this.errors.length
      }
    };
  }

  // Generate SQL INSERT statements
  generateSQL(tableName = 'products', options = {}) {
    const {
      includeId = false,
      batchSize = 100
    } = options;

    if (this.mergedData.length === 0) {
      return '';
    }

    const columns = includeId 
      ? ['id', 'no', 'name', 'price', 'discount', 'sold', 'rating', 'location', 'link', 'image', 'created_at', 'updated_at', 'source_file', 'import_batch']
      : ['no', 'name', 'price', 'discount', 'sold', 'rating', 'location', 'link', 'image', 'created_at', 'updated_at', 'source_file', 'import_batch'];

    let sql = '';
    const batches = Math.ceil(this.mergedData.length / batchSize);

    for (let b = 0; b < batches; b++) {
      const start = b * batchSize;
      const end = Math.min(start + batchSize, this.mergedData.length);
      const batch = this.mergedData.slice(start, end);

      sql += `-- Batch ${b + 1} of ${batches} (${batch.length} records)\n`;
      sql += `INSERT INTO ${tableName} (${columns.join(', ')})\nVALUES\n`;

      const values = batch.map(product => {
        const vals = columns.map(col => {
          const val = product[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number') return val;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        return `  (${vals.join(', ')})`;
      });

      sql += values.join(',\n');
      sql += ';\n\n';
    }

    return sql;
  }

  // Generate CREATE TABLE statement
  generateCreateTable(tableName = 'products') {
    return `-- Create products table
CREATE TABLE IF NOT EXISTS ${tableName} (
  id VARCHAR(255) PRIMARY KEY,
  no INT,
  name VARCHAR(500),
  price VARCHAR(100),
  discount VARCHAR(50),
  sold VARCHAR(100),
  rating VARCHAR(10),
  location VARCHAR(100),
  link TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  source_file VARCHAR(255),
  import_batch BIGINT,
  INDEX idx_no (no),
  INDEX idx_name (name),
  INDEX idx_price (price),
  INDEX idx_rating (rating),
  INDEX idx_location (location),
  INDEX idx_import_batch (import_batch)
);

`;
  }

  // Export merged data as JSON
  exportJSON() {
    return JSON.stringify(this.mergedData, null, 2);
  }

  // Export merged data as CSV
  exportCSV() {
    if (this.mergedData.length === 0) return '';

    const headers = Object.keys(this.mergedData[0]);
    const csvLines = [headers.join(',')];

    this.mergedData.forEach(product => {
      const values = headers.map(header => {
        const value = product[header] || '';
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvLines.push(values.join(','));
    });

    return csvLines.join('\n');
  }

  // Export for MongoDB
  exportMongoDB() {
    const documents = this.mergedData.map(product => {
      const doc = { ...product };
      doc._id = doc.id;
      delete doc.id;
      return doc;
    });

    return JSON.stringify(documents, null, 2);
  }

  // Export for PostgreSQL (COPY format)
  exportPostgreSQL(tableName = 'products') {
    if (this.mergedData.length === 0) return '';

    const columns = ['id', 'no', 'name', 'price', 'discount', 'sold', 'rating', 'location', 'link', 'image', 'created_at', 'updated_at', 'source_file', 'import_batch'];
    
    let output = `-- PostgreSQL COPY format\n`;
    output += `COPY ${tableName} (${columns.join(', ')}) FROM stdin;\n`;

    this.mergedData.forEach(product => {
      const values = columns.map(col => {
        const val = product[col];
        if (val === null || val === undefined) return '\\N';
        return String(val).replace(/\t/g, '\\t').replace(/\n/g, '\\n');
      });
      output += values.join('\t') + '\n';
    });

    output += '\\.\n';
    return output;
  }

  // Get statistics
  getStats() {
    if (this.mergedData.length === 0) {
      return {
        total: 0,
        byLocation: {},
        priceRange: { min: 0, max: 0 },
        avgRating: 0,
        withDiscount: 0
      };
    }

    const stats = {
      total: this.mergedData.length,
      byLocation: {},
      priceRange: { min: Infinity, max: 0 },
      avgRating: 0,
      withDiscount: 0,
      bySourceFile: {}
    };

    let totalRating = 0;
    let ratingCount = 0;

    this.mergedData.forEach(product => {
      // Location stats
      if (product.location && product.location !== '-') {
        stats.byLocation[product.location] = (stats.byLocation[product.location] || 0) + 1;
      }

      // Price range
      const price = parseInt(product.price.replace(/[^0-9]/g, '')) || 0;
      if (price > 0) {
        stats.priceRange.min = Math.min(stats.priceRange.min, price);
        stats.priceRange.max = Math.max(stats.priceRange.max, price);
      }

      // Rating
      const rating = parseFloat(product.rating);
      if (!isNaN(rating)) {
        totalRating += rating;
        ratingCount++;
      }

      // Discount
      if (product.discount && product.discount !== '-') {
        stats.withDiscount++;
      }

      // Source file
      if (product.source_file) {
        stats.bySourceFile[product.source_file] = (stats.bySourceFile[product.source_file] || 0) + 1;
      }
    });

    stats.avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : 0;
    if (stats.priceRange.min === Infinity) stats.priceRange.min = 0;

    return stats;
  }
}

// Helper function to read file as text
export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Download helper
export const downloadFile = (content, filename, type = 'text/plain') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
