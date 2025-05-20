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
    const confirmEmail = async () => {
      try {
        // Get token and type from either query params or hash fragment
        let token = searchParams.get('token')
        let type = searchParams.get('type')

        // If not in query params, try to get from hash fragment
        if (!token || !type) {
          const hash = window.location.hash.substring(1)
          const hashParams = new URLSearchParams(hash)
          token = hashParams.get('access_token')
          type = hashParams.get('type')
        }

        if (!token || !type) {
          setMessage('Invalid confirmation link')
          setLoading(false)
          return
        }

        if (type === 'signup') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          })

          if (error) {
            setMessage('Error: ' + error.message)
          } else {
            setMessage('Email confirmed successfully! You can now log in.')
            setTimeout(() => {
              router.push('/login')
            }, 2000)
          }
        } else if (type === 'recovery') {
          setMessage('Password reset link is valid. You can now reset your password.')
          setTimeout(() => {
            router.push('/reset-password')
          }, 2000)
        }
      } catch {
        setMessage('An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    confirmEmail()
  }, [searchParams, router, supabase.auth])

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