/* ------------------------------------------------------------------ */
/*  src/app/dashboard/api-anahtarlari/page.tsx                        */
/* ------------------------------------------------------------------ */
'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Plus,
    Trash,
    Loader2,
    KeyRound,
    Save,
    X,
    Eye,
    EyeOff,
    RotateCw,               // NEW
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { useAppSelector } from '@/lib/hooks';
import { selectAuthStatus, selectAuthUser } from '@/features/auth/authSlice';
import { apiKeysAPI } from '@/lib/api';
import { maskToken } from '@/types/api-key';
import type { ApiKey } from '@/types/api-key';

import { Button } from '@/components/ui/button';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
    TableCaption,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ApifyKeysPage() {
    /* ---------- Auth kontrolü ---------- */
    const authStatus = useAppSelector(selectAuthStatus);
    const user = useAppSelector(selectAuthUser);

    useEffect(() => {
        if (authStatus === 'loading') return;
        if (!user) return redirect('/login');
        if (user.role !== 'admin') redirect('/dashboard');
    }, [authStatus, user]);

    /* ---------- State ---------- */
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [adding, setAdding] = useState(false);
    const [newToken, setNewToken] = useState('');

    const [visibleIds, setVisibleIds] = useState<Set<number>>(new Set());
    const [refreshingIds, setRefreshingIds] = useState<Set<number>>(new Set());   // NEW

    /* ---------- Fetch ---------- */
    const fetchKeys = async () => {
        setLoading(true);
        setError(null);

        /* cache varsa ilk onu göster */
        const cached = sessionStorage.getItem('apify_tokens_cache');
        if (cached) setKeys(JSON.parse(cached));

        const res = await apiKeysAPI.fetchAll();
        if (res.error || !res.data) {
            setError(res.error || 'Anahtarlar getirilemedi');
        } else {
            setKeys(res.data);
            sessionStorage.setItem('apify_tokens_cache', JSON.stringify(res.data));
        }
        setLoading(false);
    };
    useEffect(() => { fetchKeys(); }, []);

    const fmt = (iso: string) =>
        format(new Date(iso), 'dd.MM.yyyy HH:mm', { locale: tr });

    /* ---------- CRUD ---------- */
    const handleAdd = async () => {
        if (!newToken.trim()) return toast.error('Token boş olamaz');
        const res = await apiKeysAPI.create(newToken.trim());
        if (res.error) return toast.error(res.error);
        toast.success('Eklendi');
        setNewToken('');
        setAdding(false);
        fetchKeys();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Silmek istediğinize emin misiniz?')) return;
        const res = await apiKeysAPI.remove(id);
        if (res.error) return toast.error(res.error);
        toast.success('Silindi');
        fetchKeys();
    };

    /* ---------- Bakiye Yenile ---------- */             // NEW
    const handleRefresh = async (id: number) => {         // NEW
        setRefreshingIds(p => new Set(p).add(id));          // NEW
        const res = await apiKeysAPI.refreshUsage(id);      // NEW
        if (res.error || !res.data) {                       // NEW
            toast.error(res.error || 'Bakiye alınamadı');     // NEW
        } else {                                            // NEW
            setKeys(prev =>                                   // NEW
                prev.map(k =>                                   // NEW
                    k.id === id ? { ...k, balance: res.data.balance } : k, // NEW
                ),                                              // NEW
            );                                                // NEW
            toast.success('Bakiye güncellendi');              // NEW
        }                                                   // NEW
        setRefreshingIds(p => { const n = new Set(p); n.delete(id); return n; }); // NEW
    };                                                    // NEW

    /* ---------- görünürlük toggle ---------- */
    const toggleVisible = (id: number) =>
        setVisibleIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    /* ---------- UI ---------- */
    if (loading || authStatus === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin h-6 w-6" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Başlık */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/api-anahtarlari">
                    <Button variant="outline" size="icon">
                        <ArrowLeft />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <KeyRound className="w-5 h-5" /> Apify API Anahtarları
                </h1>
            </div>

            {/* Ekle formu */}
            {adding ? (
                <Card className="max-w-lg">
                    <CardHeader>
                        <CardTitle>Yeni Anahtar</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Input
                            value={newToken}
                            placeholder="apify_api_..."
                            onChange={e => setNewToken(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleAdd}>
                                <Save className="w-4 h-4 mr-1" /> Kaydet
                            </Button>
                            <Button variant="outline" onClick={() => setAdding(false)}>
                                <X className="w-4 h-4 mr-1" /> İptal
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Button onClick={() => setAdding(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Anahtar Ekle
                </Button>
            )}

            {/* Hata mesajı */}
            {error && <p className="text-red-600">{error}</p>}

            {/* Liste */}
            <div className="bg-white rounded shadow overflow-auto">
                <Table>
                    <TableCaption>Toplam {keys.length} anahtar</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Anahtar</TableHead>
                            <TableHead>Bakiye</TableHead>
                            <TableHead>Oluşturuldu</TableHead>
                            <TableHead>Güncellendi</TableHead>
                            <TableHead>Aksiyon</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {keys.map(k => {
                            const isVisible = visibleIds.has(k.id);
                            return (
                                <TableRow key={k.id}>
                                    <TableCell>{k.id}</TableCell>
                                    <TableCell className="break-all">
                                        {isVisible ? k.token : maskToken(k.token)}
                                    </TableCell>
                                    <TableCell>${k.balance}</TableCell>
                                    <TableCell>{fmt(k.createdAt)}</TableCell>
                                    <TableCell>{fmt(k.updatedAt)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {/* Göster / Gizle */}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => toggleVisible(k.id)}
                                            >
                                                {isVisible ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </Button>

                                            {/* Yenile */}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleRefresh(k.id)}
                                                disabled={refreshingIds.has(k.id)}
                                            >
                                                {refreshingIds.has(k.id) ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <RotateCw className="w-4 h-4" />
                                                )}
                                            </Button>

                                            {/* Sil */}
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => handleDelete(k.id)}
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
