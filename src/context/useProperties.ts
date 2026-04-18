import { useContext } from 'react'
import { PropertiesContext } from './propertiesContext'

export function useProperties() {
  const ctx = useContext(PropertiesContext)
  if (!ctx) {
    throw new Error('useProperties must be used within PropertiesProvider')
  }
  return ctx
}
