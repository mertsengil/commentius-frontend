/* ------------------------------------------------------------------ */
/*  src/features/dashboard/dashboardSlice.ts                          */
/* ------------------------------------------------------------------ */
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { cardsAPI, reviewsAPI } from '@/lib/api';
import type { RootState } from '@/lib/store';

/* ──────────────────────────── THUNKS ────────────────────────────── */

/** ① Ana dashboard verisi (kart + yorum + yeni aspect) */
export const fetchDashboard = createAsyncThunk(
    'dashboard/fetchDashboard',
    async (_, { rejectWithValue }) => {
        try {
            const [cardRes, reviewRes] = await Promise.all([
                cardsAPI.fetchBusinessDashboard(),
                reviewsAPI.getDashboard(),          // /reviews/dashboard
            ]);

            if (cardRes.error) return rejectWithValue(cardRes.error);
            if (reviewRes.error) return rejectWithValue(reviewRes.error);

            return {
                ...cardRes.data!,
                lastReviews: reviewRes.data!.lastReviews,
                topAspects: reviewRes.data!.topAspects,
                newAspects: reviewRes.data!.newAspects ?? [],
                previousWeekCount: reviewRes.data!.previousWeekCount,
                currentWeekCount: reviewRes.data!.currentWeekCount,
            };
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    },
);
export const fetchAspectCompare = createAsyncThunk<
    // dönen payload tipi
    Awaited<ReturnType<typeof reviewsAPI.getAspectCompare>>['data'],
    // thunk arg tipi
    number[] | undefined
>(
    'dashboard/fetchAspectCompare',
    async (ids, { rejectWithValue }) => {
        const resp = await reviewsAPI.getAspectCompare(ids);
        return resp.error ? rejectWithValue(resp.error) : resp.data!;
    },
);


/** ② Belirli kartın okuma listesi */
export const fetchCardReads = createAsyncThunk(
    'dashboard/fetchCardReads',
    async (cardId: number, { rejectWithValue }) => {
        const resp = await cardsAPI.fetchCardReads(cardId);
        if (resp.error) return rejectWithValue(resp.error);
        return { cardId, reads: resp.data!.reads, business: resp.data!.business };
    },
);

export const fetchRadar = createAsyncThunk(
    'dashboard/fetchRadar',
    async (_, { rejectWithValue }) => {
        const res = await reviewsAPI.getCategoriesAll();
        if (res.error) return rejectWithValue(res.error);

        /* ------------ MAP ------------- */
        const list = res.data!;                 // <- dizi
        const categories = list[0]?.categoryStats.map(c => c.category) ?? [];

        const series: RadarSeries[] = list.map((biz, idx) => {
            // Toplam pozitif+negatif+neutral = reviewCount
            const values = categories.map(cat => {
                const stat = biz.categoryStats.find(c => c.category === cat)!;
                const total = stat.positiveReviews + stat.negativeReviews + stat.neutralReviews || 1;
                // Pozitif oranını 0-1 arası alalım (isteğe göre değiştirebilirsiniz)
                return stat.positiveReviews / total;
            });

            return { id: idx, name: biz.name, values };
        });

        return { categories, series };          // slice’a bu ikisi gönderilir
    }
);

/* ──────────────────────────── TYPES ─────────────────────────────── */
export interface BusinessNameId { id: number; name: string }   // ✨ EKLE
export interface AspectCompareItem {                           // ✨ EKLE
    aspect: string;
    stats: Record<number, { positive: number; negative: number; neutral: number }>;
}

export interface CardRead {
    id: number; readAt: string; ip: string; ua: string; cardId: number;
    business?: Business;
}

interface ReadCountItem {
    card: { id: number; name: string; redirect_url: string; created_at: string };
    readCount: number;
}

export interface Business {
    id: number; name: string; email: string; phone: string | null;
    role: string; active: boolean; createdAt: string; updatedAt: string;
    deletedAt: string | null;
}

export interface LastReview {
    id: number; name: string; text: string; publishedAtDate: string; stars: number;
}

export interface AspectStat {
    id: number; text: string; value: number;
    positive: number; negative: number; neutral: number;
}

export interface NewAspectReview {
    id: number; text: string; stars: number; publishedAtDate: string;
}
export interface NewAspect {
    id: number; text: string; count: number; lastUsed: string;
    reviews: NewAspectReview[];
}

/* —— Radar —— */
export interface RadarSeries {
    id: number;          // index veya businessId
    name: string;        // işletme adı
    values: number[];    // 0-1 skalasında review yüzdeleri
}
export interface RadarState {
    categories: string[];
    series: RadarSeries[];
}

/* ──────────────────────────── STATE ─────────────────────────────── */

interface DashboardState {
    /* Kart analitiği */
    cardCount: number;
    readCountByCard: ReadCountItem[];
    cardReads: CardRead[];
    readsByCard: Record<number, CardRead[]>;
    businessByCard: Record<number, Business>;
    aspectCompare: {                                            // ✨ EKLE
        businessNamesWithIds: BusinessNameId[];
        datas: AspectCompareItem[];
    } | null;

    /* Yorum / Aspect analitiği */
    lastReviews: LastReview[];
    topAspects: AspectStat[];
    newAspects: NewAspect[];

    /* Radar */
    radarCategories: string[];
    radarSeries: RadarSeries[];
    previousWeekCount: number;
    currentWeekCount: number;


    /* durum */
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: DashboardState = {
    cardCount: 0,
    readCountByCard: [],
    cardReads: [],
    readsByCard: {},
    businessByCard: {},
    aspectCompare: null,

    lastReviews: [],
    topAspects: [],
    newAspects: [],
    previousWeekCount: 0,
    currentWeekCount: 0,

    radarCategories: [],
    radarSeries: [],

    status: 'idle',
    error: null,
};

/* ──────────────────────────── SLICE ─────────────────────────────── */

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        reset: () => initialState,
    },

    /* ------------------------------------------------------------ */
    /*  thunk’ların state’e yansıtılması                             */
    /* ------------------------------------------------------------ */
    extraReducers: (builder) => {
        /* -------- fetchDashboard -------- */
        builder
            .addCase(fetchDashboard.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(
                fetchDashboard.fulfilled,
                (
                    state,
                    action: PayloadAction<ReturnType<typeof preparePayload>>,
                ) => {
                    state.status = 'succeeded';

                    /* ——— kart metrikleri ——— */
                    state.cardCount = action.payload.cardCount;
                    state.readCountByCard = action.payload.readCountByCard;

                    const allReads: CardRead[] = action.payload.cardReads.map((r) => ({
                        id: r.id,
                        readAt: r.readAt,
                        ip: r.ip,
                        ua: r.userAgent,
                        cardId: r.cardId,
                    }));

                    state.cardReads = allReads;
                    state.readsByCard = allReads.reduce<Record<number, CardRead[]>>(
                        (acc, r) => {
                            (acc[r.cardId] ||= []).push(r);
                            return acc;
                        },
                        {},
                    );

                    /* ——— yorum + aspect metrikleri ——— */
                    state.lastReviews = action.payload.lastReviews;
                    state.topAspects = action.payload.topAspects;
                    state.newAspects = action.payload.newAspects;

                    /* ——— haftalık yorum sayıları ——— */
                    state.previousWeekCount = action.payload.previousWeekCount; // ✨
                    state.currentWeekCount = action.payload.currentWeekCount;  // ✨

                    /* ——— radar grafiği sonraki çağrıda tazelenecek ——— */
                    state.radarCategories = [];
                    state.radarSeries = [];
                },
            )
            .addCase(fetchDashboard.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            });

        /* -------- fetchCardReads -------- */
        builder.addCase(fetchCardReads.fulfilled, (state, action) => {
            const { cardId, reads, business } = action.payload;

            state.readsByCard[cardId] = reads.map((r) => ({
                id: r.id,
                readAt: r.readAt,
                ip: r.ip,
                ua: r.userAgent,
                cardId,
            }));

            state.businessByCard[cardId] = {
                id: business.id,
                name: business.name,
                email: business.email,
                phone: business.phone,
                role: business.role,
                active: business.active,
                createdAt: business.created_at,
                updatedAt: business.updated_at,
                deletedAt: business.deleted_at,
            };
        });

        /* -------- fetchRadar -------- */
        builder
            .addCase(fetchRadar.fulfilled, (state, action) => {
                state.radarCategories = action.payload.categories;
                state.radarSeries = action.payload.series;
            })
            .addCase(fetchRadar.rejected, (state, action) => {
                /* radar hatası, diğer akışı bozmasın */
                if (!state.error) state.error = action.payload as string;
            });

        builder
            .addCase(fetchAspectCompare.fulfilled, (state, action) => {
                state.aspectCompare = action.payload;
            })
            .addCase(fetchAspectCompare.rejected, (state, action) => {
                if (!state.error) state.error = action.payload as string;
            });
    },

});


/* yardımcı: payload tipi üretimi */
function preparePayload() {
    return {} as {
        cardCount: number;
        readCountByCard: ReadCountItem[];
        cardReads: {
            id: number; readAt: string; ip: string; userAgent: string; cardId: number;
        }[];
        lastReviews: LastReview[];
        topAspects: AspectStat[];
        newAspects: NewAspect[];
        previousWeekCount: number;
        currentWeekCount: number;
    };
}

/* ──────────────────────────── EXPORTS ───────────────────────────── */

export const { reset } = dashboardSlice.actions;

/* selectors */
export const selectDash = (s: RootState) => s.dashboard;
export const selectLastReviews = (s: RootState) => s.dashboard.lastReviews;
export const selectTopAspects = (s: RootState) => s.dashboard.topAspects;
export const selectNewAspects = (s: RootState) => s.dashboard.newAspects;
export const selectRadarCats = (s: RootState) => s.dashboard.radarCategories;
export const selectRadarSeries = (s: RootState) => s.dashboard.radarSeries;
export const selectWeekCounts = (s: RootState) => ({
    prev: s.dashboard.previousWeekCount,
    curr: s.dashboard.currentWeekCount,
});
export const selectAspectCompare = (s: RootState) => s.dashboard.aspectCompare;   // ✨ EKLE



export default dashboardSlice.reducer;
