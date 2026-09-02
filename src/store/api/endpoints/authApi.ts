import type { AuthSession, AuthTokens, AuthUser, LoginInput, RegisterInput, ResetPasswordInput } from '@/types/api';
import { apiSlice, OVERRIDE_ON_HMR } from '../apiSlice';

export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        register: builder.mutation<AuthSession, RegisterInput>({
            query: (body) => ({ url: '/auth/register', method: 'POST', body }),
            invalidatesTags: ['Auth', 'BasaList'],
        }),

        login: builder.mutation<AuthSession, LoginInput>({
            query: (body) => ({ url: '/auth/login', method: 'POST', body }),
            invalidatesTags: ['Auth', 'BasaList'],
        }),

        /** Sends an empty body; the server falls back to the `refreshToken` cookie. */
        refresh: builder.mutation<{ tokens: AuthTokens }, void>({
            query: () => ({ url: '/auth/refresh', method: 'POST', body: {} }),
        }),

        getMe: builder.query<AuthUser, void>({
            query: () => '/auth/me',
            providesTags: ['Auth'],
        }),

        logout: builder.mutation<null, void>({
            query: () => ({ url: '/auth/logout', method: 'POST' }),
        }),

        forgotPassword: builder.mutation<null, { email: string }>({
            query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
        }),

        /** Returns `204 No Content` — there is no body to unwrap. */
        resetPassword: builder.mutation<void, ResetPasswordInput>({
            query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
        }),
    }),
    overrideExisting: OVERRIDE_ON_HMR,
});

export const {
    useRegisterMutation,
    useLoginMutation,
    useRefreshMutation,
    useGetMeQuery,
    useLazyGetMeQuery,
    useLogoutMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
} = authApi;
