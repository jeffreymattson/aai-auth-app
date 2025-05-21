'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface DebugInfo {
  url: string
  hash: string
  searchParams: Record<string, string>
  hashParams: Record<string, string> | null
  supabaseConfig: {
    url: string
    hasAnonKey: boolean
  }
}

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  
  // Verify environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  const supabase = createBrowserClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
  )

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setConfigError(`Missing environment variables:
        NEXT_PUBLIC_SUPABASE_URL: ${!!supabaseUrl}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${!!supabaseAnonKey}`)
      return
    }

    // Basic debug info
    const url = window.location.href
    const hash = window.location.hash
    const searchParams = new URLSearchParams(window.location.search)
    
    const info = {
      url,
      hash,
      searchParams: Object.fromEntries(searchParams.entries()),
      hashParams: hash ? Object.fromEntries(new URLSearchParams(hash.substring(1)).entries()) : null,
      supabaseConfig: {
        url: supabaseUrl,
        hasAnonKey: !!supabaseAnonKey
      }
    }
    
    setDebugInfo(info)

    if (hash) {
      try {
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const type = hashParams.get('type')

        if (accessToken && type === 'recovery') {
          const verifyResetLink = async () => {
            try {
              // Set the session with the access token
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: hashParams.get('refresh_token') || ''
              })

              if (sessionError) {
                setIsError(true)
                console.error('Supabase session error:', sessionError)
                setMessage(`Error setting session: ${sessionError.message}`)
                return
              }

              // Get the user to verify the session is valid
              const { data: { user }, error: userError } = await supabase.auth.getUser()

              if (userError) {
                setIsError(true)
                console.error('Supabase user error:', userError)
                setMessage(`Error getting user: ${userError.message}`)
                return
              }

              if (user) {
                setIsError(false)
                setMessage('')
              } else {
                setIsError(true)
                setMessage('Invalid or expired reset link. Please request a new password reset.')
              }
            } catch (err) {
              setIsError(true)
              console.error('Unexpected error during verification:', err)
              setMessage(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`)
            }
          }
          
          verifyResetLink()
        } else {
          setIsError(true)
          setMessage('Invalid reset link. Please request a new password reset.')
        }
      } catch (err) {
        setIsError(true)
        console.error('Error parsing hash:', err)
        setMessage(`Error parsing hash: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    } else {
      setIsError(true)
      setMessage('No hash found in URL')
    }
  }, [supabase.auth, supabaseUrl, supabaseAnonKey])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setIsError(true)
        setMessage('Error: ' + error.message)
      } else {
        setIsError(false)
        setMessage('Password has been reset successfully.')
      }
    } catch (err) {
      setIsError(true)
      setMessage(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Configuration Error
            </h2>
            <div className="mt-4 p-4 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">
              <p className="font-medium mb-2">Error</p>
              <pre className="whitespace-pre-wrap">
                {configError}
              </pre>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your new password
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {message && (
            <div className={`text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>
              {message}
              {isError && debugInfo && (
                <div className="mt-4 p-4 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">
                  <p className="font-medium mb-2">Debug Information:</p>
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || isError}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 