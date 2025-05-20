'use client'

import { useState, useEffect, Suspense } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useSearchParams } from 'next/navigation'

function ConfirmEmailContent() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [hydrated, setHydrated] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Ensure hydration
  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return

    // Wait for the hash to be available
    const run = async () => {
      try {
        console.log('Starting email confirmation process...')
        console.log('Current URL:', window.location.href)

        // First check hash fragment for access_token
        let token = null
        let type = null

        if (window.location.hash) {
          console.log('Checking hash fragment...')
          const hash = window.location.hash.substring(1)
          console.log('Hash fragment:', hash)
          const hashParams = new URLSearchParams(hash)
          token = hashParams.get('access_token')
          type = hashParams.get('type')
          console.log('Hash params:', { token, type })
        }

        // If not in hash, check query params
        if (!token || !type) {
          console.log('Checking query params...')
          token = searchParams.get('token')
          type = searchParams.get('type')
          console.log('Query params:', { token, type })
        }

        if (!token || !type) {
          console.log('No valid token or type found')
          setMessage('Invalid confirmation link')
          setLoading(false)
          return
        }

        console.log('Proceeding with token and type:', { token, type })

        if (type === 'signup') {
          console.log('Processing signup confirmation...')
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          })

          if (error) {
            console.log('Error during verification:', error)
            setMessage('Error: ' + error.message)
          } else {
            console.log('Email verification successful')
            setMessage('Email confirmed successfully! You can now log in.')
            setTimeout(() => {
              router.push('/login')
            }, 2000)
          }
        } else if (type === 'recovery') {
          console.log('Processing recovery confirmation...')
          setMessage('Password reset link is valid. You can now reset your password.')
          setTimeout(() => {
            router.push('/reset-password')
          }, 2000)
        } else {
          console.log('Unknown type:', type)
          setMessage('Invalid confirmation type')
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        setMessage('An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    setTimeout(run, 0)
  }, [hydrated, searchParams, router, supabase.auth])

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