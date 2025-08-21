'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const logout = async () => {
    await signOut({ redirect: false })
    router.push('/auth/login')
  }

  const isAdmin = session?.user?.isAdmin || false
  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'

  return {
    session,
    user: session?.user,
    isAdmin,
    isAuthenticated,
    isLoading,
    logout
  }
} 