/* ------------------------------------------------------------------ */
/*  src/app/dashboard/reviews/page.tsx                                */
/* ------------------------------------------------------------------ */
'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
    fetchReviews,
    setPage,
    setLimit,
    selectReviewsState,
} from '@/features/reviews/reviewsSlice';
import { selectAuthUser } from '@/features/auth/authSlice';

/* shadcn/ui */
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

/* Ortak kart bileşeni */
import ReviewCard from '@/components/reviews/ReviewCard';

/* ------------------------------------------------------------------ */
const LIMIT_OPTIONS = [10, 20, 50, 100] as const;

/* ------------------------------------------------------------------ */
export default function ReviewsPage() {
    const dispatch = useAppDispatch();
    const { items, loading, page, limit, total, totalPages } =
        useAppSelector(selectReviewsState);
    const tokens = useAppSelector(selectAuthUser)?.reviewReplyTokens ?? 0;

    /* Verileri getir */
    useEffect(() => {
        dispatch(fetchReviews({ page, limit }));
    }, [dispatch, page, limit]);

    return (
        <div className="space-y-6 p-4 mx-auto">
            {/* ÜST BAR ------------------------------------------------------- */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Yorumlar ({total})</h1>

                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="flex items-center gap-1">
                        <Image src="/images/ai.svg" alt="" width={14} height={14} />
                        <span>Kalan Yanıt Kredisi: {tokens}</span>
                    </Badge>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Göster:</span>
                        <Select
                            value={limit.toString()}
                            onValueChange={v => dispatch(setLimit(+v))}
                        >
                            <SelectTrigger className="w-20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {LIMIT_OPTIONS.map(o => (
                                    <SelectItem key={o} value={o.toString()}>
                                        {o}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* GRID ---------------------------------------------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loading
                    ? Array.from({ length: limit }).map((_, i) => (
                        <div
                            key={i}
                            className="p-4 border rounded-lg space-y-3 animate-pulse"
                        >
                            <div className="h-4 w-3/4 bg-muted rounded" />
                            <div className="h-3 w-full bg-muted rounded" />
                            <div className="h-3 w-5/6 bg-muted rounded" />
                        </div>
                    ))
                    : items.map(r => <ReviewCard key={r.id} review={r} />)}
            </div>

            {/* PAGINATION ---------------------------------------------------- */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                    Sayfa {page} / {totalPages}
                </span>

                <div className="space-x-2">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={page === 1 || loading}
                        onClick={() => dispatch(setPage(page - 1))}
                    >
                        Önceki
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={page === totalPages || loading}
                        onClick={() => dispatch(setPage(page + 1))}
                    >
                        Sonraki
                    </Button>
                </div>
            </div>
        </div>
    );
}
