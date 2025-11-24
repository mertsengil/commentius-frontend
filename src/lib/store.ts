
import { configureStore } from '@reduxjs/toolkit'
import rootReducer from '../features'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['auth', 'cards', 'businesses'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
})

export const persistor = persistStore(store)

// RootState’in doğru gelmesi için:
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
