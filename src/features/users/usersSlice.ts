import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { usersAPI } from '@/lib/api'
import type { User } from '@/types/user'
import type { RootState } from '@/lib/store'

/* ---------- Async thunks ---------- */
export const fetchAllUsers = createAsyncThunk(
    'users/fetchAll',
    async (_, { rejectWithValue }) => {
        const res = await usersAPI.fetchAll()
        if (res.error) return rejectWithValue(res.error)
        return res.data!
    }
)

export const createUser = createAsyncThunk(
    'users/create',
    async (payload: Pick<User, 'name' | 'email' | 'password' | 'role'>, { rejectWithValue }) => {
        const res = await usersAPI.create(payload)
        if (res.error) return rejectWithValue(res.error)
        return res.data!
    }
)

export const updateUser = createAsyncThunk(
    'users/update',
    async ({ id, data }: { id: number; data: Partial<Omit<User, 'id'>> }, { rejectWithValue }) => {
        const res = await usersAPI.update(id, data)
        if (res.error) return rejectWithValue(res.error)
        return res.data!
    }
)

export const deleteUser = createAsyncThunk(
    'users/delete',
    async (id: number, { rejectWithValue }) => {
        const res = await usersAPI.remove(id)
        if (res.error) return rejectWithValue(res.error)
        return id
    }
)

/* ---------- State ---------- */
interface UsersState {
    list: User[]
    status: 'idle' | 'loading' | 'succeeded' | 'failed'
    error: string | null
}
const initialState: UsersState = {
    list: [],
    status: 'idle',
    error: null,
}

/* ---------- Slice ---------- */
const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        /* fetchAll */
        builder.addCase(fetchAllUsers.pending, (s) => { s.status = 'loading' })
        builder.addCase(fetchAllUsers.fulfilled, (s, a: PayloadAction<User[]>) => {
            s.status = 'succeeded'
            s.list = a.payload
        })
        builder.addCase(fetchAllUsers.rejected, (s, a) => {
            s.status = 'failed'
            s.error = a.payload as string
        })

        /* create */
        builder.addCase(createUser.fulfilled, (s, a) => {
            s.list.unshift(a.payload)
        })

        /* update */
        builder.addCase(updateUser.fulfilled, (s, a) => {
            const idx = s.list.findIndex(u => u.id === a.payload.id)
            if (idx !== -1) s.list[idx] = a.payload
        })

        /* delete */
        builder.addCase(deleteUser.fulfilled, (s, a: PayloadAction<number>) => {
            s.list = s.list.filter(u => u.id !== a.payload)
        })
    },
})

/* ---------- Selectors ---------- */
export const selectAllUsers = (state: RootState) => state.users.list
export const selectUsersStatus = (state: RootState) => state.users.status

export default usersSlice.reducer
