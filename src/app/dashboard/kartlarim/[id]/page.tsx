// src/app/kartlarim/[id]/page.tsx

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import {
    selectCardsStatus,
    fetchCardById,
    selectCardById,
} from '@/features/cards/cardsSlice'
import {
    fetchCardReads,
    selectDash,
} from '@/features/dashboard/dashboardSlice'
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
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
    ArrowLeft,
    CreditCard,
    Link as LinkIcon,
    QrCode,
} from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function KartDetayPage() {
    const router = useRouter()
    const { id } = useParams<{ id: string }>()
    const cardId = Number(id)

    const dispatch = useAppDispatch()
    const status = useAppSelector(selectCardsStatus)
    const card = useAppSelector(selectCardById(cardId))
    const dash = useAppSelector(selectDash)
    const reads = dash.readsByCard?.[cardId] ?? []

    /* -------------------------------------------------------------
       1) **Pencereyi ilk gelişte yenile**  (geçici çözüm)
    -------------------------------------------------------------- */
    useEffect(() => {
        if (typeof window === 'undefined') return

        const key = `reloaded-card-${cardId}`
        if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, 'yes') // sonsuz döngü engeli
            window.location.reload()
        }
    }, [cardId])

    /* -------------------------------------------------------------
       2) Veri eksikse fetch et
    -------------------------------------------------------------- */
    useEffect(() => {
        if (!card && status !== 'loading') {
            dispatch(fetchCardById(cardId))
        }
        if (!reads.length && dash.status !== 'loading') {
            dispatch(fetchCardReads(cardId))
        }
    }, [card, reads.length, status, dash.status, cardId, dispatch])

    /* -------------------------------------------------------------
       3) İşletme bilgisi (dashboard > kart fallback)
    -------------------------------------------------------------- */
    const businessFromCard = card?.business
    const businessFromDash = dash.businessByCard?.[cardId]
    const business = businessFromDash ?? businessFromCard

    /* -------------------------------------------------------------
       4) Yükleniyor / hata durumları
    -------------------------------------------------------------- */
    if (status === 'loading' || !card || dash.status === 'loading') {
        return <Loading text="Yükleniyor…" />
    }
    if (dash.status === 'failed') {
        return <div className="p-4 text-red-600">{dash.error}</div>
    }

    /* -------------------------------------------------------------
       5) Okuma metrikleri
    -------------------------------------------------------------- */
    const totalReads = reads.length
    const uniqueIps = new Set(reads.map(r => r.ip)).size
    const sorted = [...reads].sort(
        (a, b) => Date.parse(b.readAt) - Date.parse(a.readAt),
    )
    const firstRead = sorted[sorted.length - 1]?.readAt
    const lastRead = sorted[0]?.readAt
    const rows = useMemo(() => sorted.slice(0, 50), [sorted])

    const fmt = (iso?: string) =>
        iso && isValid(parseISO(iso))
            ? format(parseISO(iso), 'dd.MM.yyyy HH:mm', { locale: tr })
            : '—'

    /* -------------------------------------------------------------
       6) JSX
    -------------------------------------------------------------- */
    return (
        <div className="p-4 space-y-6">
            {/* Başlık + Geri */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Kart Detayı</h1>
                <div />
            </div>

            {/* Kart Bilgileri */}
            <CardUI>
                <CardHeader className="bg-gray-50 pb-2">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>{card.name ?? `Kart #${card.id}`}</CardTitle>
                            <p className="text-sm text-gray-600">
                                Oluşturma · {fmt(card.createdAt)}
                            </p>
                        </div>
                        <CreditCard className="h-6 w-6 text-gray-400" />
                    </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                    <InfoRow icon={LinkIcon} text={card.redirectUrl || '—'} />
                    {card.qrCode && (
                        <div className="flex items-center space-x-2">
                            <QrCode className="h-5 w-5 text-gray-400" />
                            <img
                                src={card.qrCode}
                                alt="Kart QR Kodu"
                                className="h-24 w-24 rounded"
                            />
                        </div>
                    )}
                </CardContent>
            </CardUI>

            {/* İşletme Bilgileri */}
            {business && (
                <CardUI>
                    <CardHeader>
                        <CardTitle>İşletme Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-1 text-sm">
                        <p>
                            <strong>Ad:</strong> {business.name}
                        </p>
                        <p>
                            <strong>Email:</strong> {business.email}
                        </p>
                        <p>
                            <strong>Telefon:</strong> {business.phone ?? '—'}
                        </p>
                        <p>
                            <strong>Durum:</strong>{' '}
                            {business.active ? 'Aktif' : 'Pasif'}
                        </p>
                        <p>
                            <strong>Oluşturma:</strong> {fmt(business.createdAt)}
                        </p>
                    </CardContent>
                </CardUI>
            )}

            {/* Okutma Özeti */}
            <CardUI>
                <CardHeader>
                    <CardTitle>Okutma Özeti</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-1 text-sm">
                    <p>
                        <strong>Toplam Okutma:</strong> {totalReads}
                    </p>
                    <p>
                        <strong>Benzersiz IP:</strong> {uniqueIps}
                    </p>
                    <p>
                        <strong>İlk Okunma:</strong> {fmt(firstRead)}
                    </p>
                    <p>
                        <strong>Son Okunma:</strong> {fmt(lastRead)}
                    </p>
                </CardContent>
            </CardUI>

            {/* Okutma Geçmişi */}
            <CardUI>
                <CardHeader>
                    <CardTitle>Okutma Geçmişi ({rows.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {rows.length === 0 ? (
                        <p className="text-sm text-gray-500">Kayıt yok.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>IP</TableHead>
                                    <TableHead>Cihaz</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map(r => (
                                    <TableRow key={r.id}>
                                        <TableCell>{r.id}</TableCell>
                                        <TableCell>{fmt(r.readAt)}</TableCell>
                                        <TableCell>{r.ip}</TableCell>
                                        <TableCell className="max-w-[240px] truncate">
                                            {r.ua}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </CardUI>
        </div>
    )
}

/* -------------------------------------------------------------
   Yardımcı Bileşenler
-------------------------------------------------------------- */
function InfoRow({
    icon: Icon,
    text,
}: {
    icon: React.ComponentType<{ className?: string }>
    text?: string | JSX.Element
}) {
    return (
        <div className="flex items-center space-x-2 text-sm">
            <Icon className="h-4 w-4 text-gray-400" />
            <span>{text ?? '—'}</span>
        </div>
    )
}

function Loading({ text }: { text: string }) {
    return (
        <div className="flex h-screen items-center justify-center">{text}</div>
    )
}
