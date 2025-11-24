// src/types/aspect.ts
/* ------------------------------------------------------------------ */
/*  Ortak tipler                                                      */
/* ------------------------------------------------------------------ */

/** Bulut, grafik vb. için basit kelime + skor */
export interface AspectWord {
    id: number;
    text: string;
    value: number;
}

/** Her bir aspect’in toplam ve duygu dağılımı */
export interface AspectStat {
    id: number;
    text: string;
    value: number;      // toplam geçme sayısı
    positive: number;
    negative: number;
    neutral: number;
}

/** Liste uç noktası için özet */
export interface AspectSummary {
    reviewCount: number;
    positiveReviews: number;
    negativeReviews: number;
    neutralReviews: number;
}

/** GET /reviews/aspect cevabı */
export interface AspectListResponse {
    aspectGroup: AspectStat[];
    summary: AspectSummary;
    // gelecekte ek alanlar: topCategories, chartsData, v.b.
    [key: string]: any;
}


/* ─────────────  NEW ASPECTS  ───────────── */
export interface NewAspectReview {
    id: number;
    text: string;
    stars: number;
    publishedAtDate: string;
}

export interface NewAspect {
    id: number;
    text: string;
    count: number;          // bu kelimenin geçtiği yorum sayısı
    lastUsed: string;          // ISO
    reviews: NewAspectReview[];
}

/* ------------------------------------------------------------------ */
/*  Detay uç noktası                                                  */
/* ------------------------------------------------------------------ */

/** Tek bir yorum-aspect satırı (detay sayfası) */
export interface AspectDetailItem {
    id: number;
    reviewId: number;
    review: {
        id: number;
        type: string;
        analyzed: boolean;
        tableId: number | null;
        businessId: number;
        searchString: string;
        reviewId: number | null;
        reviewerId: number | null;
        reviewerUrl: string;
        name: string;
        reviewerNumberOfReviews: number;
        isLocalGuide: boolean;
        text: string;
        textTranslated: string;
        publishAt: string | null;
        publishedAtDate: string;
        likesCount: number;
        reviewUrl: string;
        reviewOrigin: string | null;
        stars: number;
        rating: number | null;
        responseFromOwnerDate: string | null;
        responseFromOwnerText: string | null;
    };
    aspect: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    category: string;
}

/** GET /reviews/aspect/:id  →  detay dizisi */
export type AspectDetailResponse = AspectDetailItem[];
