import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiKeysAPI } from '@/lib/api'
import type { ApiKey } from '@/types/api-key'
import type { RootState } from '@/lib/store'  // store.ts’i nereye koyduysan

/* ---------- Thunk’lar ---------- */
export const fetchApiKeys = createAsyncThunk(
    'apiKeys/fetchAll',
    async (_, thunkAPI) => {
        const res = await apiKeysAPI.fetchAll()
        if (res.error) return thunkAPI.rejectWithValue(res.error)
        return res.data as ApiKey[]
    },
)

export const createApiKey = createAsyncThunk(
    'apiKeys/create',
    async (token: string, thunkAPI) => {
        const res = await apiKeysAPI.create(token)
        if (res.error) return thunkAPI.rejectWithValue(res.error)
        return res.data as ApiKey
    },
)

export const updateApiKey = createAsyncThunk(
    'apiKeys/update',
    async (payload: { id: number; token: string }, thunkAPI) => {
        const res = await apiKeysAPI.update(payload.id, payload.token)
        if (res.error) return thunkAPI.rejectWithValue(res.error)
        return res.data as ApiKey
    },
)

export const deleteApiKey = createAsyncThunk(
    'apiKeys/delete',
    async (id: number, thunkAPI) => {
        const res = await apiKeysAPI.remove(id)
        if (res.error) return thunkAPI.rejectWithValue(res.error)
        return id
    },
)

/* ---------- Slice ---------- */
interface ApiKeysState {
    items: ApiKey[]
    loading: boolean
    error: string | null
}
const initialState: ApiKeysState = { items: [], loading: false, error: null }

const apiKeysSlice = createSlice({
    name: 'apiKeys',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            /* --- fetchAll --- */
            .addCase(fetchApiKeys.pending, (s) => {
                s.loading = true
                s.error = null
            })
            .addCase(fetchApiKeys.fulfilled, (s, a) => {
                s.loading = false
                s.items = a.payload
            })
            .addCase(fetchApiKeys.rejected, (s, a) => {
                s.loading = false
                s.error = a.payload as string
            })
            /* --- create --- */
            .addCase(createApiKey.fulfilled, (s, a) => {
                s.items.push(a.payload)
            })
            /* --- update --- */
            .addCase(updateApiKey.fulfilled, (s, a) => {
                const i = s.items.findIndex((k) => k.id === a.payload.id)
                if (i !== -1) s.items[i] = a.payload
            })
            /* --- delete --- */
            .addCase(deleteApiKey.fulfilled, (s, a) => {
                s.items = s.items.filter((k) => k.id !== a.payload)
            })
    },
})

/* ---------- Selectors ---------- */
export const selectApiKeys = (st: RootState) => st.apiKeys.items
export const selectApiKeysLoad = (st: RootState) => st.apiKeys.loading
export const selectApiKeysError = (st: RootState) => st.apiKeys.error

export default apiKeysSlice.reducer
