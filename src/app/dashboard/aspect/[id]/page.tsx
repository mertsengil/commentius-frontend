/* ------------------------------------------------------------------ */
/*  src/app/dashboard/aspects/[id]/page.tsx                           */
/* ------------------------------------------------------------------ */
'use client';

import React, { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';

import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
    fetchAspectDetail,
    clear,
    selectAspectState,
} from '@/features/aspect/aspectSlice';

/* ui */
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Slash, XCircle } from 'lucide-react';

/* ortak yorum bileşeni */
import ReviewCard from '@/components/reviews/ReviewCard';

/* ------------------------------------------------------------------ */
/* Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AspectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const { detail, loadingDetail, detailError } = useAppSelector(selectAspectState);

    /* fetch / cleanup */
  useEffect(() => {
    if (id) {
        dispatch(fetchAspectDetail(id));
    }
}, [dispatch, id]);
    /* ─────────────── UI durumları ─────────────── */
    if (loadingDetail) {
        return (
            <div className="p-6 space-y-4 animate-pulse">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
            </div>
        );
    }

    if (detailError) {
        return (
            <Alert variant="destructive" className="m-6">
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>{detailError}</AlertDescription>
            </Alert>
        );
    }

    if (!detail?.length) {
        return (
            <Alert variant="secondary" className="m-6">
                <AlertTitle>Veri Bulunamadı</AlertTitle>
                <AlertDescription>Bu aspect için henüz yorum yok.</AlertDescription>
            </Alert>
        );
    }

    /* ─────────────── İstatistikler ─────────────── */
    const aspectName = detail[0].aspect;
    const categoryName = detail[0].category;

    const total = detail.length;
    const positiveCount = detail.filter(d => d.sentiment === 'positive').length;
    const neutralCount = detail.filter(d => d.sentiment === 'neutral').length;
    const negativeCount = detail.filter(d => d.sentiment === 'negative').length;

    const pct = (count: number) => `${(count / total) * 100}%`;

    /* ─────────────── REVIEW BAZLI NORMALIZATION ─────────────── */
    const reviews = useMemo(() => {
        const map = new Map<number, any>();

        detail.forEach(item => {
            const reviewId = item.review?.id ?? item.reviewId;

            if (!map.has(reviewId)) {
                map.set(reviewId, {
                    id: reviewId,
                    type: item.review.type,
                    reviewerPhotoUrl: item.review.reviewerPhotoUrl ?? null,
                    name: item.review.name ?? 'Anonim',
                    publishedAtDate: item.review.publishedAtDate,
                    stars: item.review.stars ?? item.review.rating ?? null,
                    text: item.review.text,
                    replies: item.review.replies,
                    reviewImageUrls: item.review.reviewImageUrls,
                    reviewUrl: item.review.reviewUrl,
                    textTranslated: item.review.textTranslated,
                    aspects: [],
                });
            }

            map.get(reviewId).aspects.push({
                id: item.id, // aspect-detail id
                aspect: item.aspect,
                category: item.category,
                sentiment: item.sentiment,
            });
        });

        return Array.from(map.values());
    }, [detail]);

    /* ─────────────── Render ─────────────── */
    return (
        <div className="p-6 space-y-8">
            {/* Başlık */}
            <h1 className="text-3xl font-bold">
                Aspect:&nbsp;
                <span className="text-indigo-600">{aspectName}</span>{' '}
                <span className="text-sm text-gray-500">({categoryName})</span>
            </h1>

            {/* Özet Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="shadow-lg hover:shadow-2xl transition-shadow">
                    <CardHeader className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span>Pozitif</span>
                    </CardHeader>
                    <CardContent className="text-3xl font-extrabold text-green-700">
                        {positiveCount}
                    </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-2xl transition-shadow">
                    <CardHeader className="flex items-center space-x-2 text-gray-600">
                        <Slash className="w-5 h-5" />
                        <span>Nötr</span>
                    </CardHeader>
                    <CardContent className="text-3xl font-extrabold text-gray-700">
                        {neutralCount}
                    </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-2xl transition-shadow">
                    <CardHeader className="flex items-center space-x-2 text-red-600">
                        <XCircle className="w-5 h-5" />
                        <span>Negatif</span>
                    </CardHeader>
                    <CardContent className="text-3xl font-extrabold text-red-700">
                        {negativeCount}
                    </CardContent>
                </Card>
            </div>

            {/* Sentiment Dağılımı */}
            <Card className="shadow rounded-lg">
                <CardHeader>Sentiment Dağılımı</CardHeader>
                <CardContent>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div className="h-full bg-green-500 inline-block" style={{ width: pct(positiveCount) }} />
                        <div className="h-full bg-gray-500 inline-block" style={{ width: pct(neutralCount) }} />
                        <div className="h-full bg-red-500 inline-block" style={{ width: pct(negativeCount) }} />
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                        <span className="mr-4">Pozitif: {positiveCount}</span>
                        <span className="mr-4">Nötr: {neutralCount}</span>
                        <span>Negatif: {negativeCount}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Yorum Listesi (ARTIK TEKİL) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map(review => (
                    <ReviewCard
                        key={review.id}
                        review={review}
                    />
                ))}
            </div>
        </div>
    );
}
