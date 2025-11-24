/* ------------------------------------------------------------------ */
/*  src/features/auth/authSlice.ts                                     */
/* ------------------------------------------------------------------ */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { saveToken, removeToken, USER_KEY } from '@/lib/auth';
import type { RootState } from '@/lib/store';
import { User } from '@/types/user';

interface AuthState {
    user: User | null;
    token: string | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    token: null,
    status: 'idle',
    error: null,
};

/* -------------------- Thunk: login -------------------- */
export const loginUser = createAsyncThunk<
    { user: User; token: string },
    { email: string; password: string },
    { rejectValue: string }
>('auth/login', async ({ email, password }, { rejectWithValue }) => {
    const resp = await api.post<
        { access_token: string; user: User },
        { email: string; password: string }
    >('/auth/login', { email, password });

    if (resp.error) return rejectWithValue(resp.error);
    return { user: resp.data!.user, token: resp.data!.access_token };
});

/* -------------------- Slice -------------------- */
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout(state) {
            removeToken();
            state.user = null;
            state.token = null;
            state.status = 'idle';
            state.error = null;
        },
        /** ⬇️  YENİ: krediyi / token’ı güncelle */
        updateTokens(state, action: PayloadAction<number>) {
            if (state.user) {
                state.user.reviewReplyTokens = action.payload;
                /* localStorage'daki kopyayı da güncelle */
                if (typeof window !== 'undefined') {
                    localStorage.setItem(USER_KEY, JSON.stringify(state.user));
                }
            }
        },
    },
    extraReducers: builder => {
        builder
            .addCase(loginUser.pending, state => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.user = action.payload.user;
                state.token = action.payload.token;
                saveToken(action.payload.token, action.payload.user);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error =
                    action.payload ?? action.error.message ?? 'Giriş başarısız';
            });
    },
});

export const { logout, updateTokens } = authSlice.actions;

/* -------------------- Selectors -------------------- */
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;

export default authSlice.reducer;
