import { apiSlice, OVERRIDE_ON_HMR } from "../apiSlice";
import type {
  BasaId,
  CreateJoinRequestInput,
  JoinRequest,
  JoinRequestStatus,
} from "@/types/api";

export const joinRequestApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** Submit a join request using a basa's join code. Not basa-scoped. */
    createJoinRequest: builder.mutation<JoinRequest, CreateJoinRequestInput>({
      query: (body) => ({ url: "/basas/join", method: "POST", body }),
      invalidatesTags: ["JoinRequest"],
    }),

    /** List the caller's own join requests, newest first. */
    listMyJoinRequests: builder.query<JoinRequest[], void>({
      query: () => "/join-requests/me",
      providesTags: ["JoinRequest"],
    }),

    /** List join requests for a basa (OWNER/MANAGER). */
    listBasaJoinRequests: builder.query<JoinRequest[], { basaId: BasaId; status?: JoinRequestStatus }>({
      query: ({ basaId, status }) => {
        const params = status ? `?status=${status}` : "";
        return `/basas/${basaId}/join-requests${params}`;
      },
      providesTags: (_r, _e, { basaId }) => [{ type: "JoinRequest", id: basaId }],
    }),

    acceptJoinRequest: builder.mutation<JoinRequest, { basaId: BasaId; requestId: string }>({
      query: ({ basaId, requestId }) => ({
        url: `/basas/${basaId}/join-requests/${requestId}/accept`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { basaId }) => [
        { type: "JoinRequest", id: basaId },
        { type: "Member", id: basaId },
        { type: "Basa", id: basaId },
        "BasaList",
      ],
    }),

    rejectJoinRequest: builder.mutation<JoinRequest, { basaId: BasaId; requestId: string }>({
      query: ({ basaId, requestId }) => ({
        url: `/basas/${basaId}/join-requests/${requestId}/reject`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { basaId }) => [{ type: "JoinRequest", id: basaId }],
    }),
  }),
  overrideExisting: OVERRIDE_ON_HMR,
});

export const {
  useCreateJoinRequestMutation,
  useListMyJoinRequestsQuery,
  useListBasaJoinRequestsQuery,
  useAcceptJoinRequestMutation,
  useRejectJoinRequestMutation,
} = joinRequestApi;
