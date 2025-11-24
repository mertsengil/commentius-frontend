// src/features/reports/reportsSlice.ts
import {
    createSlice,
    createAsyncThunk,
    type PayloadAction,
} from '@reduxjs/toolkit';
import { reportsAPI } from '@/lib/api';
import type {
    ReportSummary,
    ReportDetail,
} from '@/types/reports';
import type { RootState } from '@/lib/store';

/* ------------------------------------------------------------------ */
/*  Thunks                                                            */
/* ------------------------------------------------------------------ */

/** GET /reports → ReportSummary[] */
export const fetchReports = createAsyncThunk<ReportSummary[]>(
    'reports/fetchAll',
    reportsAPI.fetchAll,
);

/** GET /reports/:id → ReportDetail */
export const fetchReportDetail = createAsyncThunk<
    ReportDetail,
    number | string
>(
    'reports/fetchDetail',
    async (id) => reportsAPI.fetchById(id)
);

/* ------------------------------------------------------------------ */
/*  State tipi                                                        */
/* ------------------------------------------------------------------ */
interface ReportsState {
    /* Liste (overview) */
    list: ReportSummary[];
    loadingList: boolean;
    listError: string | null;

    /* Detay */
    detail: ReportDetail | null;
    loadingDetail: boolean;
    detailError: string | null;
}

const initialState: ReportsState = {
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
    name: 'reports',
    initialState,
    reducers: {
        /** Detay sayfasından çıkarken temizle */
        clearDetail(state) {
            state.detail = null;
            state.detailError = null;
            state.loadingDetail = false;
        },
    },
    extraReducers: builder => {
        /* -------- Liste -------- */
        builder
            .addCase(fetchReports.pending, s => {
                s.loadingList = true;
                s.listError = null;
            })
            .addCase(
                fetchReports.fulfilled,
                (s, a: PayloadAction<ReportSummary[]>) => {
                    s.loadingList = false;
                    s.list = a.payload;
                    if (a.payload.length === 0) {
                        s.listError = 'Rapor verisi bulunamadı';
                    }
                }
            )
            .addCase(fetchReports.rejected, (s, a) => {
                s.loadingList = false;
                s.listError = a.error.message ?? 'Rapor listesi yüklenemedi';
            });

        /* -------- Detay -------- */
        builder
            .addCase(fetchReportDetail.pending, s => {
                s.loadingDetail = true;
                s.detailError = null;
                s.detail = null;
            })
            .addCase(
                fetchReportDetail.fulfilled,
                (s, a: PayloadAction<ReportDetail>) => {
                    s.loadingDetail = false;
                    s.detail = a.payload;
                }
            )
            .addCase(fetchReportDetail.rejected, (s, a) => {
                s.loadingDetail = false;
                s.detailError = a.error.message ?? 'Rapor yüklenemedi';
            });
    },
});

export const { clearDetail } = slice.actions;
export default slice.reducer;

/* ------------------------------------------------------------------ */
/*  Selector                                                          */
/* ------------------------------------------------------------------ */
export const selectReportsState = (state: RootState) => state.reports;
