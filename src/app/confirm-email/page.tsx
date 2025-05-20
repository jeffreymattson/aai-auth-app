'use client'

import { useState, useEffect, Suspense } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useSearchParams } from 'next/navigation'

function ConfirmEmailContent() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    console.log('Component mounted')
    
    // Immediate check for hash
    if (typeof window !== 'undefined') {
      console.log('Window is defined')
      console.log('Current URL:', window.location.href)
      
      const hash = window.location.hash
      console.log('Raw hash:', hash)
      
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const token = hashParams.get('access_token')
        const type = hashParams.get('type')
        
        console.log('Found in hash:', { token, type })
        
        if (token && type) {
          const verifyEmail = async () => {
            try {
              if (type === 'signup') {
                const { error } = await supabase.auth.verifyOtp({
                  token_hash: token,
                  type: 'signup'
                })

                if (error) {
                  console.log('Verification error:', error)
                  setMessage('Error: ' + error.message)
                } else {
                  console.log('Verification successful')
                  setMessage('Email confirmed successfully! You can now log in.')
                }
              } else if (type === 'recovery') {
                setMessage('Password reset link is valid. You can now reset your password.')
              } else {
                setMessage('Invalid confirmation type')
              }
            } catch (error) {
              console.error('Unexpected error:', error)
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
    
    // If we get here, no valid token was found
    console.log('No valid token found')
    setMessage('Invalid confirmation link')
    setLoading(false)
  }, [])

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