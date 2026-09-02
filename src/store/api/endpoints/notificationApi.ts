import { apiSlice, OVERRIDE_ON_HMR } from "../apiSlice";
import type { AppNotification, NotificationList, PaginationParams } from "@/types/api";

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query<NotificationList, PaginationParams & { unread?: boolean }>({
      query: (params) => ({ url: "/notifications", params }),
      providesTags: ["Notification"],
    }),

    markNotificationRead: builder.mutation<AppNotification, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notification"],
    }),

    markAllNotificationsRead: builder.mutation<{ count: number }, void>({
      query: () => ({ url: "/notifications/read-all", method: "POST" }),
      invalidatesTags: ["Notification"],
    }),
  }),
  overrideExisting: OVERRIDE_ON_HMR,
});

export const {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationApi;
