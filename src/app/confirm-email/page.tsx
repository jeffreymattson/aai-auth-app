'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ConfirmEmailPage() {
  const [message, setMessage] = useState('Verifying your email...')
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const type = searchParams.get('type')

    if (token && type === 'email') {
      supabase.auth.verifyOtp({ token_hash: token, type: 'email' })
        .then(({ error }) => {
          if (error) {
            setMessage('Error verifying email. Please try again.')
          } else {
            setMessage('Email verified successfully! You can now close this window.')
          }
        })
    } else {
      setMessage('Invalid verification link')
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  )
} 