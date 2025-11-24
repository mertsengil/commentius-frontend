// features/index.ts
import { combineReducers } from '@reduxjs/toolkit'
import authReducer from './auth/authSlice'
import cardsReducer from './cards/cardsSlice'
import businessesReducer from './businesses/businessesSlice'
import dashboardReducer from './dashboard/dashboardSlice'
import reviewsReducer from './reviews/reviewsSlice'
import apiKeysReducer from './api-keys/apiKeysSlice'   // ⬅️ yeni
import categoriesReducer from './categories/categoriesSlice' // ⬅️ yeni
import aspectReducer from './aspect/aspectSlice'
import reportsReducer from './reports/reportsSlice' // ⬅️ yeni
import usersReducer from './users/usersSlice' // ⬅️ yeni
export default combineReducers({
    auth: authReducer,
    cards: cardsReducer,
    businesses: businessesReducer,
    dashboard: dashboardReducer,
    reviews: reviewsReducer,
    apiKeys: apiKeysReducer,        // ⬅️ yeni
    categories: categoriesReducer, // ⬅️ yeni
    aspect: aspectReducer,        // ⬅️ yeni
    reports: reportsReducer,      // ⬅️ yeni
    users: usersReducer,          // ⬅️ yeni
})
