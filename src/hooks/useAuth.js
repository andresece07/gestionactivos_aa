import { useState, useEffect } from 'react'
import { supabase, supabaseAuth } from '../lib/supabaseClient'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Obtener usuario actual al cargar
    const checkUser = async () => {
      try {
        const user = await supabaseAuth.getUser()
        setUser(user)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Escuchar cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      authListener?.subscription?.unsubscribe?.()
    }
  }, [])

  const signIn = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: signInError } = await supabaseAuth.signIn(email, password)
      if (signInError) throw signInError
      setUser(data?.user)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: signUpError } = await supabaseAuth.signUp(email, password)
      if (signUpError) throw signUpError
      return { success: true, data }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error: signOutError } = await supabaseAuth.signOut()
      if (signOutError) throw signOutError
      setUser(null)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  }
}
