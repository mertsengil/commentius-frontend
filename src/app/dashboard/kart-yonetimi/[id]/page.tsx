'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, redirect } from 'next/navigation'
import Link from 'next/link'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { selectAuthStatus, selectAuthUser } from '@/features/auth/authSlice'
import {
    fetchCardById,
    selectCardById,
    selectCardsStatus,
    selectCardsError,
} from '@/features/cards/cardsSlice'
import { businessAPI } from '@/lib/api'
import type { Card as CardType } from '@/types/card'
import { Button } from '@/components/ui/button'
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
import { ArrowLeft } from 'lucide-react'
import {
    format,
    addMonths,
    differenceInCalendarDays,
    parseISO,
    isValid,
} from 'date-fns'
import { tr } from 'date-fns/locale'

export default function CardDetailPage() {
    const { id } = useParams<{ id: string }>()
    const cardId = Number(id)
    const dispatch = useAppDispatch()
    const router = useRouter()

    /* ─── Auth ─── */
    const authStatus = useAppSelector(selectAuthStatus)
    const user = useAppSelector(selectAuthUser)

    /* ─── Main card state ─── */
    const card = useAppSelector(selectCardById(cardId))
    const status = useAppSelector(selectCardsStatus)
    const error = useAppSelector(selectCardsError)

    /* ─── Related cards ─── */
    const [related, setRelated] = useState<CardType[]>([])

    /* ─── Redirect if not logged in ─── */
    useEffect(() => {
        if (authStatus === 'loading') return
        if (!user) redirect('/login')
    }, [authStatus, user])

    /* ─── Fetch this card ─── */
    useEffect(() => {
        if (!card) dispatch(fetchCardById(cardId))
    }, [dispatch, cardId, card])

    /* ─── Fetch other cards of same business ─── */
    useEffect(() => {
        if (!card) return
        businessAPI.getWithCards(card.business.id).then(resp => {
            if (resp.error || !resp.data?.cards) return
            const others: CardType[] = resp.data.cards
                .filter(c => c.id !== card.id)
                .map(c => ({
                    id: c.id,
                    redirectUrl: c.redirect_url,
                    qrCode: c.qr_code ?? '',
                    createdAt: c.created_at,
                    deletedAt: c.deleted_at ?? null,
                    isActive: c.deleted_at == null,
                    business: card.business,
                }))
            setRelated(others)
        })
    }, [card])

    /* ─── Loading & error ─── */
    if (authStatus === 'loading' || status === 'loading')
        return <div className="flex h-screen items-center justify-center">Yükleniyor…</div>
    if (!user) return null
    if (error) return <p className="text-red-600">Hata: {error}</p>
    if (!card) return <p>Kart bulunamadı.</p>

    /* ─── Helpers ─── */
    const fmt = (iso?: string) =>
        iso && isValid(parseISO(iso))
            ? format(parseISO(iso), 'dd.MM.yyyy HH:mm:ss', { locale: tr })
            : '-'

    /* 6 aylık ömür */
    const createdDate = parseISO(card.createdAt)
    const expiryDate = addMonths(createdDate, 6)
    const remaining = differenceInCalendarDays(expiryDate, new Date())

    /* ─── Render ─── */
    return (
        <div className="space-y-6">
            {/* Back */}
            <Link href="/dashboard/kart-yonetimi">
                <Button variant="outline" size="icon">
                    <ArrowLeft />
                </Button>
            </Link>

            {/* Main card */}
            <CardUI className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>
                        {card.business.name} – Kart #{card.id}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p>
                        <strong>URL:</strong>{' '}
                        <a
                            href={card.redirectUrl}
                            target="_blank"
                            className="text-blue-600 hover:underline break-all"
                        >
                            {card.redirectUrl}
                        </a>
                    </p>
                    <p>
                        <strong>Oluşturma:</strong> {fmt(card.createdAt)}
                    </p>
                    <p>
                        <strong>Durum:</strong> {card.isActive ? 'Aktif' : 'Pasif'}
                    </p>
                    <p>
                        <strong>Son Kullanma:</strong> {fmt(expiryDate.toISOString())}
                    </p>
                    <p>
                        <strong>Kalan Gün:</strong>{' '}
                        {remaining >= 0 ? `${remaining} gün` : 'Süresi doldu'}
                    </p>

                    {card.qrCode && (
                        <div>
                            <strong>QR Kodu:</strong>
                            <div className="mt-2">
                                <img
                                    src={card.qrCode}
                                    alt="QR Code"
                                    className="w-48 h-48 object-contain"
                                />
                            </div>
                        </div>
                    )}

                    {/* Business Info */}
                    <div className="pt-4">
                        <strong>İşletme Bilgileri</strong>
                        <Table>
                            <TableCaption>İşletme detayı</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Alan</TableHead>
                                    <TableHead>Değer</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>{card.business.id}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Ad</TableCell>
                                    <TableCell>{card.business.name}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Email</TableCell>
                                    <TableCell>{card.business.email}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Rol</TableCell>
                                    <TableCell>{card.business.role}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Aktif</TableCell>
                                    <TableCell>{card.business.active ? 'Evet' : 'Hayır'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Oluşturma</TableCell>
                                    <TableCell>{fmt(card.business.created_at)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </CardUI>

            {/* Related cards */}
            {related.length > 0 && (
                <div className="mx-auto space-y-4">
                    <h2 className="text-xl font-semibold">Diğer Kartlar</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {related.map(rc => (
                            <CardUI
                                key={rc.id}
                                className="cursor-pointer hover:shadow-md"
                                onClick={() => router.push(`/dashboard/kart-yonetimi/${rc.id}`)}
                            >
                                <CardHeader>
                                    <CardTitle>Kart #{rc.id}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm break-all">URL: {rc.redirectUrl}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Oluş: {fmt(rc.createdAt)}
                                    </p>
                                </CardContent>
                            </CardUI>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
