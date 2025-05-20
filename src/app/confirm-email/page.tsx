'use client'

import { useState, useEffect, Suspense } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useSearchParams } from 'next/navigation'

function ConfirmEmailContent() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [debug, setDebug] = useState<any>({})
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const debugInfo: any = {
      url: typeof window !== 'undefined' ? window.location.href : 'no window',
      hash: typeof window !== 'undefined' ? window.location.hash : 'no window',
      searchParams: Object.fromEntries(searchParams.entries())
    }

    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      debugInfo.hashParams = Object.fromEntries(hashParams.entries())
    }

    setDebug(debugInfo)
    
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      
      if (hash) {
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
                  setMessage('Error: ' + error.message)
                } else {
                  setMessage('Email confirmed successfully! You can now log in.')
                }
              } else if (type === 'recovery') {
                setMessage('Password reset link is valid. You can now reset your password.')
              } else {
                setMessage('Invalid confirmation type')
              }
            } catch (error) {
              setMessage('An unexpected error occurred. Please try again.')
            } finally {
              setLoading(false)
            }
          }
          
          verifyEmail()
          return
        }
      }
    }
    
    setMessage('Invalid confirmation link')
    setLoading(false)
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Confirmation
          </h2>
          {loading ? (
            <p className="mt-2 text-center text-sm text-gray-600">
              Verifying your email...
            </p>
          ) : (
            <p className={`mt-2 text-center text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}
        </div>
        
        {/* Debug Information */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Debug Information:</h3>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
            {JSON.stringify(debug, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  )
} 