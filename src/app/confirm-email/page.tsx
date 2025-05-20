'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function ConfirmEmail() {
  const [message, setMessage] = useState('Loading...')
  const [isError, setIsError] = useState(false)
  
  // Verify environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
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
                {`Missing environment variables:
                NEXT_PUBLIC_SUPABASE_URL: ${!!supabaseUrl}
                NEXT_PUBLIC_SUPABASE_ANON_KEY: ${!!supabaseAnonKey}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

  useEffect(() => {
    // Basic debug info
    const url = window.location.href
    const hash = window.location.hash
    const searchParams = new URLSearchParams(window.location.search)
    
    let debugInfo = {
      url,
      hash,
      searchParams: Object.fromEntries(searchParams.entries()),
      hashParams: hash ? Object.fromEntries(new URLSearchParams(hash.substring(1)).entries()) : null,
      supabaseConfig: {
        url: supabaseUrl,
        hasAnonKey: !!supabaseAnonKey
      }
    }
    
    setMessage(`Debug Info:\n${JSON.stringify(debugInfo, null, 2)}`)

    if (hash) {
      try {
        const hashParams = new URLSearchParams(hash.substring(1))
        const token = hashParams.get('access_token')
        const type = hashParams.get('type')

        if (token && type) {
          const verifyEmail = async () => {
            try {
              if (type === 'signup') {
                // Log the request details
                console.log('Attempting to verify OTP with:', {
                  type: 'signup',
                  tokenLength: token.length
                })

                const { error } = await supabase.auth.verifyOtp({
                  token_hash: token,
                  type: 'signup'
                })

                if (error) {
                  setIsError(true)
                  console.error('Supabase auth error:', error)
                  if (error.message.includes('expired')) {
                    setMessage(`This email confirmation link has expired. Please request a new confirmation email.\n\nDebug Info:\n${JSON.stringify(debugInfo, null, 2)}`)
                  } else {
                    setMessage(`Error: ${error.message}\n\nDebug Info:\n${JSON.stringify(debugInfo, null, 2)}`)
                  }
                } else {
                  setIsError(false)
                  setMessage('Email confirmed successfully! You can now log in.')
                }
              } else if (type === 'recovery') {
                setIsError(false)
                setMessage('Password reset link is valid. You can now reset your password.')
              } else {
                setIsError(true)
                setMessage(`Invalid type: ${type}\n\nDebug Info:\n${JSON.stringify(debugInfo, null, 2)}`)
              }
            } catch (err) {
              setIsError(true)
              console.error('Unexpected error during verification:', err)
              setMessage(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}\n\nDebug Info:\n${JSON.stringify(debugInfo, null, 2)}`)
            }
          }
          
          verifyEmail()
        } else {
          setIsError(true)
          setMessage(`No token or type found in hash. Token: ${!!token}, Type: ${type}\n\nDebug Info:\n${JSON.stringify(debugInfo, null, 2)}`)
        }
      } catch (err) {
        setIsError(true)
        console.error('Error parsing hash:', err)
        setMessage(`Error parsing hash: ${err instanceof Error ? err.message : 'Unknown error'}\n\nDebug Info:\n${JSON.stringify(debugInfo, null, 2)}`)
      }
    } else {
      setIsError(true)
      setMessage(`No hash found in URL\n\nDebug Info:\n${JSON.stringify(debugInfo, null, 2)}`)
    }
  }, [supabase.auth, supabaseUrl, supabaseAnonKey])

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
            <pre className="whitespace-pre-wrap">
              {message}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
} 