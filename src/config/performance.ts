// Configuración de rendimiento para el admin dashboard

export const PERFORMANCE_CONFIG = {
  // Configuración de debounce
  DEBOUNCE_DELAYS: {
    SEARCH: 300,
    FILTER: 500,
    API_CALL: 1000
  },

  // Configuración de throttle
  THROTTLE_LIMITS: {
    SCROLL: 16, // 60fps
    RESIZE: 100,
    API_REQUEST: 2000
  },

  // Configuración de caché
  CACHE_TTL: {
    USER_DATA: 5 * 60 * 1000, // 5 minutos
    ANALYTICS_DATA: 2 * 60 * 1000, // 2 minutos
    STATIC_DATA: 30 * 60 * 1000 // 30 minutos
  },

  // Configuración de paginación
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    LOAD_MORE_THRESHOLD: 0.8
  },

  // Configuración de lazy loading
  LAZY_LOADING: {
    INTERSECTION_THRESHOLD: 0.1,
    ROOT_MARGIN: '50px'
  },

  // Configuración de virtualización
  VIRTUALIZATION: {
    ITEM_HEIGHT: 50,
    OVERSCAN: 5,
    CONTAINER_HEIGHT: 400
  },

  // Configuración de memoria
  MEMORY_LIMITS: {
    MAX_CACHED_ITEMS: 1000,
    CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutos
    MEMORY_WARNING_THRESHOLD: 0.8
  },

  // Configuración de red
  NETWORK: {
    TIMEOUT: 10000, // 10 segundos
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
  },

  // Configuración de animaciones
  ANIMATIONS: {
    DURATION: 200,
    EASING: 'ease-in-out',
    REDUCE_MOTION: false
  }
}

// Utilidades de rendimiento
export const PerformanceUtils = {
  // Medir tiempo de ejecución
  measureTime: (name: string, fn: () => void) => {
    const start = performance.now()
    fn()
    const end = performance.now()
    console.log(`${name} took ${end - start} milliseconds`)
  },

  // Medir tiempo de función async
  measureAsyncTime: async (name: string, fn: () => Promise<any>) => {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    console.log(`${name} took ${end - start} milliseconds`)
    return result
  },

  // Verificar si el dispositivo es lento
  isSlowDevice: () => {
    const connection = (navigator as any).connection
    if (connection) {
      return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'
    }
    return false
  },

  // Verificar si el usuario prefiere movimiento reducido
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  // Optimizar imágenes
  optimizeImageUrl: (url: string, width?: number, height?: number, quality: number = 80) => {
    if (!url) return url
    
    // Si es una URL de Supabase, agregar parámetros de optimización
    if (url.includes('supabase')) {
      const params = new URLSearchParams()
      if (width) params.append('width', width.toString())
      if (height) params.append('height', height.toString())
      params.append('quality', quality.toString())
      params.append('format', 'webp')
      
      return `${url}?${params.toString()}`
    }
    
    return url
  },

  // Limpiar caché
  clearCache: () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name)
        })
      })
    }
  },

  // Verificar memoria disponible
  getMemoryInfo: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      }
    }
    return null
  },

  // Optimizar bundle
  optimizeBundle: () => {
    // Lazy load de componentes pesados
    const lazyComponents = {
      Charts: () => import('@/components/analytics/OptimizedCharts'),
      Table: () => import('@/components/users/OptimizedUsersTable'),
      Export: () => import('@/components/common/ExportModal')
    }
    
    return lazyComponents
  }
}

// Configuración de errores de rendimiento
export const PERFORMANCE_ERRORS = {
  SLOW_RENDER: 'Render time exceeded 16ms',
  HIGH_MEMORY: 'Memory usage exceeded 80%',
  SLOW_API: 'API response time exceeded 5s',
  LARGE_BUNDLE: 'Bundle size exceeded 1MB'
}

// Configuración de métricas
export const PERFORMANCE_METRICS = {
  FCP: 'first-contentful-paint',
  LCP: 'largest-contentful-paint',
  FID: 'first-input-delay',
  CLS: 'cumulative-layout-shift',
  TTFB: 'time-to-first-byte'
}

// Hook para monitoreo de rendimiento
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState<Record<string, number>>({})
  
  React.useEffect(() => {
    // Observar métricas de Core Web Vitals
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          setMetrics(prev => ({
            ...prev,
            [entry.name]: entry.value || entry.duration
          }))
        })
      })
      
      // Observar diferentes tipos de métricas
      observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] })
      
      return () => observer.disconnect()
    }
  }, [])
  
  return metrics
}

// Configuración de optimización de imágenes
export const IMAGE_OPTIMIZATION = {
  BREAKPOINTS: {
    mobile: 320,
    tablet: 768,
    desktop: 1024,
    large: 1440
  },
  
  QUALITY: {
    low: 60,
    medium: 80,
    high: 95
  },
  
  FORMATS: ['webp', 'avif', 'jpeg', 'png']
}

// Configuración de compresión
export const COMPRESSION_CONFIG = {
  GZIP: true,
  BROTLI: true,
  MINIFY: true,
  TREE_SHAKING: true
}

export default PERFORMANCE_CONFIG







