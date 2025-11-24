// features/cards/cardsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { cardsAPI } from '@/lib/api'
import { type Card } from '@/types/card'
import type { RootState } from '@/lib/store'

/* ─────────── Yardımcı: snake_case → camelCase ─────────── */
// features/cards/cardsSlice.ts

const mapCard = (c: any): Card => ({
    id: c.id,
    name: c.name,
    type: c.type ?? 'card', // eğer type yoksa varsayılan olarak 'card' atıyoruz
    redirectUrl: c.redirect_url,
    qrCode: c.qr_code,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    deletedAt: c.deleted_at ?? null,
    isActive: c.deleted_at === null,

    // Eğer business objesi yoksa boş değer atıyoruz:
    businessId: c.business?.id ?? 0,
    business: {
        id: c.business?.id ?? 0,
        name: c.business?.name ?? '',   // eğer varsa gelendir
        type: c.business?.type ?? 'card', // varsayılan olarak 'card'
        name: c.business?.name ?? '',
        email: c.business?.email ?? '',
        phone: c.business?.phone ?? '',
        role: c.business?.role ?? '',
        active: c.business?.active ?? true,
        created_at: c.business?.created_at ?? '',
        updated_at: c.business?.updated_at ?? '',
        deleted_at: c.business?.deleted_at ?? null,
    },
})

/* ─────────── State tipi ─────────── */
interface CardsState {
    items: Card[]
    status: 'idle' | 'loading' | 'succeeded' | 'failed'
    error: string | null
}

const initialState: CardsState = {
    items: [],
    status: 'idle',
    error: null,
}

/* ─────────── Thunk’lar ─────────── */
export const fetchAllCards = createAsyncThunk<Card[]>(
    'cards/fetchAll',
    async (_, { rejectWithValue }) => {
        const resp = await cardsAPI.fetchAll()
        if (resp.error) return rejectWithValue(resp.error)
        console.log('🚀 fetchAllCards resp.data:', resp.data)
        return resp.data!.map(mapCard)

    },
)

export const fetchCardById = createAsyncThunk<Card, number>(
    'cards/fetchById',
    async (id, { rejectWithValue }) => {
        const resp = await cardsAPI.fetchById(id)
        if (resp.error) return rejectWithValue(resp.error)
        return mapCard(resp.data!)
    },
)

/* ✅ YENİ thunk: /cards/business/:id */
export const fetchCardByIdForBusiness = createAsyncThunk<Card, number>(
    'cards/fetchByIdForBusiness',
    async (id, { rejectWithValue }) => {
        const resp = await cardsAPI.fetchByIdForBusiness(id)
        if (resp.error) return rejectWithValue(resp.error)
        return mapCard(resp.data!.card)
    },
)

export const fetchCardsByBusiness = createAsyncThunk<Card[], number>(
    'cards/fetchByBusiness',
    async (businessId, { rejectWithValue }) => {
        const resp = await cardsAPI.fetchByBusiness(businessId)
        if (resp.error) return rejectWithValue(resp.error)
        return resp.data!.map(mapCard)
    },
)

export const createCard = createAsyncThunk<Card, { redirect_url: string; businessId: number }>(
    'cards/create',
    async (payload, { rejectWithValue }) => {
        const resp = await cardsAPI.create(payload)
        if (resp.error) return rejectWithValue(resp.error)
        return mapCard(resp.data!)
    },
)

export const updateCard = createAsyncThunk<Card, { id: number; redirect_url: string }>(
    'cards/update',
    async ({ id, redirect_url }, { rejectWithValue }) => {
        const resp = await cardsAPI.update(id, { redirect_url })
        if (resp.error) return rejectWithValue(resp.error)
        return mapCard(resp.data!)
    },
)

export const deleteCard = createAsyncThunk<number, number>(
    'cards/delete',
    async (id, { rejectWithValue }) => {
        const resp = await cardsAPI.remove(id)
        if (resp.error) return rejectWithValue(resp.error)
        return id
    },
)

/* ─────────── Slice ─────────── */
const cardsSlice = createSlice({
    name: 'cards',
    initialState,
    reducers: {
        clearCards(state) {
            state.items = []
            state.status = 'idle'
            state.error = null
        },
    },
    extraReducers: builder =>
        builder
            /* fetchAllCards */
            .addCase(fetchAllCards.pending, s => {
                s.status = 'loading'
                s.error = null
                s.items = []           // ← eski kartları temizle
            })
            .addCase(fetchAllCards.fulfilled, (s, a: PayloadAction<Card[]>) => {
                s.status = 'succeeded'
                s.items = a.payload
            })
            .addCase(fetchAllCards.rejected, (s, a) => {
                s.status = 'failed'
                s.error = a.payload as string
            })

            /* fetchCardById */
            .addCase(fetchCardById.fulfilled, (s, a: PayloadAction<Card>) => {
                const idx = s.items.findIndex(c => c.id === a.payload.id)
                if (idx >= 0) s.items[idx] = a.payload
                else s.items.push(a.payload)
            })

            /* fetchCardByIdForBusiness */
            .addCase(fetchCardByIdForBusiness.pending, s => {
                s.status = 'loading'
                s.error = null
            })
            .addCase(fetchCardByIdForBusiness.fulfilled, (s, a: PayloadAction<Card>) => {
                s.status = 'succeeded'
                const idx = s.items.findIndex(c => c.id === a.payload.id)
                if (idx >= 0) s.items[idx] = a.payload
                else s.items.push(a.payload)
            })
            .addCase(fetchCardByIdForBusiness.rejected, (s, a) => {
                s.status = 'failed'
                s.error = a.payload as string
            })

            /* fetchCardsByBusiness */
            .addCase(fetchCardsByBusiness.pending, s => {
                s.status = 'loading'
                s.error = null
                s.items = []           // ← eski kartları temizle
            })
            .addCase(fetchCardsByBusiness.fulfilled, (s, a: PayloadAction<Card[]>) => {
                s.status = 'succeeded'
                s.items = a.payload
            })
            .addCase(fetchCardsByBusiness.rejected, (s, a) => {
                s.status = 'failed'
                s.error = a.payload as string
            })

            /* createCard */
            .addCase(createCard.fulfilled, (s, a: PayloadAction<Card>) => {
                s.items.push(a.payload)
            })

            /* updateCard */
            .addCase(updateCard.fulfilled, (s, a: PayloadAction<Card>) => {
                const idx = s.items.findIndex(c => c.id === a.payload.id)
                if (idx >= 0) s.items[idx] = a.payload
            })

            /* deleteCard */
            .addCase(deleteCard.fulfilled, (s, a: PayloadAction<number>) => {
                s.items = s.items.filter(c => c.id !== a.payload)
            }),
})

export const { clearCards } = cardsSlice.actions

/* ─────────── Selectors ─────────── */
export const selectAllCards = (s: RootState) => s.cards.items
export const selectCardsStatus = (s: RootState) => s.cards.status
export const selectCardsError = (s: RootState) => s.cards.error
export const selectCardById = (id: number) => (s: RootState): Card | undefined =>
    s.cards.items.find(c => c.id === id)

export default cardsSlice.reducer
