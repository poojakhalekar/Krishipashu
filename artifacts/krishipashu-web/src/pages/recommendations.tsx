import Layout from "@/components/Layout";
import { useRecommendations } from "@/lib/extended-api";
import { useI18n } from "@/contexts/I18nContext";
import { Lightbulb, AlertTriangle, Heart, Droplets, Syringe, Loader2 } from "lucide-react";

const CATEGORY_ICON: Record<string, any> = {
  health: Heart,
  milk: Droplets,
  vaccination: Syringe,
  general: Lightbulb,
};

const PRIORITY_STYLES: Record<string, { bg: string; text: string; badge: string }> = {
  high: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-300",
    badge: "bg-red-500 text-white",
  },
  medium: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    badge: "bg-amber-500 text-white",
  },
  low: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-300",
    badge: "bg-green-500 text-white",
  },
};

export default function RecommendationsPage() {
  const { t, language } = useI18n();
  const { data: recs = [], isLoading } = useRecommendations(language);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
            <Lightbulb size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
              {t("smartRecommendations")}
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              {t("recommendationsSubtitle")}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-green-600" />
          </div>
        ) : recs.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-12 text-center border border-stone-100 dark:border-stone-800">
            <Lightbulb size={48} className="mx-auto text-stone-300 mb-3" />
            <p className="text-stone-500 dark:text-stone-400">
              {t("noRecommendations")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recs.map((rec) => {
              const Icon = CATEGORY_ICON[rec.category] || Lightbulb;
              const style = PRIORITY_STYLES[rec.priority];
              return (
                <div
                  key={rec.id}
                  className={`rounded-2xl p-5 border border-stone-100 dark:border-stone-800 ${style.bg}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-white dark:bg-stone-900 shadow-sm flex items-center justify-center flex-shrink-0">
                      <Icon size={20} className={style.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1.5 flex-wrap">
                        <h3 className="font-semibold text-stone-900 dark:text-white">
                          {rec.title}
                        </h3>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${style.badge}`}
                        >
                          {t(rec.priority)}
                        </span>
                      </div>
                      <p className="text-stone-700 dark:text-stone-300 text-sm">
                        {rec.message}
                      </p>
                      {rec.action && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 italic">
                          → {rec.action}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                {t("aiDisclaimerTitle")}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {t("aiDisclaimer")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
