'use client'

import { useState, useEffect } from 'react'
import { redirect, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  List,
  Grid,
  Table2,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

import CreateCardModal from '@/components/dashboard/cards/create-card-modal'
import EditCardModal from '@/components/dashboard/cards/edit-card-modal'
import DeleteCardModal from '@/components/dashboard/cards/delete-card-modal'
import { Card as CardType } from '@/types/card'

import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { selectAuthStatus, selectAuthUser } from '@/features/auth/authSlice'
import {
  fetchAllCards,
  fetchCardsByBusiness,
  selectAllCards,
  selectCardsStatus,
  createCard,
  updateCard,
  deleteCard,
} from '@/features/cards/cardsSlice'
import {
  fetchAllBusinesses,
  selectAllBusinesses,
  selectBusinessesStatus,
} from '@/features/businesses/businessesSlice'

import {
  Card as CardUI,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
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
export default function KartYonetimiPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()

  // Auth
  const authStatus = useAppSelector(selectAuthStatus)
  const user = useAppSelector(selectAuthUser)

  // Cards slice
  const cardsStatus = useAppSelector(selectCardsStatus)
  const cards = useAppSelector(selectAllCards)

  // Businesses slice
  const bizStatus = useAppSelector(selectBusinessesStatus)
  const businesses = useAppSelector(selectAllBusinesses)

  // Local UI state
  const [viewType, setViewType] = useState<'list' | 'card' | 'table'>('list')
  const [refreshing, setRefreshing] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)

  // Redirect logic
  useEffect(() => {
    if (authStatus === 'loading') return
    if (!user) return redirect('/login')
    if (user.role !== 'admin') return redirect('/dashboard')
  }, [authStatus, user])

  // Initial data fetch
  useEffect(() => {
    if (!user) return
    dispatch(fetchAllBusinesses())
    if (user.role === 'admin') {
      dispatch(fetchAllCards())
    } else {
      dispatch(fetchCardsByBusiness(Number(user.id)))
    }
  }, [dispatch, user])

  // Loading screen
  if (
    authStatus === 'loading' ||
    cardsStatus === 'loading' ||
    bizStatus === 'loading'
  ) {
    return (
      <div className="flex h-screen items-center justify-center">
        Yükleniyor...
      </div>
    )
  }
  if (!user || user.role !== 'admin') {
    // redirect handled above
    return null
  }

  const formatDateStr = (iso: string) => {
    try {
      return format(new Date(iso), 'dd.MM.yyyy', { locale: tr })
    } catch {
      return iso
    }
  }

  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await dispatch(fetchAllCards()).unwrap()
      await dispatch(fetchAllBusinesses()).unwrap()
      toast.success('Veriler güncellendi')
    } catch {
      toast.error('Yenileme sırasında hata oluştu')
    } finally {
      setRefreshing(false)
    }
  }

  const handleCreate = async (data: {
    redirect_url: string
    businessId: number
  }) => {
    try {
      await dispatch(createCard(data)).unwrap()
      toast.success('Kart oluşturuldu')
      setCreateOpen(false)
    } catch {
      toast.error('Kart oluşturulurken hata oluştu')
    }
  }

  const handleUpdate = async (
    id: number,
    data: { redirect_url: string }
  ) => {
    try {
      await dispatch(updateCard({ id, redirect_url: data.redirect_url })).unwrap()
      toast.success('Kart güncellendi')
      setEditOpen(false)
    } catch {
      toast.error('Kart güncellenirken hata oluştu')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await dispatch(deleteCard(id)).unwrap()
      toast.success('Kart silindi')
      setDeleteOpen(false)
    } catch {
      toast.error('Kart silinirken hata oluştu')
    }
  }

  const openEdit = (card: CardType) => {
    setSelectedCard(card)
    setEditOpen(true)
  }

  const openDelete = (card: CardType) => {
    setSelectedCard(card)
    setDeleteOpen(true)
  }

  const viewDetails = (id: number) => {
    router.push(`/dashboard/kart-yonetimi/${id}`)
  }

  // Sub‐views
  function ListView() {
    return (
      <div className="grid grid-cols-1 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row justify-between"
          >
            <div>
              <h3 className="font-bold text-lg">
                {card.business?.name}, {`İşletme #${card.business?.id}`}
              </h3>
              <p className="text-sm text-gray-500">
                URL: {card?.redirect_url}
              </p>
              <p className="text-xs text-gray-400">
                Oluş: {formatDateStr(card.createdAt)}
              </p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => viewDetails(card.id)}
              >
                <Eye className="h-4 w-4" /> Görüntüle
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEdit(card)}
              >
                <Edit className="h-4 w-4" /> Düzenle
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => openDelete(card)}
              >
                <Trash2 className="h-4 w-4" /> Sil
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  function CardView() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <CardUI key={card.id} className="overflow-hidden">
            <CardHeader>
              <CardTitle>
                {card.business?.name}, {`İşletme #${card.business?.id}`}
              </CardTitle>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${card.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}
              >
                {card.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-sm">URL: {card.redirect_url}</p>
              <p className="text-xs text-gray-500">
                Oluş: {formatDateStr(card.createdAt)}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => viewDetails(card.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => openEdit(card)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-red-500"
                onClick={() => openDelete(card)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </CardUI>
        ))}
      </div>
    )
  }

  function TableView() {
    return (
      <div className="bg-white rounded-md shadow overflow-hidden">
        <Table>
          <TableCaption>Toplam {cards.length} kart</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>İşletme</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluş</TableHead>
              <TableHead className="w-[140px]">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.map((card) => (
              <TableRow key={card.id}>
                <TableCell>{card.id}</TableCell>
                <TableCell>
                  {card.business?.name} , {`#${card.business?.id}`}
                </TableCell>
                <TableCell>{card.redirect_url}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${card.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}
                  >
                    {card.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </TableCell>
                <TableCell>{formatDateStr(card.createdAt)}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => viewDetails(card.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(card)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500"
                    onClick={() => openDelete(card)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kart Yönetimi</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''
                }`}
            />
            {refreshing ? 'Yenileniyor...' : 'Yenile'}
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <PlusCircle className="h-4 w-4" /> Yeni Kart
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-600">
          İşletmelere ait kartları yönetebilirsiniz.
        </p>
        <div className="flex bg-white border rounded-md overflow-hidden">
          <Button
            variant={viewType === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewType('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewType === 'card' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewType('card')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewType === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewType('table')}
          >
            <Table2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {cardsStatus === 'failed' ? (
        <div className="bg-red-50 p-4 rounded-md border border-red-200">
          <p className="text-red-700">Kartlar yüklenemedi.</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <p className="text-blue-700">
            Kart eklemek için “Yeni Kart” butonuna tıklayın.
          </p>
        </div>
      ) : viewType === 'list' ? (
        <ListView />
      ) : viewType === 'card' ? (
        <CardView />
      ) : (
        <TableView />
      )}

      <CreateCardModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        businesses={businesses}
      />
      {selectedCard && (
        <EditCardModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSubmit={(data) => handleUpdate(selectedCard.id, data)}
          card={selectedCard}
        />
      )}
      {selectedCard && (
        <DeleteCardModal
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onDelete={() => handleDelete(selectedCard.id)}
          card={selectedCard}
        />
      )}
    </div>
  )
}
