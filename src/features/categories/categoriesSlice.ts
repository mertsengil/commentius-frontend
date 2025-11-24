/* ------------------------------------------------------------------ */
/*  src/features/categories/categoriesSlice.ts                        */
/* ------------------------------------------------------------------ */
import {
    createSlice,
    createAsyncThunk,
    type PayloadAction,
} from '@reduxjs/toolkit';
import { categoriesAPI } from '@/lib/api';
import type {
    CategorySummary,
    CategoryDetailResponse,
} from '@/types/category';
import type { RootState } from '@/lib/store';

/* ------------------------------------------------------------------ */
/*  Yardımcı — aspectGroup ➜ word-cloud dizisi                        */
/* ------------------------------------------------------------------ */
const toWords = (group?: Record<string, number> | null) =>
    group
        ? Object.entries(group).map(([text, value]) => ({ text, value }))
        : [];

/* ------------------------------------------------------------------ */
/*  Thunks                                                            */
/* ------------------------------------------------------------------ */

/** GET /reviews/category → CategorySummary[] */
export const fetchCategories = createAsyncThunk<CategorySummary[]>(
    'categories/fetchAll',
    categoriesAPI.fetchAll,
);

/** GET /reviews/category/:category → CategoryDetailResponse */
export const fetchCategoryDetail = createAsyncThunk<
    CategoryDetailResponse,
    string
>('categories/fetchDetail', categoriesAPI.fetchDetail);

/* ------------------------------------------------------------------ */
/*  State tipi                                                        */
/* ------------------------------------------------------------------ */
type Word = { text: string; value: number };

interface CategoriesState {
    /* Liste (overview) */
    list: CategorySummary[];
    loadingList: boolean;
    listError: string | null;

    /* Detay */
    detail: (CategoryDetailResponse & { words: Word[] }) | null;
    loadingDetail: boolean;
    detailError: string | null;
}

const initialState: CategoriesState = {
    list: [],
    loadingList: false,
    listError: null,

    detail: null,
    loadingDetail: false,
    detailError: null,
};

/* ------------------------------------------------------------------ */
/*  Slice                                                             */
/* ------------------------------------------------------------------ */
const slice = createSlice({
    name: 'categories',
    initialState,
    reducers: {
        /** Detay ekranından çıkarken temizle */
        clearDetail(state) {
            state.detail = null;
            state.detailError = null;
            state.loadingDetail = false;
        },
    },
    extraReducers: builder => {
        /* -------- Liste -------- */
        builder
            .addCase(fetchCategories.pending, s => {
                s.loadingList = true;
                s.listError = null;
            })
            .addCase(
                fetchCategories.fulfilled,
                (s, a: PayloadAction<CategorySummary[]>) => {
                    s.loadingList = false;
                    s.list = a.payload;
                    if (a.payload.length === 0) s.listError = 'Kategori verisi alınamadı';
                },
            )
            .addCase(fetchCategories.rejected, (s, a) => {
                s.loadingList = false;
                s.listError = a.error.message ?? 'Bir hata oluştu';
            });

        /* -------- Detay -------- */
        builder
            .addCase(fetchCategoryDetail.pending, s => {
                s.loadingDetail = true;
                s.detailError = null;
                s.detail = null; // eski detayı sil
            })
            .addCase(
                fetchCategoryDetail.fulfilled,
                (s, a: PayloadAction<CategoryDetailResponse>) => {
                    s.loadingDetail = false;
                    s.detail = {
                        ...a.payload,
                        words: toWords(a.payload.aspectGroup), // word-cloud verisi
                    };
                },
            )
            .addCase(fetchCategoryDetail.rejected, (s, a) => {
                s.loadingDetail = false;
                s.detailError = a.error.message ?? 'Bir hata oluştu';
            });
    },
});

export const { clearDetail } = slice.actions;
export default slice.reducer;

/* ------------------------------------------------------------------ */
/*  Selector                                                          */
/* ------------------------------------------------------------------ */
export const selectCategoriesState = (state: RootState) => state.categories;
