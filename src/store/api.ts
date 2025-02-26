
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { LoginCredentials, AuthResponse } from '@/types/auth';

const baseUrl = process.env.NEXT_PUBLIC_WC_API_BASE_URL || 'https://site.cataloghub.in/wp-json';

export const woocommerceApi = createApi({
  reducerPath: 'woocommerceApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  endpoints: (builder) => ({
    signIn: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/jwt-auth/v1/token',
        method: 'POST',
        body: credentials,
      }),
    }),
    getCurrentUser: builder.query<any, void>({
      query: () => '/wp/v2/users/me?context=edit',
    }),
  }),
});

export const { useSignInMutation, useGetCurrentUserQuery } = woocommerceApi;
