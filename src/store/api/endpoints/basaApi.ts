import { apiSlice, OVERRIDE_ON_HMR } from "../apiSlice";
import type {
  Basa,
  BasaId,
  BasaMember,
  BasaMembershipSummary,
  BasaRole,
  CreateBasaInput,
  CreateInvitationInput,
  Invitation,
  MemberId,
  UpdateBasaInput,
  UserId,
} from "@/types/api";

export const basaApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // --- Basas -------------------------------------------------------------
    listBasas: builder.query<BasaMembershipSummary[], void>({
      query: () => "/basas",
      providesTags: ["BasaList"],
    }),

    getBasa: builder.query<Basa, BasaId>({
      query: (basaId) => `/basas/${basaId}`,
      providesTags: (_result, _error, basaId) => [{ type: "Basa", id: basaId }],
    }),

    createBasa: builder.mutation<Basa, CreateBasaInput>({
      query: (body) => ({ url: "/basas", method: "POST", body }),
      invalidatesTags: ["BasaList"],
    }),

    updateBasa: builder.mutation<Basa, { basaId: BasaId; body: UpdateBasaInput }>({
      query: ({ basaId, body }) => ({ url: `/basas/${basaId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { basaId }) => [{ type: "Basa", id: basaId }, "BasaList"],
    }),

    /** Soft delete — the basa is archived, not erased. Owner only. */
    deleteBasa: builder.mutation<{ id: BasaId; deletedAt: string }, BasaId>({
      query: (basaId) => ({ url: `/basas/${basaId}`, method: "DELETE" }),
      invalidatesTags: ["BasaList"],
    }),

    // --- Members -----------------------------------------------------------
    listMembers: builder.query<BasaMember[], BasaId>({
      query: (basaId) => `/basas/${basaId}/members`,
      providesTags: (_r, _e, basaId) => [{ type: "Member", id: basaId }],
    }),

    /** Adds an existing account directly by **user id** (no invitation email). */
    addMember: builder.mutation<BasaMember, { basaId: BasaId; userId: UserId; role?: BasaRole }>({
      query: ({ basaId, ...body }) => ({ url: `/basas/${basaId}/members`, method: "POST", body }),
      invalidatesTags: (_r, _e, { basaId }) => [{ type: "Member", id: basaId }, { type: "Basa", id: basaId }],
    }),

    updateMember: builder.mutation<
      BasaMember,
      { basaId: BasaId; memberId: MemberId; role?: BasaRole; status?: "ACTIVE" | "INACTIVE" }
    >({
      query: ({ basaId, memberId, ...body }) => ({
        url: `/basas/${basaId}/members/${memberId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { basaId }) => [{ type: "Member", id: basaId }, { type: "Basa", id: basaId }],
    }),

    /** Soft removal — historical meals, expenses and deposits stay intact. */
    removeMember: builder.mutation<BasaMember, { basaId: BasaId; memberId: MemberId }>({
      query: ({ basaId, memberId }) => ({
        url: `/basas/${basaId}/members/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { basaId }) => [{ type: "Member", id: basaId }, { type: "Basa", id: basaId }],
    }),

    // --- Invitations -------------------------------------------------------
    listInvitations: builder.query<Invitation[], BasaId>({
      query: (basaId) => `/basas/${basaId}/invitations`,
      providesTags: (_r, _e, basaId) => [{ type: "Invitation", id: basaId }],
    }),

    createInvitation: builder.mutation<Invitation, { basaId: BasaId } & CreateInvitationInput>({
      query: ({ basaId, ...body }) => ({
        url: `/basas/${basaId}/invitations`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { basaId }) => [{ type: "Invitation", id: basaId }],
    }),

    /** Regenerates the token, **invalidating the previous link**. `expiresAt` is unchanged. */
    resendInvitation: builder.mutation<{ id: string }, { basaId: BasaId; invitationId: string }>({
      query: ({ basaId, invitationId }) => ({
        url: `/basas/${basaId}/invitations/${invitationId}/resend`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { basaId }) => [{ type: "Invitation", id: basaId }],
    }),

    cancelInvitation: builder.mutation<void, { basaId: BasaId; invitationId: string }>({
      query: ({ basaId, invitationId }) => ({
        url: `/basas/${basaId}/invitations/${invitationId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { basaId }) => [{ type: "Invitation", id: basaId }],
    }),

    /** Not basa-scoped — the caller is not a member yet. `token` is the raw email token. */
    acceptInvitation: builder.mutation<BasaMember, string>({
      query: (token) => ({ url: `/invitations/${token}/accept`, method: "POST" }),
      invalidatesTags: ["BasaList"],
    }),
  }),
  overrideExisting: OVERRIDE_ON_HMR,
});

export const {
  useListBasasQuery,
  useGetBasaQuery,
  useCreateBasaMutation,
  useUpdateBasaMutation,
  useDeleteBasaMutation,
  useListMembersQuery,
  useAddMemberMutation,
  useUpdateMemberMutation,
  useRemoveMemberMutation,
  useListInvitationsQuery,
  useCreateInvitationMutation,
  useResendInvitationMutation,
  useCancelInvitationMutation,
  useAcceptInvitationMutation,
} = basaApi;
