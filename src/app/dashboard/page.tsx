'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/lib/hooks'
import { selectAuthStatus, selectAuthUser } from '@/features/auth/authSlice'

export default function DashboardIndex() {
  const router = useRouter()
  const status = useAppSelector(selectAuthStatus)
  const user = useAppSelector(selectAuthUser)

  useEffect(() => {
    if (status === 'loading') return            // hâlâ kimlik doğrulanıyor
    if (!user) {
      router.replace('/login')                  // oturum yok → giriş
      return
    }

    const target =
      user.role?.toLowerCase() === 'admin'
        ? '/dashboard/admin'
        : '/dashboard/business'

    router.replace(target)                      // role-e göre yönlendir
  }, [status, user, router])

  // sayfa gözükmeyecek; yalnızca yönlendirme yapıyoruz
  return null
}
