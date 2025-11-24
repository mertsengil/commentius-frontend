// features/businesses/businessesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { businessAPI } from "../../lib/api";
import { Business } from "../../types/business";
import type { RootState } from "../../lib/store";

/* ------------------------------------------------------------------ */
/*  STATE                                                             */
/* ------------------------------------------------------------------ */
interface BusinessesState {
  items: Business[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: BusinessesState = {
  items: [],
  status: "idle",
  error: null,
};

/* ------------------------------------------------------------------ */
/*  PAYLOAD TÜRLERİ                                                   */
/* ------------------------------------------------------------------ */
export type CreateBusinessPayload = {
  name: string;
  email: string;
  password: string;
  googleMapsUrl?: string | null;
  reviewReplyTokens?: number | null;
  reviewReplyPrompt?: string | null;
};

export const enqueueReviews = createAsyncThunk<
  void,
  { businessId: number; mode: "incremental" | "full" }
>(
  "businesses/enqueueReviews",
  async ({ businessId, mode }, { rejectWithValue }) => {
    const resp = await businessAPI.enqueue(businessId, mode);
    if (resp.error) return rejectWithValue(resp.error);
  },
);
export type UpdateBusinessPayload = {
  id: number;
  data: Partial<Omit<Business, "id">>;
};

/* ------------------------------------------------------------------ */
/*  THUNK’LAR                                                         */
/* ------------------------------------------------------------------ */
export const fetchAllBusinesses = createAsyncThunk<Business[]>(
  "businesses/fetchAll",
  async (_, { rejectWithValue }) => {
    const resp = await businessAPI.fetchAll();
    return resp.error ? rejectWithValue(resp.error) : resp.data!;
  },
);

export const bulkUpdateBusinesses = createAsyncThunk<
  Business[], // dönen veri
  { ids: number[]; data: Partial<Omit<Business, "id">> }
>("businesses/bulkUpdate", async ({ ids, data }, { rejectWithValue }) => {
  const resp = await businessAPI.bulkUpdate({ ids, dto: data });
  return resp.error ? rejectWithValue(resp.error) : resp.data!;
});

export const fetchBusinessById = createAsyncThunk<Business, number>(
  "businesses/fetchById",
  async (id, { rejectWithValue }) => {
    const resp = await businessAPI.fetchById(id);
    return resp.error ? rejectWithValue(resp.error) : resp.data!;
  },
);

export const createBusiness = createAsyncThunk<Business, CreateBusinessPayload>(
  "businesses/create",
  async (payload, { rejectWithValue }) => {
    const resp = await businessAPI.create(payload);
    return resp.error ? rejectWithValue(resp.error) : resp.data!;
  },
);

export const updateBusiness = createAsyncThunk<Business, UpdateBusinessPayload>(
  "businesses/update",
  async ({ id, data }, { rejectWithValue }) => {
    const resp = await businessAPI.update(id, data);
    return resp.error ? rejectWithValue(resp.error) : resp.data!;
  },
);

export const deleteBusiness = createAsyncThunk<number, number>(
  "businesses/delete",
  async (id, { rejectWithValue }) => {
    const resp = await businessAPI.remove(id);
    return resp.error ? rejectWithValue(resp.error) : id;
  },
);

/* ------------------------------------------------------------------ */
/*  SLICE                                                             */
/* ------------------------------------------------------------------ */
const businessesSlice = createSlice({
  name: "businesses",
  initialState,
  reducers: {
    clearBusinesses(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    /* ---------- fetchAll ---------- */
    builder
      .addCase(fetchAllBusinesses.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        fetchAllBusinesses.fulfilled,
        (state, action: PayloadAction<Business[]>) => {
          state.status = "succeeded";
          state.items = action.payload;
        },
      )
      .addCase(fetchAllBusinesses.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
    builder
      .addCase(enqueueReviews.pending, (state) => {
        state.status = "loading";
      })
      .addCase(enqueueReviews.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(enqueueReviews.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });

    /* ---------- fetchById ---------- */
    builder.addCase(fetchBusinessById.fulfilled, (state, action) => {
      const idx = state.items.findIndex((b) => b.id === action.payload.id);
      if (idx >= 0) state.items[idx] = action.payload;
      else state.items.push(action.payload);
    });

    /* ---------- create ---------- */
    builder.addCase(createBusiness.fulfilled, (state, action) => {
      state.items.push(action.payload);
    });

    /* ---------- update ---------- */
    builder.addCase(updateBusiness.fulfilled, (state, action) => {
      const idx = state.items.findIndex((b) => b.id === action.payload.id);
      if (idx >= 0) state.items[idx] = action.payload;
    });

    /* ---------- delete ---------- */
    builder.addCase(deleteBusiness.fulfilled, (state, action) => {
      state.items = state.items.filter((b) => b.id !== action.payload);
    });

    builder.addCase(bulkUpdateBusinesses.fulfilled, (state, action) => {
      action.payload.forEach((updated) => {
        const i = state.items.findIndex((b) => b.id === updated.id);
        if (i >= 0) state.items[i] = updated;
      });
    });
  },
});

/* ------------------------------------------------------------------ */
/*  EXPORTS                                                           */
/* ------------------------------------------------------------------ */
export const { clearBusinesses } = businessesSlice.actions;

/* ---- Selectors ---- */
export const selectAllBusinesses = (state: RootState) => state.businesses.items;
export const selectBusinessesStatus = (state: RootState) =>
  state.businesses.status;
export const selectBusinessesError = (state: RootState) =>
  state.businesses.error;
export const selectBusinessById =
  (id: number) =>
  (state: RootState): Business | undefined =>
    state.businesses.items.find((b) => b.id === id);

export const selectEnqueueStatus = (state: RootState) =>
  state.businesses.status;
export const selectEnqueueError = (state: RootState) => state.businesses.error;

export default businessesSlice.reducer;
