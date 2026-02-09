// Data Transformer - Transform JSON structures with field mapping and type conversion

export class DataTransformer {
  constructor() {
    this.fieldMappings = {}
    this.typeConverters = {}
    this.defaultTemplate = {}
  }

  // Set template with default values and types
  setTemplate(template) {
    this.defaultTemplate = template
    return this
  }

  // Add field mapping (sourceField -> targetField)
  addFieldMapping(sourceField, targetField) {
    this.fieldMappings[sourceField] = targetField
    return this
  }

  // Add multiple field mappings
  addFieldMappings(mappings) {
    Object.assign(this.fieldMappings, mappings)
    return this
  }

  // Add type converter for a field
  addTypeConverter(field, converter) {
    this.typeConverters[field] = converter
    return this
  }

  // Built-in type converters
  static typeConverters = {
    // Convert to number
    toNumber: (value) => {
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        // Handle Indonesian Rupiah format: "Rp74.250" -> 74250
        const cleaned = value.replace(/[^\d.-]/g, '').replace(/\./g, '')
        const num = parseFloat(cleaned)
        return isNaN(num) ? 0 : num
      }
      return 0
    },

    // Convert to string
    toString: (value) => {
      if (value === null || value === undefined) return ''
      return String(value)
    },

    // Convert to boolean
    toBoolean: (value) => {
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') {
        return ['true', 'yes', '1', 'on'].includes(value.toLowerCase())
      }
      return Boolean(value)
    },

    // Convert to integer
    toInteger: (value) => {
      const num = DataTransformer.typeConverters.toNumber(value)
      return Math.floor(num)
    },

    // Convert to float with decimals
    toFloat: (value, decimals = 2) => {
      const num = DataTransformer.typeConverters.toNumber(value)
      return parseFloat(num.toFixed(decimals))
    },

    // Convert to array
    toArray: (value) => {
      if (Array.isArray(value)) return value
      if (value === null || value === undefined) return []
      return [value]
    },

    // Parse rating (handles "4.2" -> 4.2)
    toRating: (value) => {
      const num = parseFloat(value)
      return isNaN(num) ? 0.0 : parseFloat(num.toFixed(1))
    },

    // Extract discount percentage from "-1%" -> 1
    toDiscountPercent: (value) => {
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        const match = value.match(/-?(\d+)%/)
        return match ? parseInt(match[1]) : 0
      }
      return 0
    },

    // Convert price string to number
    toPrice: (value) => {
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        // "Rp74.250" -> 74250
        const cleaned = value.replace(/[^\d]/g, '')
        return parseInt(cleaned) || 0
      }
      return 0
    },

    // Extract year from string or return number
    toYear: (value) => {
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        const match = value.match(/\b(19|20)\d{2}\b/)
        return match ? parseInt(match[0]) : new Date().getFullYear()
      }
      return new Date().getFullYear()
    },

    // Generate ISBN-like format
    toISBN: (id) => {
      // Generate fake ISBN from ID for demo purposes
      const hash = String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      return `978-${hash.toString().padStart(10, '0').slice(0, 10)}`
    }
  }

  // Get value from nested object using dot notation
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  // Transform single object
  transform(sourceData) {
    const result = {}
    
    // Start with template defaults
    Object.keys(this.defaultTemplate).forEach(key => {
      result[key] = this.defaultTemplate[key]
    })

    // Apply field mappings and transformations
    Object.entries(this.fieldMappings).forEach(([sourceField, targetField]) => {
      let value = this.getNestedValue(sourceData, sourceField)
      
      // If source field doesn't exist, skip (use default)
      if (value === undefined || value === null || value === '') {
        return
      }

      // Apply type converter if exists
      if (this.typeConverters[targetField]) {
        value = this.typeConverters[targetField](value)
      }

      result[targetField] = value
    })

    return result
  }

  // Transform array of objects
  transformBatch(sourceDataArray) {
    if (!Array.isArray(sourceDataArray)) {
      throw new Error('Input must be an array')
    }

    return sourceDataArray.map(item => this.transform(item))
  }

  // Create preset for Shopee to Book format
  static createShopeeToBookTransformer() {
    const transformer = new DataTransformer()

    // Set template with defaults
    transformer.setTemplate({
      id: '0',
      title: 'Untitled Book',
      author: 'Unknown Author',
      price: 0,
      originalPrice: 0,
      coverImage: '',
      rating: 0.0,
      reviewCount: 0,
      category: 'general',
      description: '',
      publisher: 'Unknown Publisher',
      publishedYear: new Date().getFullYear(),
      pages: 0,
      isbn: '978-0000000000',
      inStock: true,
      discount: 0,
      badge: null
    })

    // Field mappings
    transformer.addFieldMappings({
      'id': 'id',
      'name': 'title',
      'no': 'id', // Fallback if id not present
      'price': 'price',
      'price': 'originalPrice', // Will be adjusted by discount
      'image': 'coverImage',
      'rating': 'rating',
      'sold': 'reviewCount',
      'discount': 'discount',
      'link': 'description', // Use link as description fallback
      'location': 'publisher',
      'created_at': 'publishedYear'
    })

    // Type converters
    transformer.addTypeConverter('id', (value) => {
      // Extract number from "product_1770629686096_0" or use as-is
      if (typeof value === 'string' && value.startsWith('product_')) {
        const parts = value.split('_')
        return parts[parts.length - 1] || '0'
      }
      return String(value)
    })

    transformer.addTypeConverter('title', DataTransformer.typeConverters.toString)
    
    transformer.addTypeConverter('author', (value, sourceData) => {
      // Try to extract author from title
      const title = sourceData.name || sourceData.title || ''
      
      // Pattern: "Book Title - Author Name - Publisher"
      const parts = title.split('-').map(p => p.trim())
      if (parts.length >= 2) {
        const author = parts[1] // Second part is usually author
        // Return extracted author, not default
        return author || 'Unknown Author'
      }
      return 'Unknown Author'
    })

    transformer.addTypeConverter('price', (value) => {
      // Convert "Rp74.250" to 74.250 (keep as proper decimal)
      if (!value) return 0
      const str = String(value)
      // Remove "Rp" and spaces
      let cleaned = str.replace(/Rp/g, '').replace(/\s/g, '')
      // Replace dots with nothing for thousands separator, but keep actual decimal
      // Indonesian format: Rp74.250 means 74250
      cleaned = cleaned.replace(/\./g, '')
      const num = parseFloat(cleaned)
      if (isNaN(num)) return 0
      // Convert to decimal format: 74250 -> 74.250
      return parseFloat((num / 1000).toFixed(3))
    })

    transformer.addTypeConverter('originalPrice', (value, sourceData) => {
      const price = DataTransformer.typeConverters.toPrice(sourceData.price || 0) / 1000
      const discountPercent = DataTransformer.typeConverters.toDiscountPercent(sourceData.discount || '0%')
      
      if (discountPercent > 0) {
        // Calculate original price: price = original * (1 - discount/100)
        // So: original = price / (1 - discount/100)
        return parseFloat((price / (1 - discountPercent / 100)).toFixed(2))
      }
      return price
    })

    transformer.addTypeConverter('coverImage', DataTransformer.typeConverters.toString)
    
    transformer.addTypeConverter('rating', DataTransformer.typeConverters.toRating)
    
    transformer.addTypeConverter('reviewCount', (value) => {
      if (value === '-' || !value) return 0
      // "1000 terjual" -> 1000
      const match = String(value).match(/(\d+)/)
      return match ? parseInt(match[1]) : 0
    })

    transformer.addTypeConverter('category', (value, sourceData) => {
      // Try to detect category from title
      const title = (sourceData.name || sourceData.title || '').toLowerCase()
      
      if (title.includes('novel') || title.includes('fiction')) return 'fiction'
      if (title.includes('sejarah') || title.includes('history')) return 'history'
      if (title.includes('filsafat') || title.includes('philosophy')) return 'philosophy'
      if (title.includes('agama') || title.includes('religion')) return 'religion'
      if (title.includes('anak') || title.includes('children')) return 'children'
      
      return 'general'
    })

    transformer.addTypeConverter('description', (value, sourceData) => {
      // Use title as description if link is empty
      const title = sourceData.name || sourceData.title || ''
      return title || DataTransformer.typeConverters.toString(value)
    })

    transformer.addTypeConverter('publisher', (value, sourceData) => {
      // Try to extract publisher from title
      const title = sourceData.name || sourceData.title || ''
      
      // Pattern: "Book Title - Author Name - Publisher"
      const parts = title.split('-').map(p => p.trim())
      if (parts.length >= 3) {
        return parts[2] // Third part is usually publisher
      }
      
      // Or use location as publisher
      return value || 'Unknown Publisher'
    })

    transformer.addTypeConverter('publishedYear', (value) => {
      // Extract year from created_at or use current year
      if (value) {
        const year = new Date(value).getFullYear()
        return year > 1900 && year <= new Date().getFullYear() ? year : new Date().getFullYear()
      }
      return new Date().getFullYear()
    })

    transformer.addTypeConverter('pages', (value, sourceData) => {
      // Try to extract pages from description or use default
      if (value && typeof value === 'number') return value
      // Random pages between 200-400 for demo
      return Math.floor(Math.random() * 200) + 200
    })

    transformer.addTypeConverter('isbn', (value, sourceData) => {
      // Generate ISBN from product ID
      return DataTransformer.typeConverters.toISBN(sourceData.id || sourceData.no || '0')
    })

    transformer.addTypeConverter('inStock', (value, sourceData) => {
      // If sold data exists and is not "-", assume in stock
      return sourceData.sold !== '-' || true
    })

    transformer.addTypeConverter('discount', (value) => {
      return DataTransformer.typeConverters.toDiscountPercent(value || '0%')
    })

    transformer.addTypeConverter('badge', (value, sourceData) => {
      const rating = DataTransformer.typeConverters.toRating(sourceData.rating || 0)
      const reviewCount = parseInt(sourceData.sold?.match(/(\d+)/)?.[1] || 0)
      
      if (rating >= 4.5 && reviewCount > 500) return 'bestseller'
      if (reviewCount > 1000) return 'popular'
      if (sourceData.discount && DataTransformer.typeConverters.toDiscountPercent(sourceData.discount) > 10) return 'sale'
      
      return null
    })

    return transformer
  }

  // Export transformed data
  export(data, format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(data, null, 2)
      case 'typescript':
        return this.exportAsTypeScript(data)
      case 'javascript':
        return this.exportAsJavaScript(data)
      default:
        return JSON.stringify(data, null, 2)
    }
  }

  // Export as TypeScript
  exportAsTypeScript(data) {
    const items = Array.isArray(data) ? data : [data]
    
    let output = '// Generated TypeScript data\n\n'
    output += 'interface BookData {\n'
    
    // Generate interface from first item
    if (items.length > 0) {
      Object.entries(items[0]).forEach(([key, value]) => {
        const type = typeof value === 'number' ? 'number' :
                    typeof value === 'boolean' ? 'boolean' :
                    value === null ? 'string | null' : 'string'
        output += `  ${key}: ${type};\n`
      })
    }
    
    output += '}\n\n'
    output += `const books: BookData[] = [\n`
    
    // Generate object literals (not JSON)
    items.forEach((item, index) => {
      output += '  {\n'
      Object.entries(item).forEach(([key, value]) => {
        const formattedValue = this.formatValueForTS(value)
        output += `    ${key}: ${formattedValue},\n`
      })
      output += '  }'
      if (index < items.length - 1) output += ','
      output += '\n'
    })
    
    output += '];\n\nexport default books;\n'
    
    return output
  }

  // Format value for TypeScript/JavaScript object notation
  formatValueForTS(value) {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`
    if (typeof value === 'number') return String(value)
    if (typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) return `[${value.map(v => this.formatValueForTS(v)).join(', ')}]`
    if (typeof value === 'object') {
      const entries = Object.entries(value).map(([k, v]) => `${k}: ${this.formatValueForTS(v)}`)
      return `{ ${entries.join(', ')} }`
    }
    return String(value)
  }

  // Export as JavaScript
  exportAsJavaScript(data) {
    const items = Array.isArray(data) ? data : [data]
    let output = '// Generated JavaScript data\n\n'
    output += `const books = [\n`
    
    items.forEach((item, index) => {
      output += '  {\n'
      Object.entries(item).forEach(([key, value]) => {
        const formattedValue = this.formatValueForTS(value)
        output += `    ${key}: ${formattedValue},\n`
      })
      output += '  }'
      if (index < items.length - 1) output += ','
      output += '\n'
    })
    
    output += '];\n\nexport default books;\n'
    return output
  }
}

// Preset transformer configurations
export const presets = {
  shopeeToBook: () => DataTransformer.createShopeeToBookTransformer(),
  
  // Add more presets here
  shopeeToProduct: () => {
    const transformer = new DataTransformer()
    // ... configuration
    return transformer
  }
}

// Helper to download file
export const downloadTransformedData = (data, filename, format = 'json') => {
  const transformer = new DataTransformer()
  const content = transformer.export(data, format)
  const extension = format === 'typescript' ? 'ts' : 
                    format === 'javascript' ? 'js' : 'json'
  
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.${extension}`
  a.click()
  URL.revokeObjectURL(url)
}
