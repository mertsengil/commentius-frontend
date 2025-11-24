'use client'

import { useEffect, useState } from 'react'
import { redirect, useRouter } from 'next/navigation'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  UserPlus,
  PlusCircle,
  Edit,
  Trash2,
  RefreshCw,
  CreditCard,
  MessageCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

/* ---------- Redux hooks ---------- */
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import {
  selectAuthStatus,
  selectAuthUser,
} from '@/features/auth/authSlice'

/* ---------- USERS SLICE ---------- */
import {
  fetchAllUsers,
  createUser,
  deleteUser,
  selectAllUsers,
  selectUsersStatus,
} from '@/features/users/usersSlice'

/* ---------- BUSINESSES SLICE ---------- */
import {
  fetchAllBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  selectAllBusinesses,
  selectBusinessesStatus,
} from '@/features/businesses/businessesSlice'

/* ---------- Modals ---------- */
import CreateBusinessModal from '@/components/dashboard/businesses/create-business-modal'
import EditBusinessModal from '@/components/dashboard/businesses/edit-business-modal'
import DeleteBusinessModal from '@/components/dashboard/businesses/delete-business-modal'
import { ReviewFetchModal } from '@/components/dashboard/businesses/review-fetch-modal'
import CreateUserWithBizModal from '@/components/dashboard/users/create-user-with-biz-modal'

/* ---------- Helpers ---------- */
const fmt = (iso?: string | null) =>
  iso ? format(new Date(iso), 'dd.MM.yyyy HH:mm:ss', { locale: tr }) : '—'

export default function HesapYonetimiPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()

  /* ---------- Auth guard ---------- */
  const authStatus = useAppSelector(selectAuthStatus)
  const me = useAppSelector(selectAuthUser)

  useEffect(() => {
    if (authStatus === 'loading') return
    if (!me) redirect('/login')
    else if (me.role !== 'admin') redirect('/dashboard')
  }, [authStatus, me])

  /* ---------- Data ---------- */
  const usersStatus = useAppSelector(selectUsersStatus)
  const users = useAppSelector(selectAllUsers)
  const bizStatus = useAppSelector(selectBusinessesStatus)
  const businesses = useAppSelector(selectAllBusinesses)

  /* ---------- Initial fetch ---------- */
  useEffect(() => {
    if (me?.role !== 'admin') return
    dispatch(fetchAllUsers())
    dispatch(fetchAllBusinesses())
  }, [dispatch, me])

  /* ---------- Local UI state ---------- */
  const [activeTab, setActiveTab] = useState<'users' | 'biz'>('users')

  /* Users-create modal */
  const [userCreateOpen, setUserCreateOpen] = useState(false)

  /* Businesses modals */
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [fetchBizId, setFetchBizId] = useState<number | null>(null)
  const [fetchOpen, setFetchOpen] = useState(false)

  /* ---------- Handlers ---------- */
  const refreshUsers = async () => {
    try {
      await dispatch(fetchAllUsers()).unwrap()
      toast.success('Kullanıcılar yenilendi')
    } catch {
      toast.error('Kullanıcılar yenilenemedi')
    }
  }

  const refreshBiz = async () => {
    try {
      await dispatch(fetchAllBusinesses()).unwrap()
      toast.success('İşletmeler yenilendi')
    } catch {
      toast.error('İşletmeler yenilenemedi')
    }
  }

  /** Kullanıcı + işletme zincir oluşturma */
  const handleCreateUserWithBiz = async (p: {
    name: string
    email: string
    password: string
    createNew: boolean
    businessName?: string
    phone?: string
    existingBusinessId?: number
  }) => {
    try {
      // 1) kullanıcıyı yarat
      const newUser = await dispatch(
        createUser({
          name: p.name,
          email: p.email,
          password: p.password,
          role: 'business',
        })
      ).unwrap()

      // 2) işletme bağla
      if (p.createNew) {
        await dispatch(createBusiness({
          name: p.businessName!,
          phone: p.phone || null,
          userId: newUser.id,
        })).unwrap()
      } else {
        await dispatch(updateBusiness({
          id: p.existingBusinessId!,
          data: { userId: newUser.id },
        })).unwrap()
      }

      toast.success('Kullanıcı ve işletme başarıyla bağlandı')
      setUserCreateOpen(false)
    } catch (err: any) {
      console.error(err)
      toast.error('İşlem sırasında hata')
    }
  }

  /* ---------- Loading guard ---------- */
  if (
    authStatus === 'loading' ||
    usersStatus === 'loading' ||
    bizStatus === 'loading'
  ) {
    return (
      <div className="flex h-screen items-center justify-center">
        Yükleniyor…
      </div>
    )
  }
  if (!me || me.role !== 'admin') return null

  /* ---------- Render ---------- */
  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Hesap Yönetimi</h1>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="users">KULLANICILAR</TabsTrigger>
          <TabsTrigger value="biz">İŞLETMELER</TabsTrigger>
        </TabsList>

        {/* ================= USERS TAB ================= */}
        <TabsContent value="users" className="mt-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Tüm Kullanıcılar</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={refreshUsers}>
                <RefreshCw className="h-4 w-4 mr-2" /> Yenile
              </Button>
              <Button onClick={() => setUserCreateOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" /> Yeni Kullanıcı
              </Button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-x-auto">
            <Table>
              <TableCaption>Toplam {users.length} kullanıcı</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Oluşturma</TableHead>
                  <TableHead className="w-[120px]">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>{u.id}</TableCell>
                    <TableCell className="font-medium">
                      {u.name || u.name}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{fmt(u.created_at)}</TableCell>
                    <TableCell>
                      {/* Edit modal henüz yok */}
                      <Button variant="ghost" size="icon" disabled>
                        <Edit className="h-4 w-4 opacity-50" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => dispatch(deleteUser(u.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Create user modal */}
          <CreateUserWithBizModal
            isOpen={userCreateOpen}
            onClose={() => setUserCreateOpen(false)}
            onSubmit={handleCreateUserWithBiz}
          />
        </TabsContent>

        {/* ================= BUSINESSES TAB ================= */}
        <TabsContent value="biz" className="mt-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Tüm İşletmeler</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={refreshBiz}>
                <RefreshCw className="h-4 w-4 mr-2" /> Yenile
              </Button>
              <Button onClick={() => setCreateOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" /> Yeni İşletme
              </Button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-x-auto">
            <Table>
              <TableCaption>Toplam {businesses.length} işletme</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>İsim</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead className="min-w-[160px]">Prompt</TableHead>
                  <TableHead>Son Güncelleme</TableHead>
                  <TableHead className="w-[160px]">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businesses.map(b => (
                  <TableRow key={b.id}>
                    <TableCell>{b.id}</TableCell>
                    <TableCell className="font-medium">
                      {b.name || b.name}
                    </TableCell>
                    <TableCell>{b.email}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${b.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {b.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </TableCell>
                    <TableCell>{b.reviewReplyTokens ?? '—'}</TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {b.reviewReplyPrompt ?? '—'}
                    </TableCell>
                    <TableCell>{fmt(b.updated_at)}</TableCell>
                    <TableCell className="flex flex-wrap gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFetchBizId(b.id)
                          setFetchOpen(true)
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditId(b.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          router.push(`/dashboard/isletme-kartlari/${b.id}`)
                        }
                      >
                        <CreditCard className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(b.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ---------- BUSINESS MODALS ---------- */}
          <CreateBusinessModal
            isOpen={createOpen}
            onClose={() => setCreateOpen(false)}
            onSubmit={data => dispatch(createBusiness(data))}
          />
          {editId != null && (
            <EditBusinessModal
              isOpen
              onClose={() => setEditId(null)}
              onSubmit={(id, data) =>
                dispatch(updateBusiness({ id, data }))
              }
              business={businesses.find(b => b.id === editId)!}
            />
          )}
          {deleteId != null && (
            <DeleteBusinessModal
              isOpen
              onClose={() => setDeleteId(null)}
              onConfirm={() => dispatch(deleteBusiness(deleteId))}
              businessId={deleteId}
              businessName={businesses.find(b => b.id === deleteId)!.name || ''}
            />
          )}
          {fetchBizId != null && (
            <ReviewFetchModal
              isOpen={fetchOpen}
              onClose={() => setFetchOpen(false)}
              businessId={fetchBizId}
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
