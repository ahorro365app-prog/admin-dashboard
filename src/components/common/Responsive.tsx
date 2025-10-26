'use client'

import React from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveContainer({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ResponsiveGrid({ 
  children, 
  cols = { default: 1, sm: 2, lg: 3 },
  gap = 'md',
  className = ''
}: ResponsiveGridProps) {
  const getGapClass = () => {
    switch (gap) {
      case 'sm': return 'gap-2'
      case 'md': return 'gap-4'
      case 'lg': return 'gap-6'
      default: return 'gap-4'
    }
  }

  const getGridClass = () => {
    const baseClass = 'grid'
    const gapClass = getGapClass()
    
    let colsClass = ''
    if (cols.default) colsClass += ` grid-cols-${cols.default}`
    if (cols.sm) colsClass += ` sm:grid-cols-${cols.sm}`
    if (cols.md) colsClass += ` md:grid-cols-${cols.md}`
    if (cols.lg) colsClass += ` lg:grid-cols-${cols.lg}`
    if (cols.xl) colsClass += ` xl:grid-cols-${cols.xl}`
    
    return `${baseClass} ${gapClass} ${colsClass}`
  }

  return (
    <div className={`${getGridClass()} ${className}`}>
      {children}
    </div>
  )
}

interface ResponsiveCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  shadow?: 'sm' | 'md' | 'lg'
}

export function ResponsiveCard({ 
  children, 
  className = '',
  padding = 'md',
  shadow = 'md'
}: ResponsiveCardProps) {
  const getPaddingClass = () => {
    switch (padding) {
      case 'sm': return 'p-4'
      case 'md': return 'p-4 sm:p-6'
      case 'lg': return 'p-6 sm:p-8'
      default: return 'p-4 sm:p-6'
    }
  }

  const getShadowClass = () => {
    switch (shadow) {
      case 'sm': return 'shadow-sm'
      case 'md': return 'shadow'
      case 'lg': return 'shadow-lg'
      default: return 'shadow'
    }
  }

  return (
    <div className={`bg-white rounded-lg ${getShadowClass()} ${getPaddingClass()} ${className}`}>
      {children}
    </div>
  )
}

interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
  scrollable?: boolean
}

export function ResponsiveTable({ 
  children, 
  className = '',
  scrollable = true
}: ResponsiveTableProps) {
  const tableClass = scrollable 
    ? 'overflow-x-auto' 
    : 'overflow-hidden'

  return (
    <div className={`${tableClass} ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        {children}
      </table>
    </div>
  )
}

interface ResponsiveButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
}

export function ResponsiveButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  onClick,
  disabled = false,
  loading = false
}: ResponsiveButtonProps) {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary': return 'bg-blue-600 hover:bg-blue-700 text-white'
      case 'secondary': return 'bg-gray-600 hover:bg-gray-700 text-white'
      case 'danger': return 'bg-red-600 hover:bg-red-700 text-white'
      case 'success': return 'bg-green-600 hover:bg-green-700 text-white'
      default: return 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'px-3 py-2 text-sm'
      case 'md': return 'px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base'
      case 'lg': return 'px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg'
      default: return 'px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base'
    }
  }

  const getWidthClass = () => {
    return fullWidth ? 'w-full' : 'w-auto'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-md
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${getVariantClass()}
        ${getSizeClass()}
        ${getWidthClass()}
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Procesando...</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}

interface ResponsiveInputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  label?: string
  error?: string
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ResponsiveInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  label,
  error,
  disabled = false,
  className = '',
  size = 'md'
}: ResponsiveInputProps) {
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'px-3 py-2 text-sm'
      case 'md': return 'px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base'
      case 'lg': return 'px-4 py-3 text-base sm:px-6 sm:py-4 sm:text-lg'
      default: return 'px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base'
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={`
          w-full border rounded-md
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-300' : 'border-gray-300'}
          ${getSizeClass()}
        `}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function MobileMenu({ isOpen, onClose, children }: MobileMenuProps) {
  return (
    <>
      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={onClose}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface ResponsiveTextProps {
  children: React.ReactNode
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  color?: 'gray' | 'blue' | 'red' | 'green' | 'yellow'
  className?: string
}

export function ResponsiveText({
  children,
  size = 'base',
  weight = 'normal',
  color = 'gray',
  className = ''
}: ResponsiveTextProps) {
  const getSizeClass = () => {
    switch (size) {
      case 'xs': return 'text-xs sm:text-sm'
      case 'sm': return 'text-sm sm:text-base'
      case 'base': return 'text-base sm:text-lg'
      case 'lg': return 'text-lg sm:text-xl'
      case 'xl': return 'text-xl sm:text-2xl'
      case '2xl': return 'text-2xl sm:text-3xl'
      case '3xl': return 'text-3xl sm:text-4xl'
      default: return 'text-base sm:text-lg'
    }
  }

  const getWeightClass = () => {
    switch (weight) {
      case 'normal': return 'font-normal'
      case 'medium': return 'font-medium'
      case 'semibold': return 'font-semibold'
      case 'bold': return 'font-bold'
      default: return 'font-normal'
    }
  }

  const getColorClass = () => {
    switch (color) {
      case 'gray': return 'text-gray-900'
      case 'blue': return 'text-blue-600'
      case 'red': return 'text-red-600'
      case 'green': return 'text-green-600'
      case 'yellow': return 'text-yellow-600'
      default: return 'text-gray-900'
    }
  }

  return (
    <span className={`${getSizeClass()} ${getWeightClass()} ${getColorClass()} ${className}`}>
      {children}
    </span>
  )
}

