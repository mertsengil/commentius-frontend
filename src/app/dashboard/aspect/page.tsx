'use client';

import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
} from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchAspectList, selectAspectState } from '@/features/aspect/aspectSlice';

/* ---- react-d3-cloud dynamic import (client-only) -------------- */
const D3WordCloud = dynamic(
    () => import('react-d3-cloud').then((m) => m.default),
    { ssr: false, loading: () => <Loader2 className="h-5 w-5 animate-spin" /> }
);

/** breakpoint helper */
function getBp(w: number) {
    if (w >= 1280) return 'xl';
    if (w >= 1024) return 'lg';
    if (w >= 768) return 'md';
    return 'sm';
}

export default function AspectsListPage() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { list, summary, loading, error } = useAppSelector(selectAspectState);

    /* fetch once */
    useEffect(() => {
        dispatch(fetchAspectList());
    }, [dispatch]);

    /* search term */
    const [search, setSearch] = useState('');

    /* TOP-200 for cloud */
    const words = useMemo(() => {
        if (!list?.length) return [];
        return [...list]
            .sort((a, b) => b.value - a.value)
            .slice(0, 200)
            .map(({ id, text, value }) => ({ id, text, value }));
    }, [list]);

    /* measure container width */
    const containerRef = useRef<HTMLDivElement>(null);
    const [wcWidth, setWcWidth] = useState(0);
    const measure = useCallback(() => {
        if (containerRef.current) {
            const w = containerRef.current.clientWidth;
            setWcWidth((prev) => (prev !== w ? w : prev));
        }
    }, []);
    useEffect(() => {
        requestAnimationFrame(measure);
        if (words.length) measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [measure, words]);

    /* sizes for cloud */
    const bp = getBp(wcWidth);
    const wcHeight = bp === 'xl' ? 380 : bp === 'lg' ? 320 : bp === 'md' ? 280 : 240;
    const baseFont = bp === 'xl' ? 13 : bp === 'lg' ? 12 : bp === 'md' ? 11 : 10;

    /* infinite scroll */
    const [visibleCount, setVisibleCount] = useState(50);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    /* filtered by search */
    const filtered = useMemo(() => {
        return list.filter((a) =>
            a.text.toLowerCase().includes(search.trim().toLowerCase())
        );
    }, [list, search]);

    /* slice for visible */
    const visibleList = useMemo(() => {
        return filtered.slice(0, visibleCount);
    }, [filtered, visibleCount]);

    useEffect(() => {
        const sentinel = loadMoreRef.current;
        if (!sentinel) return;
        const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && visibleCount < filtered.length) {
                setVisibleCount((c) => Math.min(c + 50, filtered.length));
            }
        });
        io.observe(sentinel);
        return () => io.disconnect();
    }, [filtered.length, visibleCount]);

    /* loading placeholder */
    if (loading) {
        return (
            <AnimatePresence>
                <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 space-y-6"
                >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-6 w-full" />
                        ))}
                    </div>
                    <div className="w-full h-64 bg-gray-200 animate-pulse rounded" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-8 w-full" />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    /* error state */
    if (error) {
        return (
            <div className="p-6 flex justify-center">
                <span className="text-red-600 font-medium">{error}</span>
            </div>
        );
    }

    /* render */
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-4 space-y-6"
        >
            <Card>
                <CardHeader>
                    <p className="font-medium">Tüm Aspect’ler – Kelime Bulutu</p>
                </CardHeader>

                {/* stats */}
                {summary && (
                    <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        <div>Toplam İnceleme: {summary.reviewCount}</div>
                        <div className="text-green-700">
                            Pozitif: {summary.positiveReviews}
                        </div>
                        <div className="text-rose-700">
                            Negatif: {summary.negativeReviews}
                        </div>
                        <div className="text-gray-700">
                            Nötr: {summary.neutralReviews}
                        </div>
                    </CardContent>
                )}

                {/* word cloud */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <CardContent ref={containerRef} style={{ height: wcHeight }}>
                        {!words.length ? (
                            <Alert variant="secondary" className="flex items-start gap-3">
                                <AlertTitle>Veri bulunamadı</AlertTitle>
                                <AlertDescription>Henüz aspect verisi yok.</AlertDescription>
                            </Alert>
                        ) : (
                            wcWidth > 0 && (
                                <D3WordCloud
                                    key={words.length}
                                    data={words}
                                    width={wcWidth}
                                    height={wcHeight}
                                    fontSize={(d) => baseFont + Math.sqrt(d.value) * 3}
                                    rotate={() => (Math.random() > 0.5 ? 0 : 90)}
                                    padding={2}
                                    style={{ cursor: 'pointer' }}
                                    onWordClick={(_, d) =>
                                        router.push(`/dashboard/aspect/${d.id}`)
                                    }
                                />
                            )
                        )}
                    </CardContent>
                </motion.div>

                {/* search */}
                <div className="px-6">
                    <Input
                        placeholder="Ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full max-w-sm transition-colors duration-200 ease-in-out focus:ring"
                    />
                </div>

                {/* infinite scroll grid with progress bars */}
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 px-6">
                    {visibleList.map((a) => {
                        const barTotal = a.positive + a.negative || 1;
                        const posPct = (a.positive / barTotal) * 100;

                        return (
                            <motion.div
                                key={a.id}
                                onClick={() => router.push(`/dashboard/aspect/${a.id}`)}
                                className="cursor-pointer rounded-lg border p-3 hover:shadow-lg transition-shadow duration-200"
                                whileHover={{ scale: 1.03 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                                <div className="font-medium text-sm mb-1">{a.text}</div>

                                {/* Progress bar */}
                                <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${posPct}%` }}
                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                        className={`h-full ${posPct < 30
                                            ? 'bg-rose-500'
                                            : posPct < 70
                                                ? 'bg-yellow-500'
                                                : 'bg-green-500'
                                            }`}
                                    />
                                </div>

                                {/* Counts */}
                                <div className="mt-1 text-xs text-gray-600">
                                    ✔️ {a.positive} | ❌ {a.negative} | ➖ {a.neutral}
                                </div>
                            </motion.div>
                        );
                    })}
                    <div ref={loadMoreRef} className="h-1 col-span-full" />
                </CardContent>
            </Card>
        </motion.div>
    );
}
