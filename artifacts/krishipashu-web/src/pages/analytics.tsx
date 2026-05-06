import Layout from "@/components/Layout";
import { useGetMilkTrend, useGetAnimalStats, useGetDashboardSummary } from "@workspace/api-client-react";
import { useI18n } from "@/contexts/I18nContext";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Loader2 } from "lucide-react";

const PIE_COLORS = ["#16a34a", "#ef4444", "#f59e0b"];

export default function AnalyticsPage() {
  const { t } = useI18n();
  const { data: trend = [], isLoading: trendLoading } = useGetMilkTrend();
  const { data: animalStats = [], isLoading: statsLoading } = useGetAnimalStats();
  const { data: summary } = useGetDashboardSummary();

  const complianceData = summary
    ? [
        { name: t("healthy"), value: summary.healthyAnimals },
        { name: t("sick"), value: summary.sickAnimals },
        { name: "Vaccinated", value: Math.max(0, summary.totalAnimals - summary.healthyAnimals - summary.sickAnimals) },
      ]
    : [];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">{t("analytics")}</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Production insights and farm health overview</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800">
            <h2 className="text-base font-semibold text-stone-900 dark:text-white mb-4">{t("milkTrend")}</h2>
            {trendLoading ? (
              <div className="h-56 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-green-600" /></div>
            ) : trend.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-stone-400 text-sm">{t("noData")}</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(2)} L`, "Milk"]} />
                  <Line type="monotone" dataKey="totalLiters" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: "#16a34a", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800">
            <h2 className="text-base font-semibold text-stone-900 dark:text-white mb-4">Herd Health Distribution</h2>
            {!summary ? (
              <div className="h-56 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-green-600" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={complianceData.filter(d => d.value > 0)} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {complianceData.filter(d => d.value > 0).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800 mb-6">
          <h2 className="text-base font-semibold text-stone-900 dark:text-white mb-4">{t("animalWiseStats")}</h2>
          {statsLoading ? (
            <div className="h-64 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-green-600" /></div>
          ) : animalStats.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-stone-400 text-sm">{t("noData")}</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={animalStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="animalName" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(2)} L`, "Total Milk"]} />
                <Bar dataKey="totalLiters" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {animalStats.length > 0 && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800">
              <h2 className="text-base font-semibold text-stone-900 dark:text-white">Animal Performance</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-stone-50 dark:bg-stone-800">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-stone-600 dark:text-stone-300">Animal</th>
                  <th className="text-left px-5 py-3 font-semibold text-stone-600 dark:text-stone-300">Species</th>
                  <th className="text-right px-5 py-3 font-semibold text-stone-600 dark:text-stone-300">Total Milk</th>
                  <th className="text-right px-5 py-3 font-semibold text-stone-600 dark:text-stone-300">Daily Avg</th>
                </tr>
              </thead>
              <tbody>
                {animalStats.map((s) => (
                  <tr key={s.animalId} className="border-t border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition">
                    <td className="px-5 py-3.5 font-medium text-stone-900 dark:text-white">{s.animalName}</td>
                    <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400">{s.species}</td>
                    <td className="px-5 py-3.5 text-right text-green-700 dark:text-green-400 font-semibold">{s.totalLiters.toFixed(1)} L</td>
                    <td className="px-5 py-3.5 text-right text-stone-700 dark:text-stone-300">{s.averageDaily.toFixed(2)} L/day</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
