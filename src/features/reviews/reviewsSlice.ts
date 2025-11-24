/* ------------------------------------------------------------------ */
/*  src/features/reviews/reviewsSlice.ts                               */
/* ------------------------------------------------------------------ */
import {
    createSlice,
    createAsyncThunk,
    PayloadAction,
} from '@reduxjs/toolkit'
import {
    reviewsAPI,      // ← PUT için updateReply kullanacağız
    aiRepliesAPI,
} from '@/lib/api'
import type { RootState, AppDispatch } from '@/lib/store'
import { updateTokens } from '@/features/auth/authSlice'

/* ---------- Tipler ---------- */
export interface Reply {
    id: number
    content: string
    createdAt: string
}

export interface Aspect {
    id: number
    aspect: string
    category: string
    sentiment: 'positive' | 'negative' | 'neutral'
}

export interface Review {
    id: number
    businessId: number
    name: string
    text: string | null
    stars: number | null
    publishedAtDate: string
    reviewerPhotoUrl?: string
    reviewImageUrls?: string[]
    replies?: Reply[]
    aspects?: Aspect[]
}

export interface PaginatedReviewResponse {
    items: Review[]
    total: number
    page: number
    limit: number
    totalPages: number
}

/* ---------- Thunks ---------- */
/* Liste */
export const fetchReviews = createAsyncThunk<
    PaginatedReviewResponse,
    { page?: number; limit?: number }
>('reviews/fetch', async ({ page = 1, limit = 10 }) => {
    const { data } = await reviewsAPI.fetchPaged({ page, limit })
    if (!data) throw new Error('Sunucudan veri gelmedi')
    return data
})

/* AI yanıt üretme */
export const requestAiReply = createAsyncThunk<
    { reviewId: number; reply: Reply },
    number,
    { dispatch: AppDispatch }
>('reviews/requestAiReply', async (reviewId, { dispatch }) => {
    const { data } = await aiRepliesAPI.generate(reviewId)
    if (!data) throw new Error('Yanıt üretilemedi')

    /* kredi güncelle */
    dispatch(updateTokens(data.review.business.user.reviewReplyTokens))

    return {
        reviewId: data.review.id,
        reply: {
            id: data.id,
            content: data.content,
            createdAt: data.createdAt ?? new Date().toISOString(),
        },
    }
})

/* AI yanıtı güncelle (PUT) */
export const updateAiReply = createAsyncThunk<
    { replyId: number; reviewId: number; content: string },           // ✅
    { replyId: number; reviewId: number; content: string }            // ✅
>('reviews/updateAiReply',                               // { id, reviewId, content } varsayıyordu
    async ({ replyId, reviewId, content }) => {
        /* Sunucunun body döndürmesine gerek yok — optimistik güncelleme */
        await reviewsAPI.updateReply(replyId, content)
        return { replyId, reviewId, content }      // kendimiz geri yolluyoruz
    }
)

/* ---------- Slice ---------- */
interface ReviewsState {
    items: Review[]
    total: number
    page: number
    limit: number
    totalPages: number
    loading: boolean
    error: string | null
    generating: number[]   // reviewId listesi
    updating: number[]     // replyId listesi
}

const initialState: ReviewsState = {
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    loading: false,
    error: null,
    generating: [],
    updating: [],
}

const slice = createSlice({
    name: 'reviews',
    initialState,
    reducers: {
        setPage(s, a: PayloadAction<number>) {
            s.page = a.payload
        },
        setLimit(s, a: PayloadAction<number>) {
            s.limit = a.payload
            s.page = 1
        },
        clear() {
            return initialState
        },
    },
    extraReducers: builder => {
        /* -------- Liste -------- */
        builder
            .addCase(fetchReviews.pending, s => {
                s.loading = true
                s.error = null
            })
            .addCase(fetchReviews.fulfilled, (s, a) => {
                Object.assign(s, {
                    loading: false,
                    items: a.payload.items,
                    total: a.payload.total,
                    page: a.payload.page,
                    limit: a.payload.limit,
                    totalPages: a.payload.totalPages,
                })
            })
            .addCase(fetchReviews.rejected, (s, a) => {
                s.loading = false
                s.error = a.error.message ?? 'Bir hata oluştu'
            })

        /* -------- AI Yanıt Üret -------- */
        builder
            .addCase(requestAiReply.pending, (s, { meta }) => {
                if (!s.generating.includes(meta.arg)) s.generating.push(meta.arg)
            })
            .addCase(requestAiReply.fulfilled, (s, { payload }) => {
                s.generating = s.generating.filter(id => id !== payload.reviewId)
                const rv = s.items.find(r => r.id === payload.reviewId)
                if (rv) {
                    if (rv.replies?.length) rv.replies[0] = payload.reply
                    else rv.replies = [payload.reply]
                }
            })
            .addCase(requestAiReply.rejected, (s, { meta }) => {
                s.generating = s.generating.filter(id => id !== meta.arg)
            })

        /* -------- AI Yanıt Güncelle -------- */
        builder
            .addCase(updateAiReply.pending, (s, { meta }) => {
                if (!s.updating.includes(meta.arg.replyId)) s.updating.push(meta.arg.replyId)
            })
            .addCase(updateAiReply.fulfilled, (s, { payload }) => {
                s.updating = s.updating.filter(id => id !== payload.replyId)
                const rv = s.items.find(r => r.id === payload.reviewId)
                if (rv && rv.replies?.length) {
                    const idx = rv.replies.findIndex(rp => rp.id === payload.replyId)
                    if (idx !== -1) rv.replies[idx].content = payload.content
                }
            })
            .addCase(updateAiReply.rejected, (s, { meta }) => {
                s.updating = s.updating.filter(id => id !== meta.arg.replyId)
            })
    },
})

export const { setPage, setLimit, clear } = slice.actions
export default slice.reducer
export const selectReviewsState = (state: RootState) => state.reviews
