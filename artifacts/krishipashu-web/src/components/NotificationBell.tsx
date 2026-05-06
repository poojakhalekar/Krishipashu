import { Bell, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/lib/extended-api";
import { useI18n } from "@/contexts/I18nContext";

export default function NotificationBell() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-green-100 hover:bg-green-700/50 hover:text-white transition"
        title={t("notifications")}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <h3 className="font-semibold text-stone-900 dark:text-white text-sm">
              {t("notifications")}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-green-600 hover:text-green-700 font-medium"
              >
                {t("markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-stone-400 text-sm">
                {t("noNotifications")}
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-stone-100 dark:border-stone-800 last:border-0 ${
                    !n.isRead ? "bg-amber-50/50 dark:bg-amber-900/10" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                        n.isRead ? "bg-stone-300" : "bg-amber-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 dark:text-white">
                        {n.title}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {n.message}
                      </p>
                      <p className="text-xs text-stone-400 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => markRead.mutate(n.id)}
                        title={t("markRead")}
                        className="text-stone-400 hover:text-green-600 transition"
                      >
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <Link href="/notifications">
            <a
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-center text-sm text-green-600 hover:bg-stone-50 dark:hover:bg-stone-800 border-t border-stone-100 dark:border-stone-800"
            >
              {t("viewAll")}
            </a>
          </Link>
        </div>
      )}
    </div>
  );
}
