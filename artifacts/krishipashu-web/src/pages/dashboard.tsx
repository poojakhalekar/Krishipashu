import Layout from "@/components/Layout";
import { useGetDashboardSummary, useGetMilkTrend, useGetUpcomingVaccinations } from "@workspace/api-client-react";
import { useI18n } from "@/contexts/I18nContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Dog, Droplets, Syringe, Activity, AlertTriangle } from "lucide-react";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-stone-500 dark:text-stone-400 text-sm font-medium">{label}</p>
        <p className="text-stone-900 dark:text-white text-2xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { data: summary, isLoading } = useGetDashboardSummary();
  const { data: trend = [] } = useGetMilkTrend();
  const { data: upcoming = [] } = useGetUpcomingVaccinations();

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">{t("dashboard")}</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Overview of your livestock farm</p>
        </div>

        {isLoading ? (
          <p className="text-stone-500">{t("loading")}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <StatCard label={t("totalAnimals")} value={summary?.totalAnimals ?? 0} icon={Dog} color="bg-green-600" />
              <StatCard label={t("milkToday")} value={`${summary?.totalMilkToday?.toFixed(1) ?? 0} L`} icon={Droplets} color="bg-blue-500" />
              <StatCard label={t("upcomingVaccinations")} value={summary?.upcomingVaccinations ?? 0} icon={Syringe} color="bg-amber-500" />
              <StatCard label={t("healthyAnimals")} value={summary?.healthyAnimals ?? 0} icon={Activity} color="bg-emerald-500" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
              <div className="xl:col-span-2 bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800">
                <h2 className="text-base font-semibold text-stone-900 dark:text-white mb-4">{t("milkTrend")}</h2>
                {trend.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-stone-400 text-sm">{t("noData")}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => [`${v.toFixed(1)} L`, "Milk"]} />
                      <Line type="monotone" dataKey="totalLiters" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: "#16a34a", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800">
                <h2 className="text-base font-semibold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  {t("upcomingAlerts")}
                </h2>
                {upcoming.length === 0 ? (
                  <div className="text-stone-400 text-sm text-center py-8">{t("noData")}</div>
                ) : (
                  <div className="space-y-3">
                    {upcoming.slice(0, 5).map((v) => (
                      <div key={v.id} className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-stone-800 dark:text-stone-200 text-sm font-medium">{v.animalName}</p>
                          <p className="text-stone-500 dark:text-stone-400 text-xs">{v.vaccineName}</p>
                          <p className="text-amber-600 dark:text-amber-400 text-xs mt-0.5">Due: {v.nextDueDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-100 dark:border-stone-800">
                <p className="text-stone-500 dark:text-stone-400 text-xs font-medium uppercase tracking-wide">{t("milkThisWeek")}</p>
                <p className="text-stone-900 dark:text-white text-3xl font-bold mt-2">{(summary?.milkThisWeek ?? 0).toFixed(1)} L</p>
              </div>
              <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-100 dark:border-stone-800">
                <p className="text-stone-500 dark:text-stone-400 text-xs font-medium uppercase tracking-wide">{t("sickAnimals")}</p>
                <p className="text-red-500 text-3xl font-bold mt-2">{summary?.sickAnimals ?? 0}</p>
              </div>
              <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-100 dark:border-stone-800">
                <p className="text-stone-500 dark:text-stone-400 text-xs font-medium uppercase tracking-wide">{t("vaccinationCompliance")}</p>
                <p className="text-green-600 text-3xl font-bold mt-2">{summary?.vaccinationCompliancePercent ?? 0}%</p>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
