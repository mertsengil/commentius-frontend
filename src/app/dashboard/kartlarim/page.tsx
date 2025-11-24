'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { selectAuthStatus, selectAuthUser } from '@/features/auth/authSlice'
import {
  fetchAllCards,
  fetchCardsByBusiness,
  clearCards,                  // ← ekledik
  selectAllCards,
  selectCardsStatus,
} from '@/features/cards/cardsSlice'
import {
  Card as CardUI,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, MapPin, Phone, Mail, QrCode } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function KartlarimPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const authStatus = useAppSelector(selectAuthStatus)
  const user = useAppSelector(selectAuthUser)
  const cardsStatus = useAppSelector(selectCardsStatus)
  const cards = useAppSelector(selectAllCards)
  useEffect(() => {
    if (authStatus === 'loading') return

    if (!user) {
      router.replace('/login')
      return
    }
    if (!['business', 'admin'].includes(user.role)) {
      router.replace('/dashboard')
      return
    }


    // ← YENİLERİ ÇEK
    // ← YENİLERİ ÇEK (backend token’a göre zaten kendi kartlarını dönecek)
    dispatch(clearCards())
    dispatch(fetchAllCards())
  }, [authStatus, user, dispatch, router])


  if (authStatus === 'loading' || cardsStatus === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        Yükleniyor...
      </div>
    )
  }

  // Kart yoksa:
  if (cards.length === 0) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <p className="text-yellow-700">Henüz kart bulunmamaktadır.</p>
      </div>
    )
  }

  const fmt = (iso: string) => {
    try {
      return format(new Date(iso), 'dd.MM.yyyy', { locale: tr })
    } catch {
      return iso
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between pl-4 ml-6 mb-6">
        <h1 className="text-2xl font-bold">Kartlarım</h1>
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
          {user.role === 'admin' ? 'Admin' : 'İşletme Kullanıcısı'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(kart => (
          <CardUI key={kart.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{kart.name ?? 'İşletme'}</CardTitle>
                  <CardDescription>İşletme Kartı</CardDescription>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-gray-400" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <div className="space-y-2">
                <QrCode className="h-5 w-5 text-gray-400" />
                <img
                  src={kart.qrCode}
                  alt="Kart QR Kodu"
                  className="h-24 w-24 rounded"
                />
              </div>
            </CardContent>

            <CardFooter className="bg-gray-50 flex justify-between">
              <span className="text-xs text-gray-500">Kart ID: {kart.id}</span>
              <Button
                variant="link"
                onClick={() => router.push(`/dashboard/kartlarim/${kart.id}`)}
              >
                Detaylar
              </Button>
            </CardFooter>
          </CardUI>
        ))}
      </div>
    </div>
  )
}
