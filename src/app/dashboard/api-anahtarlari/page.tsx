'use client'

import { useState } from 'react'
import { useRouter, redirect } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, KeyRound, Clock8 } from 'lucide-react'

import { useAppSelector } from '@/lib/hooks'
import { selectAuthStatus, selectAuthUser } from '@/features/auth/authSlice'
import { apiKeysAPI } from '@/lib/api'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function ApiKeyServicesPage() {
    const router = useRouter()
    const authStatus = useAppSelector(selectAuthStatus)
    const user = useAppSelector(selectAuthUser)

    if (authStatus !== 'loading' && !user) redirect('/login')
    if (user && user.role !== 'admin') redirect('/dashboard')

    const [loading, setLoading] = useState(false)

    const handleApifyClick = async () => {
        setLoading(true)
        const res = await apiKeysAPI.fetchAll()
        setLoading(false)

        if (res.error || !res.data) {
            return toast.error(res.error || 'Apify anahtarları alınamadı')
        }

        sessionStorage.setItem('apify_tokens_cache', JSON.stringify(res.data))
        router.push('/dashboard/api-anahtarlari/apify')
    }

    return (
        <div className="w-full px-4 mx-auto">
            {/* Başlık */}
            <div className="flex items-center gap-3 mb-6">
                <Link href="/dashboard/hesap-yonetimi">
                    <Button variant="outline" size="icon">←</Button>
                </Link>
                <h1 className="text-2xl font-bold">API Anahtarları</h1>
            </div>

            {/* Kart Izgarası */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {/* Apify */}
                <Card
                    className="h-full flex flex-col cursor-pointer hover:shadow-md"
                    onClick={loading ? undefined : handleApifyClick}
                >
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5" /> Apify
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-2">
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin h-5 w-5" />
                                <span>Yükleniyor…</span>
                            </>
                        ) : (
                            <span>Mevcut anahtarları görüntüle</span>
                        )}
                    </CardContent>
                </Card>

                {/* Placeholder */}
                <Card className="opacity-60 cursor-not-allowed h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock8 className="w-5 h-5" /> Yakında…
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        Sıradaki servis entegrasyonu burada görünecek.
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
