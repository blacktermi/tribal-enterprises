import { useState, useCallback } from 'react'

/**
 * Hook générique pour gérer les états de chargement et erreurs d'actions async
 *
 * @example
 * const { isLoading, error, execute } = useAsyncAction()
 *
 * const handleDelete = async () => {
 *   await execute(async () => {
 *     await deleteOrder(orderId)
 *   })
 * }
 */
export function useAsyncAction<T = void>() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (action: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await action()
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    execute,
    reset,
  }
}

/**
 * Hook pour gérer plusieurs actions async en parallèle avec états individuels
 *
 * @example
 * const { loadingStates, executeAction } = useAsyncActions()
 *
 * const handleAction = async (id: string) => {
 *   await executeAction(id, async () => {
 *     await someAsyncOperation(id)
 *   })
 * }
 */
export function useAsyncActions<T = void>() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const executeAction = useCallback(async (
    key: string,
    action: () => Promise<T>
  ): Promise<T | null> => {
    setLoadingStates(prev => ({ ...prev, [key]: true }))
    setErrors(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })

    try {
      const result = await action()
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setErrors(prev => ({ ...prev, [key]: message }))
      return null
    } finally {
      setLoadingStates(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }, [])

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] ?? false
  }, [loadingStates])

  const getError = useCallback((key: string) => {
    return errors[key] ?? null
  }, [errors])

  const reset = useCallback((key?: string) => {
    if (key) {
      setLoadingStates(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      setErrors(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    } else {
      setLoadingStates({})
      setErrors({})
    }
  }, [])

  return {
    loadingStates,
    errors,
    executeAction,
    isLoading,
    getError,
    reset,
  }
}
