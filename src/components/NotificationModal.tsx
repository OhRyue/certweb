import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { X, Bell, Loader2 } from "lucide-react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NOTIFICATION_ICON_MAP,
  type Notification,
  type NotificationType,
} from "./api/notificationsApi";

interface NotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 상대 시간 포맷팅 함수
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "방금 전";
  } else if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    // 일주일 이상이면 날짜 표시
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}

export function NotificationModal({
  open,
  onOpenChange,
}: NotificationModalProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const SIZE = 20;

  // 알림 목록 가져오기
  const fetchNotifications = useCallback(
    async (pageNum: number = 0, append: boolean = false) => {
      try {
        if (pageNum === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await getNotifications({
          unreadOnly: false,
          page: pageNum,
          size: SIZE,
        });

        if (append) {
          setNotifications((prev) => [...prev, ...response.content]);
        } else {
          setNotifications(response.content);
        }

        setHasMore(!response.last);
        setPage(pageNum);
      } catch (err) {
        console.error("알림 목록 불러오기 실패", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // 모달이 열릴 때 알림 목록 가져오기
  useEffect(() => {
    if (open) {
      fetchNotifications(0, false);
    }
  }, [open, fetchNotifications]);

  // 더 보기 버튼 클릭
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNotifications(page + 1, true);
    }
  };

  // 알림 읽음 처리
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        )
      );
    } catch (err) {
      console.error("알림 읽음 처리 실패", err);
    }
  };

  // 전체 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          isRead: true,
          readAt: new Date().toISOString(),
        }))
      );
    } catch (err) {
      console.error("전체 알림 읽음 처리 실패", err);
    }
  };

  // 알림 클릭 시 액션
  const handleNotificationClick = async (notification: Notification) => {
    // 읽지 않은 알림이면 읽음 처리
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    // 타입별 라우팅
    const payload = notification.payload as any;
    switch (notification.type) {
      case "BADGE_EARNED":
        // 배지 페이지로 이동 (배지 페이지가 있다면)
        navigate("/shop"); // 임시로 상점 페이지로
        break;
      case "POST_LIKED":
      case "POST_COMMENTED":
      case "COMMENT_REPLIED":
        if (payload?.postId) {
          navigate(`/community/posts/${payload.postId}`);
        }
        break;
      case "DAILY_REMINDER":
        navigate("/learning");
        break;
      case "WEEKLY_REPORT":
        navigate("/report");
        break;
    }

    onOpenChange(false);
  };

  // 읽지 않은 알림 개수
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" />
              알림
              {unreadCount > 0 && (
                <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </DialogTitle>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                전체 읽음
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 mt-4">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mb-4 opacity-50" />
              <p>알림이 없습니다</p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg p-4 cursor-pointer transition-all ${
                    notification.isRead
                      ? "bg-gray-50 hover:bg-gray-100"
                      : "bg-purple-50 hover:bg-purple-100 border-l-4 border-purple-500"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {NOTIFICATION_ICON_MAP[notification.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-sm ${
                            notification.isRead
                              ? "text-gray-700"
                              : "text-gray-900 font-bold"
                          }`}
                        >
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      <p
                        className={`text-sm mt-1 ${
                          notification.isRead
                            ? "text-gray-600"
                            : "text-gray-800"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {hasMore && (
                <div className="flex justify-center py-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        로딩 중...
                      </>
                    ) : (
                      "더 보기"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

