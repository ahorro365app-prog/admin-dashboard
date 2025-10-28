'use client'

import React, { useMemo, useCallback, useEffect, useState } from 'react'

// Hook para debounce
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook para throttle
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = React.useRef<number>(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

// Hook para lazy loading
export function useLazyLoad(ref: React.RefObject<HTMLElement>, options?: IntersectionObserverInit) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      options
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [ref, options])

  return isIntersecting
}

// Hook para virtualización
export function useVirtualization<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    )
    return { start: Math.max(0, start - overscan), end }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index
    }))
  }, [items, visibleRange])

  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.start * itemHeight

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  }
}

// Hook para caché de datos
export function useCache<T>(key: string, fetcher: () => Promise<T>, ttl: number = 5 * 60 * 1000) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const cacheKey = `cache_${key}`
  const timestampKey = `cache_timestamp_${key}`

  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(cacheKey)
      const timestamp = localStorage.getItem(timestampKey)
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp)
        if (age < ttl) {
          return JSON.parse(cached)
        }
      }
    } catch (error) {
      console.warn('Error reading from cache:', error)
    }
    return null
  }, [cacheKey, timestampKey, ttl])

  const setCachedData = useCallback((newData: T) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(newData))
      localStorage.setItem(timestampKey, Date.now().toString())
    } catch (error) {
      console.warn('Error writing to cache:', error)
    }
  }, [cacheKey, timestampKey])

  const fetchData = useCallback(async () => {
    const cached = getCachedData()
    if (cached) {
      setData(cached)
      return cached
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      setData(result)
      setCachedData(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [fetcher, getCachedData, setCachedData])

  const invalidateCache = useCallback(() => {
    localStorage.removeItem(cacheKey)
    localStorage.removeItem(timestampKey)
  }, [cacheKey, timestampKey])

  useEffect(() => {
    const cached = getCachedData()
    if (cached) {
      setData(cached)
    }
  }, [getCachedData])

  return {
    data,
    loading,
    error,
    fetchData,
    invalidateCache
  }
}

// Hook para paginación optimizada
export function usePagination<T>(
  items: T[],
  itemsPerPage: number = 10,
  initialPage: number = 1
) {
  const [currentPage, setCurrentPage] = useState(initialPage)

  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  const paginatedItems = useMemo(() => {
    return items.slice(startIndex, endIndex)
  }, [items, startIndex, endIndex])

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  const resetPage = useCallback(() => {
    setCurrentPage(1)
  }, [])

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  }
}

// Hook para filtros optimizados
export function useFilters<T>(
  items: T[],
  filterConfig: Record<string, (item: T, value: any) => boolean>
) {
  const [filters, setFilters] = useState<Record<string, any>>({})

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === '') return true
        const filterFn = filterConfig[key]
        return filterFn ? filterFn(item, value) : true
      })
    })
  }, [items, filters, filterConfig])

  const setFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearFilter = useCallback((key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[key]
      return newFilters
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({})
  }, [])

  return {
    filters,
    filteredItems,
    setFilter,
    clearFilter,
    clearAllFilters
  }
}

// Hook para ordenamiento optimizado
export function useSorting<T>(
  items: T[],
  initialSortKey?: keyof T,
  initialSortDirection: 'asc' | 'desc' = 'asc'
) {
  const [sortKey, setSortKey] = useState<keyof T | undefined>(initialSortKey)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection)

  const sortedItems = useMemo(() => {
    if (!sortKey) return items

    return [...items].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [items, sortKey, sortDirection])

  const handleSort = useCallback((key: keyof T) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }, [sortKey])

  return {
    sortKey,
    sortDirection,
    sortedItems,
    handleSort
  }
}

// Hook para medición de rendimiento
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (renderTime > 16) { // Más de un frame (16ms)
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`)
      }
    }
  }, [componentName])
}

// Hook para memoria
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  } | null>(null)

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        })
      }
    }

    updateMemoryInfo()
    const interval = setInterval(updateMemoryInfo, 5000)

    return () => clearInterval(interval)
  }, [])

  return memoryInfo
}

// Componente para lazy loading de imágenes
interface LazyImageProps {
  src: string
  alt: string
  placeholder?: string
  className?: string
  onLoad?: () => void
  onError?: () => void
}

export function LazyImage({ 
  src, 
  alt, 
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+',
  className = '',
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setIsInView(true)
      }
    })
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1
    })

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [handleIntersection])

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {!isLoaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm"
        />
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => {
            setIsLoaded(true)
            onLoad?.()
          }}
          onError={() => {
            setIsLoaded(true)
            onError?.()
          }}
        />
      )}
    </div>
  )
}







