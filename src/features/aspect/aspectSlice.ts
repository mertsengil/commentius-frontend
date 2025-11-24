// src/features/aspect/aspectSlice.ts

import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { aspectAPI } from '@/lib/api';
import type {
  AspectStat,
  AspectSummary,
  AspectListResponse,
  AspectDetailResponse,       // <- detail tipi buradan geliyor
} from '@/types/aspect';
import type { RootState } from '@/lib/store';

/* ------------------------------------------------------------------ */
/*  Thunks                                                            */
/* ------------------------------------------------------------------ */

/** GET /reviews/aspect  →  kelime bulutu + özet */
export const fetchAspectList = createAsyncThunk<
  AspectListResponse,
  void,
  { rejectValue: string }
>('aspect/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await aspectAPI.fetchAll();
  } catch (err: any) {
    return rejectWithValue(err.message ?? 'Sunucu hatası');
  }
});

/** GET /reviews/aspect/:id  →  detay */
export const fetchAspectDetail = createAsyncThunk<
  AspectDetailResponse,
  number | string,
  { rejectValue: string }
>('aspect/fetchDetail', async (id, { rejectWithValue }) => {
  try {
    const data = await aspectAPI.fetchDetail(id);
    if (!data) throw new Error('Detay verisi gelmedi');
    return data;
  } catch (err: any) {
    return rejectWithValue(err.message ?? 'Sunucu hatası');
  }
});

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */
interface AspectState {
  /* Liste sayfası */
  list: AspectStat[];
  summary: AspectSummary | null;
  loading: boolean;
  error: string | null;

  /* Detay sayfası */
  detail: AspectDetailResponse | null;
  loadingDetail: boolean;
  detailError: string | null;
}

const initialState: AspectState = {
  list: [],
  summary: null,
  loading: false,
  error: null,

  detail: null,
  loadingDetail: false,
  detailError: null,
};

/* ------------------------------------------------------------------ */
/*  Slice                                                             */
/* ------------------------------------------------------------------ */
const slice = createSlice({
  name: 'aspect',
  initialState,
  reducers: {
    clear(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: builder => {
    /* ---------------- Liste ---------------- */
    builder
      .addCase(fetchAspectList.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAspectList.fulfilled,
        (state, action: PayloadAction<AspectListResponse>) => {
          state.loading = false;
          state.list = action.payload.aspectGroup;
          state.summary = action.payload.summary;
        },
      )
      .addCase(fetchAspectList.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ?? action.error.message ?? 'Bir hata oluştu';
      });

    /* ---------------- Detay ---------------- */
    builder
      .addCase(fetchAspectDetail.pending, state => {
        state.loadingDetail = true;
        state.detailError = null;
      })
      .addCase(
        fetchAspectDetail.fulfilled,
        (state, action: PayloadAction<AspectDetailResponse>) => {
          state.loadingDetail = false;
          state.detail = action.payload;
        },
      )
      .addCase(fetchAspectDetail.rejected, (state, action) => {
        state.loadingDetail = false;
        state.detailError =
          (action.payload as string) ?? action.error.message ?? 'Bir hata oluştu';
      });
  },
});

export const { clear } = slice.actions;
export default slice.reducer;

/* ------------------------------------------------------------------ */
/*  Selector                                                          */
/* ------------------------------------------------------------------ */
export const selectAspectState = (state: RootState) => state.aspect;
