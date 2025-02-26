
import { configureStore } from '@reduxjs/toolkit';
import { woocommerceApi } from './api';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    [woocommerceApi.reducerPath]: woocommerceApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(woocommerceApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
