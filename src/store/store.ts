
import { configureStore } from '@reduxjs/toolkit';
import { woocommerceApi } from './api';
import authReducer from './authSlice';

const store = configureStore({
  reducer: {
    [woocommerceApi.reducerPath]: woocommerceApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(woocommerceApi.middleware),
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

export { store, type RootState, type AppDispatch };
