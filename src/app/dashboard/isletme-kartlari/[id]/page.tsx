'use client'

import { useEffect, useState } from 'react'
import { redirect, useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RefreshCw, List, Grid, Table2, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { selectAuthStatus, selectAuthUser } from '@/features/auth/authSlice'
import { businessAPI } from '@/lib/api'
import type { Card as CardType } from '@/types/card'

import {
  Card as CardUI,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption,
} from '@/components/ui/table'

type ViewType = 'list' | 'card' | 'table'

export default function IsletmeKartlariPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const params = useParams()
  const businessId = Number(params.id)

  // auth
  const authStatus = useAppSelector(selectAuthStatus)
  const user = useAppSelector(selectAuthUser)

  // local state
  const [businessName, setBusinessName] = useState<string>('')
  const [cards, setCards] = useState<CardType[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewType, setViewType] = useState<ViewType>('list')

  // erişim kontrolleri
  useEffect(() => {
    if (authStatus === 'loading') return
    if (!user) return redirect('/login')
    if (!['admin', 'business'].includes(user.role)) return redirect('/dashboard')
    if (user.role === 'business' && user.id.toString() !== params.id) {
      return redirect('/dashboard')
    }
  }, [authStatus, user, params.id])

  // veri çekme
  const fetchData = async (showToast = false) => {
    setLoading(true)
    setError(null)
    try {
      const resp = await businessAPI.getWithCards(businessId)
      if (resp.error || !resp.data) {
        throw new Error(resp.error || 'Geçersiz yanıt')
      }
      setBusinessName(resp.data.name)
      setCards(
        resp.data.cards.map(c => ({
          id: c.id,
          redirect_url: c.redirect_url,
          createdAt: c.created_at,
          isActive: c.deleted_at === null,
          businessId: businessId,
        }))
      )
      if (showToast) toast.success('Kartlar güncellendi')
    } catch (e) {
      console.error(e)
      setError('Kartlar yüklenirken bir hata oluştu')
      toast.error('Kartlar yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData(false)
  }, [businessId])

  if (loading || authStatus === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        Yükleniyor...
      </div>
    )
  }
  if (!user) return null

  const formatDateStr = (iso: string) => {
    try {
      return format(new Date(iso), 'dd.MM.yyyy', { locale: tr })
    } catch {
      return iso
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData(true)
  }

  // Görünümler
  const ListView = () => (
    <div className="grid grid-cols-1 gap-4">
      {cards.map(c => (
        <div
          key={c.id}
          className="bg-white rounded shadow p-4 flex justify-between cursor-pointer hover:shadow-md"
          onClick={() => router.push(`/dashboard/kart-yonetimi/${c.id}`)}
        >
          <div>
            <h3 className="font-bold">{businessName}</h3>
            <p className="text-sm text-gray-500">URL: {c.redirect_url}</p>
            <p className="text-xs text-gray-400">Oluş: {formatDateStr(c.createdAt)}</p>
          </div>
          <span className={`px-2 py-0.5 text-xs rounded-full ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
            {c.isActive ? 'Aktif' : 'Pasif'}
          </span>
        </div>
      ))}
    </div>
  )

  const CardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map(c => (
        <CardUI
          key={c.id}
          className="overflow-hidden cursor-pointer hover:shadow-md"
          onClick={() => router.push(`/dashboard/kart-yonetimi/${c.id}`)}
        >
          <CardHeader>
            <CardTitle>{businessName}</CardTitle>
            <span className={`px-2 py-0.5 text-xs rounded-full ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
              {c.isActive ? 'Aktif' : 'Pasif'}
            </span>
          </CardHeader>
          <CardContent>
            <p>URL: {c.redirect_url}</p>
            <p className="text-xs text-gray-500 mt-2">Oluş: {formatDateStr(c.createdAt)}</p>
          </CardContent>
        </CardUI>
      ))}
    </div>
  )

  const TableView = () => (
    <div className="bg-white rounded shadow overflow-auto">
      <Table>
        <TableCaption>Toplam {cards.length} kart</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Oluş</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cards.map(c => (
            <TableRow
              key={c.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => router.push(`/dashboard/kart-yonetimi/${c.id}`)}
            >
              <TableCell>{c.id}</TableCell>
              <TableCell>{c.redirect_url}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 text-xs rounded-full ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {c.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </TableCell>
              <TableCell>{formatDateStr(c.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/hesap-yonetimi">
            <Button variant="outline" size="icon">
              <ArrowLeft />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{businessName} - Kartlar</h1>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Yenileniyor...' : 'Yenile'}
        </Button>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">
          {businessName} işletmesine ait kartları görüntülüyorsunuz.
        </p>
        <div className="flex bg-white border rounded-md">
          <Button
            variant={viewType === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewType('list')}
          >
            <List />
          </Button>
          <Button
            variant={viewType === 'card' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewType('card')}
          >
            <Grid />
          </Button>
          <Button
            variant={viewType === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewType('table')}
          >
            <Table2 />
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded border-red-200 border mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="bg-yellow-50 p-4 rounded border-yellow-200 border">
          <p className="text-yellow-700">Bu işletmeye ait kart bulunmamaktadır.</p>
        </div>
      ) : viewType === 'list' ? (
        <ListView />
      ) : viewType === 'card' ? (
        <CardView />
      ) : (
        <TableView />
      )}
    </div>
  )
}
