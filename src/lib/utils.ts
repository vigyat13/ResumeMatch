/**
 * UTILITY FUNCTIONS
 *
 * cn() = class name merger. Combines Tailwind classes safely,
 * removing duplicates and handling conditional classes.
 *
 * Example: cn('px-4', isActive && 'bg-blue-500', 'text-white')
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Merge Tailwind classes without conflicts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format bytes to human-readable string (e.g. 245000 → "2.3 MB")
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Format date to readable string (e.g. "Jan 15, 2025")
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Format cents to dollar string (e.g. 999 → "$9.99")
export function formatCurrency(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

// Get score color class based on ATS score range
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-yellow-500'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-600'
}

// Get score ring color for circular progress indicators
export function getScoreRingColor(score: number): string {
  if (score >= 80) return '#10B981' // emerald
  if (score >= 60) return '#F59E0B' // amber
  if (score >= 40) return '#F97316' // orange
  return '#EF4444' // red
}
