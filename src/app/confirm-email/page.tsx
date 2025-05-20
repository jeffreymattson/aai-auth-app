'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function ConfirmEmail() {
  const [message, setMessage] = useState('Loading...')
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Basic debug info
    const url = window.location.href
    const hash = window.location.hash
    setMessage(`URL: ${url}\nHash: ${hash}`)

    if (hash) {
      try {
        const hashParams = new URLSearchParams(hash.substring(1))
        const token = hashParams.get('access_token')
        const type = hashParams.get('type')

        if (token && type) {
          const verifyEmail = async () => {
            try {
              if (type === 'signup') {
                const { error } = await supabase.auth.verifyOtp({
                  token_hash: token,
                  type: 'signup'
                })

                if (error) {
                  setMessage(`Error: ${error.message}`)
                } else {
                  setMessage('Email confirmed successfully! You can now log in.')
                }
              } else if (type === 'recovery') {
                setMessage('Password reset link is valid. You can now reset your password.')
              } else {
                setMessage(`Invalid type: ${type}`)
              }
            } catch (err) {
              setMessage(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`)
            }
          }
          
          verifyEmail()
        } else {
          setMessage(`No token or type found in hash. Token: ${!!token}, Type: ${type}`)
        }
      } catch (err) {
        setMessage(`Error parsing hash: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    } else {
      setMessage('No hash found in URL')
    }
  }, [supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Confirmation
          </h2>
          <pre className="mt-4 p-4 bg-gray-100 rounded-lg text-sm whitespace-pre-wrap">
            {message}
          </pre>
        </div>
      </div>
    </div>
  )
} 