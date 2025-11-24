/* ------------------------------------------------------------------ */
/*  src/types/category.ts                                             */
/* ------------------------------------------------------------------ */

/* ----------------  Liste kartları için özet satırı ---------------- */
export interface CategorySummary {
    /** Örn: "food" */
    category: string;

    /* Aspect sayıları */
    positiveAspects: number;
    negativeAspects: number;
    neutralAspects: number;

    /* Review sayıları */
    reviewCount: number;
    positiveReviews: number;
    negativeReviews: number;
    neutralReviews: number;
}

/* --------------  (API'de yoksa ileride eklenir) -------------------- */
export interface AspectBrief {
    id: number;
    aspect: string;
    total: number;
    positive: number;
    neutral: number;
    negative: number;
}

/* ----------------------  Detay Sayfası ----------------------------- */
export type Sentiment = 'positive' | 'negative' | 'neutral';

/** Tek bir yorumun sade hâli (detay cevabındaki reviews dizisi) */
export interface CategoryReview {
    reviewId: string | null;           // ← veya reviewId?: string;
    publishedAtDate: string;           // ISO tarih
    text: string;
    overallSentiment: Sentiment;

    /* İstatistikler (API gönderiyorsa) */
    positiveAspects: number;
    negativeAspects: number;
    neutralAspects: number;

    /* Aspect vurguları (opsiyonel) */
    aspects?: {
        aspect: string;
        sentiment: Sentiment;
    }[];
}

export interface CategoryDetailResponse {
    reviews: CategoryReview[];
    /**  "anahtar": frekans  */
    aspectGroup: Record<string, number>;
}