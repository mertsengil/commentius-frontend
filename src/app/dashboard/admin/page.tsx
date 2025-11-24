'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    PieChart,
    MessageSquare,
    FileBarChart,
    Info,
    DownloadCloud,
    FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import {
    selectAuthStatus,
    selectAuthUser,
    logout as logoutAction,
} from '@/features/auth/authSlice'
import {
    fetchAllBusinesses,
    selectAllBusinesses,
} from '@/features/businesses/businessesSlice'
import type { Business } from '@/types/business'

/* ────────── Geçici yorum datası ────────── */
const commentsData = [
    { id: 1, business: 'Oralet Dünyası', user: 'Ahmet Y.', comment: 'Hizmet çok iyiydi!', rating: 5, date: '2025-05-06' },
    { id: 2, business: 'Oralet Dünyası', user: 'Mehmet K.', comment: 'Fiyatlar biraz yüksek.', rating: 4, date: '2025-05-05' },
    { id: 3, business: 'Efe Güneş', user: 'Ayşe S.', comment: 'Kesinlikle tavsiye ederim.', rating: 5, date: '2025-05-04' },
]

export default function AdminDashboardPage() {
    const router = useRouter()
    const dispatch = useAppDispatch()

    /* ---- Hook'lar KOŞULSUZ ---- */
    const authStatus = useAppSelector(selectAuthStatus)
    const user = useAppSelector(selectAuthUser)
    const businesses = useAppSelector(selectAllBusinesses)
    const bizStatus = businesses.length ? 'succeeded' : 'idle'

    const [authorized, setAuthorized] = useState(false)
    const [selectedBusinessId, setSelectedBusinessId] = useState<string>('all')
    const [activeTab, setActiveTab] =
        useState<'analytics' | 'comments' | 'reports' | 'details'>('analytics')

    /* ---- Yetki bekçisi ---- */
    useEffect(() => {
        if (authStatus === 'loading') return

        if (!user) return router.replace('/login')
        if (user.role?.toLowerCase() !== 'admin')
            return router.replace('/dashboard/business')

        setAuthorized(true)
    }, [authStatus, user, router])

    /* ---- Veri çek ---- */
    useEffect(() => {
        if (authorized && bizStatus === 'idle') {
            dispatch(fetchAllBusinesses())
        }
    }, [authorized, bizStatus, dispatch])

    /* ---- YETKİSİZSE sadece iskelet göster ---- */
    if (!authorized) {
        return <div className="p-10 text-center text-sm text-gray-500">Yükleniyor…</div>
    }

    /* ------------------------------------------------------------------ */
    /*  Aşağısı: zaten yazmış olduğunuz admin arayüzü                     */
    /* ------------------------------------------------------------------ */

    const businessNameById = (id: number) =>
        businesses.find(b => b.id === id)?.name || ''

    const filteredComments =
        selectedBusinessId === 'all'
            ? commentsData
            : commentsData.filter(
                c => c.business === businessNameById(Number(selectedBusinessId)),
            )

    const currentBusinessName =
        selectedBusinessId === 'all'
            ? 'Tüm İşletmeler'
            : businessNameById(Number(selectedBusinessId))

    const handleLogout = () => {
        dispatch(logoutAction())
        router.replace('/login')
    }

    /* ——— Admin paneli renderı ——— */
    return (
        <div className="space-y-6">
            {/* Başlık */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Hoş geldiniz, {user?.email}!</h1>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    Admin
                </div>
                <Button variant="outline" onClick={handleLogout}>Çıkış Yap</Button>
            </div>

            {/* İşletme filtresi */}
            <div className="mb-6 w-64">
                <label htmlFor="biz" className="block text-sm font-medium text-gray-700 mb-1">
                    İşletme Filtresi
                </label>
                <select
                    id="biz"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    value={selectedBusinessId}
                    onChange={e => setSelectedBusinessId(e.target.value)}
                >
                    <option value="all">Tüm İşletmeler</option>
                    {businesses.map(b => (
                        <option key={b.id} value={b.id.toString()}>{b.name}</option>
                    ))}
                </select>
            </div>

            {/* Sekmeler */}
            <div className="border-b flex space-x-4 mb-4">
                {[
                    { key: 'analytics', Icon: PieChart, label: 'Analizler' },
                    { key: 'comments', Icon: MessageSquare, label: 'Yorumlar' },
                    { key: 'reports', Icon: FileBarChart, label: 'Raporlar' },
                    { key: 'details', Icon: Info, label: 'Detaylar' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`flex items-center gap-2 px-4 py-2 ${activeTab === tab.key
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ─── İçerik: Analizler ─── */}
            {activeTab === 'analytics' && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* kart 1 */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium">Toplam Yorum</h3>
                        <p className="text-sm text-gray-500">{currentBusinessName} için</p>
                        <p className="text-3xl font-bold">{filteredComments.length}</p>
                        <p className="text-xs text-green-600">Son 30 günde +12%</p>
                    </div>
                    {/* kart 2 */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium">Ortalama Puan</h3>
                        <p className="text-sm text-gray-500">{currentBusinessName} için</p>
                        <p className="text-3xl font-bold">
                            {filteredComments.length
                                ? (
                                    filteredComments.reduce((s, c) => s + c.rating, 0) /
                                    filteredComments.length
                                ).toFixed(1)
                                : '0.0'}
                        </p>
                        <p className="text-xs text-green-600">Son 30 günde +0.2</p>
                    </div>
                    {/* kart 3 */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium">Toplam Ziyaret</h3>
                        <p className="text-sm text-gray-500">{currentBusinessName} için</p>
                        <p className="text-3xl font-bold">1 248</p>
                        <p className="text-xs text-green-600">Son 30 günde +18%</p>
                    </div>
                </div>
            )}

            {/* ─── İçerik: Yorumlar ─── */}
            {activeTab === 'comments' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-medium">{currentBusinessName} Yorumları</h3>
                        <p className="text-sm text-gray-500">Müşteri geri bildirimleri</p>
                    </div>
                    <div className="p-6">
                        {filteredComments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <MessageSquare className="mx-auto h-12 w-12 opacity-30 mb-2" />
                                <p>Henüz yorum bulunmuyor.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableCaption>Son yorumlar</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>İşletme</TableHead>
                                        <TableHead>Kullanıcı</TableHead>
                                        <TableHead>Yorum</TableHead>
                                        <TableHead>Puan</TableHead>
                                        <TableHead>Tarih</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredComments.map(c => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium">{c.business}</TableCell>
                                            <TableCell>{c.user}</TableCell>
                                            <TableCell>{c.comment}</TableCell>
                                            <TableCell>{c.rating}/5</TableCell>
                                            <TableCell>{c.date}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
            )}

            {/* ─── İçerik: Raporlar ─── */}
            {activeTab === 'reports' && (
                <div className="bg-white p-8 rounded-lg shadow space-y-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <FileBarChart className="w-5 h-5" />
                        Raporlar
                    </h3>

                    <p className="text-sm text-gray-600">
                        Aylık ve yıllık raporlarınızı buradan indirebilirsiniz.
                    </p>

                    <div className="space-y-4">
                        {/* Örnek rapor satırı */}
                        {['Mart 2025', 'Nisan 2025', 'Mayıs 2025'].map(month => (
                            <div
                                key={month}
                                className="flex items-center justify-between border rounded-md p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <span>{month} Raporu</span>
                                </div>
                                <Button size="sm" variant="outline" className="flex items-center gap-1">
                                    <DownloadCloud className="w-4 h-4" />
                                    İndir
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── İçerik: Detaylar ─── */}
            {activeTab === 'details' && (
                <div className="bg-white p-8 rounded-lg shadow space-y-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        Sistem Detayları
                    </h3>

                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Platform sürümü: <strong>v1.3.0</strong></li>
                        <li>Son yedek: <strong>22 Mayıs 2025 04:12</strong></li>
                        <li>Aktif kullanıcı sayısı: <strong>84</strong></li>
                        <li>Veritabanı boyutu: <strong>352 MB</strong></li>
                        <li>Sunucu durumu: <span className="text-green-600 font-medium">Çevrimiçi</span></li>
                    </ul>

                    <Button variant="secondary" onClick={() => alert('Bakım modu yakında!')}>
                        Planlı Bakım Bilgisi
                    </Button>
                </div>
            )}
        </div>
    )
}
