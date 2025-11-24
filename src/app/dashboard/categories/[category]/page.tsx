// src/app/dashboard/categories/[category]/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Info, ArrowUpRight } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
    fetchCategoryDetail,
    clearDetail,
    selectCategoriesState,
} from '@/features/categories/categoriesSlice';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Alert,
    AlertTitle,
    AlertDescription,
} from '@/components/ui/alert';
import {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent,
} from '@/components/ui/hover-card';
import ReviewCard from '@/components/reviews/ReviewCard';

/* ---- react-d3-cloud dynamic import ---- */
const D3WordCloud = dynamic(
    () => import('react-d3-cloud').then(m => m.default),
    { ssr: false },
);

/* ------------ sabit stiller --------------------------------------- */
const pill = {
    positive:
        'bg-lime-200 dark:bg-lime-700/50 text-green-900 dark:text-lime-100',
    negative:
        'bg-rose-200 dark:bg-rose-700/50 text-rose-900 dark:text-rose-100',
    neutral:
        'bg-gray-200 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100',
} as const;

/* Emoji haritası */
const catEmoji: Record<string, string> = {
    drink: '🍹',
    food: '🍽️',
    hygiene: '🧼',
    location: '📍',
    other: '🏷️',
    price: '💸',
    ambience: '🎶',
    service: '🛎️',
    view: '🌅',
    waiter: '🤵',
};

/* Fosforlu BG renkleri (cümle içi) */
const hi = {
    positive:
        'bg-lime-300/80 dark:bg-lime-600/70 text-black dark:text-lime-50 rounded px-1',
    negative:
        'bg-rose-300/80 dark:bg-rose-600/70 text-black dark:text-rose-50 rounded px-1',
    neutral:
        'bg-gray-300/80 dark:bg-gray-500/70 text-black dark:text-gray-50 rounded px-1',
} as const;

/* Sentiment için Badge renkleri */
const sentimentText = {
    positive: 'text-green-700 dark:text-green-300',
    negative: 'text-rose-700 dark:text-rose-300',
    neutral: 'text-gray-700 dark:text-gray-300',
} as const;

/* Aspect highlight helper */
function highlightAspects(
    text: string,
    aspects: { id: number; aspect: string; category: string; sentiment: 'positive' | 'negative' | 'neutral' }[]
) {
    if (!text || aspects.length === 0) return text;
    const textLower = text.toLocaleLowerCase('tr-TR');
    const sorted = [...aspects]
        .map(a => ({ ...a, aspect: a.aspect.toLocaleLowerCase('tr-TR') }))
        .sort((a, b) => b.aspect.length - a.aspect.length);

    const parts: (string | JSX.Element)[] = [];
    let idx = 0, key = 0;

    while (idx < text.length) {
        let hitPos = -1;
        let hitAspect: typeof sorted[0] | null = null;
        for (const a of sorted) {
            const p = textLower.indexOf(a.aspect, idx);
            if (p !== -1 && (hitPos === -1 || p < hitPos)) {
                hitPos = p;
                hitAspect = a;
            }
        }
        if (hitPos === -1 || !hitAspect) {
            parts.push(text.slice(idx));
            break;
        }
        if (hitPos > idx) parts.push(text.slice(idx, hitPos));
        const end = hitPos + hitAspect.aspect.length;
        const matched = text.slice(hitPos, end);

        parts.push(
            <HoverCard key={key++}>
                <HoverCardTrigger asChild>
                    <Link href={`/dashboard/aspect/${hitAspect.id}`} className={hi[hitAspect.sentiment]}>
                        {matched}
                    </Link>
                </HoverCardTrigger>
                <HoverCardContent className="text-xs leading-tight w-56">
                    <p className="font-medium">{hitAspect.aspect}</p>
                    <p className="text-muted-foreground">
                        {catEmoji[hitAspect.category] ?? ''} {hitAspect.category}
                    </p>
                    <p>
                        Duygu:{' '}
                        {hitAspect.sentiment === 'positive'
                            ? 'Pozitif'
                            : hitAspect.sentiment === 'negative'
                                ? 'Negatif'
                                : 'Nötr'}
                    </p>
                </HoverCardContent>
            </HoverCard>
        );
        idx = end;
    }

    return parts;
}

function getBp(w: number) {
    if (w >= 1280) return 'xl';
    if (w >= 1024) return 'lg';
    if (w >= 768) return 'md';
    return 'sm';
}

export default function CategoryDetailPage() {
    const { category } = useParams() as { category: string };
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { detail, loadingDetail, detailError } = useAppSelector(selectCategoriesState);

    useEffect(() => {
        dispatch(fetchCategoryDetail(category));
        return () => void dispatch(clearDetail());
    }, [dispatch, category]);

    const { summary, words, reviews } = useMemo(() => {
        if (!detail) return { summary: null, words: [], reviews: [] as any[] };
        const reviewsArr = detail.reviews ?? [];
        const positiveReviews = reviewsArr.filter(r => r.overallSentiment === 'positive').length;
        const negativeReviews = reviewsArr.filter(r => r.overallSentiment === 'negative').length;
        const neutralReviews = reviewsArr.length - positiveReviews - negativeReviews;
        const wordsArr = Array.isArray(detail.aspectGroup)
            ? detail.aspectGroup.map(({ id, text, value }: any, i: number) => ({ id: id ?? i, text, value: Number(value) }))
            : Object.entries(detail.aspectGroup ?? {}).map(([k, v]) => ({ id: Number(k), text: k, value: Number(v) }));
        const totalAspect = wordsArr.reduce((sum, w) => sum + w.value, 0);
        return {
            summary: { category, reviewCount: reviewsArr.length, positiveReviews, negativeReviews, neutralReviews, totalAspect },
            words: wordsArr,
            reviews: reviewsArr,
        };
    }, [detail, category]);

    const containerRef = useRef<HTMLDivElement>(null);
    const [wcWidth, setWcWidth] = useState(0);
    useEffect(() => {
        const measure = () => {
            if (!containerRef.current) return;
            const w = containerRef.current.clientWidth;
            setWcWidth(prev => (prev !== w ? w : prev));
        };
        requestAnimationFrame(measure);
        if (words.length) measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [words]);

    const bp = getBp(wcWidth);
    const wcHeight = bp === 'xl' ? 380 : bp === 'lg' ? 320 : bp === 'md' ? 280 : 240;
    const baseFont = bp === 'xl' ? 13 : bp === 'lg' ? 12 : bp === 'md' ? 11 : 10;

    if (loadingDetail) {
        return (
            <div className="p-6 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }
    if (detailError) {
        return (
            <div className="p-6 flex justify-center">
                <span className="text-red-600 font-medium">{detailError}</span>
            </div>
        );
    }
    if (!summary) return null;

    const hasData = summary.totalAspect > 0 || summary.reviewCount > 0;

    return (
        <div className="space-y-6 p-4 mx-auto">
            {/* Başlık */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold capitalize flex items-center gap-2">
                    {summary.category}
                    <Badge variant="outline">{summary.totalAspect} aspect</Badge>
                </h1>
            </div>

            {/* Uyarı */}
            {!hasData && (
                <Alert variant="secondary" className="flex items-start gap-3">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                        <AlertTitle>Veri bulunamadı</AlertTitle>
                        <AlertDescription>
                            Bu kategoriye ait inceleme veya aspect kaydı henüz yok.
                        </AlertDescription>
                    </div>
                </Alert>
            )}

            {/* İstatistikler */}
            <Card>
                <CardHeader>Genel İstatistikler</CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                    <div>Toplam İnceleme: {summary.reviewCount}</div>
                    <div className="text-green-700">Pozitif: {summary.positiveReviews}</div>
                    <div className="text-rose-700">Negatif: {summary.negativeReviews}</div>
                    <div className="text-gray-700">Nötr: {summary.neutralReviews}</div>
                </CardContent>
            </Card>

            {/* Kelime Bulutu */}
            {words.length > 0 && (
                <Card>
                    <CardHeader>Aspect Kelime Bulutu</CardHeader>
                    <CardContent ref={containerRef} style={{ height: wcHeight }}>
                        {wcWidth > 0 && (
                            <D3WordCloud
                                data={words}
                                width={wcWidth}
                                height={wcHeight}
                                fontSize={w => baseFont + Math.sqrt(w.value) * 3}
                                rotate={() => (Math.random() > 0.5 ? 0 : 90)}
                                padding={2}
                                style={{ cursor: 'pointer' }}
                                onWordClick={(_, d) => router.push(`/dashboard/aspect/${d.id}`)}
                            />
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Yorum Listesi */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reviews.map(r => (
                    <ReviewCard
                        key={r.id ?? r.reviewId}
                        review={{
                            id: r.id ?? r.reviewId,
                            type: r.type,                      // google, tripadvisor, vs.
                            reviewerPhotoUrl: r.reviewerPhotoUrl ?? null,
                            name: r.reviewerName ?? r.name ?? 'Anonim',
                            publishedAtDate: r.publishedAtDate,
                            stars: r.stars ?? r.rating ?? null,
                            text: r.text,
                            replies: r.replies,
                            aspects: r.aspects,
                            reviewImageUrls: r.reviewImageUrls,
                            reviewUrl: r.reviewUrl,            // dış bağlantı (varsa)
                        }}


                    />
                ))}
            </div>

        </div>
    );
}
