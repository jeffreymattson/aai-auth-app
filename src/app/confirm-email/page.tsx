'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function ConfirmEmail() {
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  
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

        if (accessToken && type) {
          const verifyEmail = async () => {
            try {
              if (type === 'signup') {
                // Log the request details
                console.log('Attempting to verify email with:', {
                  type: 'signup',
                  tokenLength: accessToken.length
                })

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

                // Get the user to verify the email is confirmed
                const { data: { user }, error: userError } = await supabase.auth.getUser()

                if (userError) {
                  setIsError(true)
                  console.error('Supabase user error:', userError)
                  setMessage(`Error getting user: ${userError.message}`)
                  return
                }

                if (user?.email_confirmed_at) {
                  setIsError(false)
                  setMessage('Email confirmed successfully! You can now log in.')
                } else {
                  setIsError(true)
                  setMessage('Email confirmation failed. Please try requesting a new confirmation email.')
                }
              } else if (type === 'recovery') {
                setIsError(false)
                setMessage('Password reset link is valid. You can now reset your password.')
              } else {
                setIsError(true)
                setMessage(`Invalid type: ${type}`)
              }
            } catch (err) {
              setIsError(true)
              console.error('Unexpected error during verification:', err)
              setMessage(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`)
            }
          }
          
          verifyEmail()
        } else {
          setIsError(true)
          setMessage(`No token or type found in hash. Token: ${!!accessToken}, Type: ${type}`)
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
            Email Confirmation
          </h2>
          <div className={`mt-4 p-4 rounded-lg text-sm ${
            isError 
              ? 'bg-red-50 border border-red-200 text-red-700' 
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            <p className="font-medium mb-2">
              {isError ? 'Error' : 'Success'}
            </p>
            <div>
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
          </div>
        </div>
      </div>
    </div>
  )
} 