import Layout from "@/components/Layout";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/lib/extended-api";
import { useI18n } from "@/contexts/I18nContext";
import { Bell, Check, Loader2, Syringe, Heart, Droplets, Info } from "lucide-react";

const TYPE_ICONS: Record<string, any> = {
  vaccination: Syringe,
  health: Heart,
  milk: Droplets,
};

export default function NotificationsPage() {
  const { t } = useI18n();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Bell size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
                {t("notifications")}
              </h1>
              <p className="text-stone-500 dark:text-stone-400 text-sm">
                {unreadCount > 0 ? `${unreadCount} ${t("unread")}` : t("allCaughtUp")}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-xl font-medium transition"
            >
              {t("markAllRead")}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-green-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-12 text-center border border-stone-100 dark:border-stone-800">
            <Bell size={48} className="mx-auto text-stone-300 mb-3" />
            <p className="text-stone-500 dark:text-stone-400">
              {t("noNotifications")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const Icon = TYPE_ICONS[n.type] || Info;
              return (
                <div
                  key={n.id}
                  className={`bg-white dark:bg-stone-900 rounded-2xl p-5 border ${
                    !n.isRead
                      ? "border-amber-200 dark:border-amber-800"
                      : "border-stone-100 dark:border-stone-800"
                  } shadow-sm flex items-start gap-4`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      !n.isRead
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-500"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-stone-900 dark:text-white text-sm">
                        {n.title}
                      </h3>
                      {!n.isRead && (
                        <button
                          onClick={() => markRead.mutate(n.id)}
                          className="text-stone-400 hover:text-green-600 transition"
                          title={t("markRead")}
                        >
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                    <p className="text-stone-600 dark:text-stone-300 text-sm mt-1">
                      {n.message}
                    </p>
                    <p className="text-stone-400 text-xs mt-2">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
