import axios from "./axiosConfig";

// 알림 타입
export type NotificationType =
  | "BADGE_EARNED"
  | "POST_LIKED"
  | "POST_COMMENTED"
  | "COMMENT_REPLIED"
  | "DAILY_REMINDER"
  | "WEEKLY_REPORT";

// 타입별 아이콘 매핑
export const NOTIFICATION_ICON_MAP: Record<NotificationType, string> = {
  BADGE_EARNED: "🏅",
  POST_LIKED: "❤️",
  POST_COMMENTED: "💬",
  COMMENT_REPLIED: "↩️",
  DAILY_REMINDER: "📚",
  WEEKLY_REPORT: "📊",
};

// 알림 payload 타입들
export interface BadgeEarnedPayload {
  badgeCode: string;
  badgeName: string;
  badgeCategory: string;
}

export interface PostLikedPayload {
  postId: number;
  actorUserId: string;
}

export interface PostCommentedPayload {
  postId: number;
  commentId: number;
  actorUserId: string;
}

export interface CommentRepliedPayload {
  postId: number;
  commentId: number;
  actorUserId: string;
}

export interface DailyReminderPayload {
  // 빈 객체
}

export interface WeeklyReportPayload {
  weekIso: string;
  totalSolved: number;
  accuracy: number;
  totalStudyMinutes: number;
  newBadgesCount: number;
}

export type NotificationPayload =
  | BadgeEarnedPayload
  | PostLikedPayload
  | PostCommentedPayload
  | CommentRepliedPayload
  | DailyReminderPayload
  | WeeklyReportPayload;

// 알림 아이템 타입
export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  payload: NotificationPayload | null;
  isRead: boolean;
  createdAt: string; // ISO 8601
  readAt: string | null;
}

// 알림 목록 응답 타입
export interface NotificationListResponse {
  content: Notification[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: any[];
  };
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

// 알림 조회 파라미터
export interface NotificationParams {
  unreadOnly?: boolean;
  page?: number;
  size?: number;
}

/**
 * 알림 목록을 가져옵니다.
 * @param params 알림 조회 파라미터
 * @returns 알림 목록 응답 데이터
 */
export async function getNotifications(
  params: NotificationParams = {}
): Promise<NotificationListResponse> {
  const { unreadOnly, page = 0, size = 20 } = params;

  const queryParams: Record<string, string | number | boolean> = {
    page,
    size,
  };

  if (unreadOnly !== undefined) {
    queryParams.unreadOnly = unreadOnly;
  }

  const response = await axios.get<NotificationListResponse>(
    "/progress/notifications/my",
    {
      params: queryParams,
    }
  );

  return response.data;
}

/**
 * 알림을 읽음 처리합니다.
 * @param notificationId 알림 ID
 */
export async function markNotificationAsRead(
  notificationId: number
): Promise<void> {
  await axios.post(`/progress/notifications/${notificationId}/read`);
}

/**
 * 모든 알림을 읽음 처리합니다.
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  await axios.post("/progress/notifications/read-all");
}

