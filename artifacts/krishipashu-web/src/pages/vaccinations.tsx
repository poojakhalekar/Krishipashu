import { useState } from "react";
import Layout from "@/components/Layout";
import {
  useListVaccinations,
  useCreateVaccination,
  useDeleteVaccination,
  useListAnimals,
  getListVaccinationsQueryKey,
} from "@workspace/api-client-react";
import { useI18n } from "@/contexts/I18nContext";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, AlertTriangle, Trash2, X, Loader2, Bell } from "lucide-react";

export default function VaccinationsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [animalFilter, setAnimalFilter] = useState<number | "">("");

  const [form, setForm] = useState({
    animalId: 0,
    vaccineName: "",
    dateAdministered: new Date().toISOString().split("T")[0],
    nextDueDate: "",
    administeredBy: "",
    notes: "",
  });

  const params: any = {};
  if (animalFilter) params.animalId = animalFilter;

  const { data: vaccinations = [], isLoading } = useListVaccinations(params);
  const { data: animals = [] } = useListAnimals();
  const createMutation = useCreateVaccination();
  const deleteMutation = useDeleteVaccination();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListVaccinationsQueryKey() });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.animalId) return;
    createMutation.mutate(
      { data: { ...form, animalId: Number(form.animalId), nextDueDate: form.nextDueDate || null, administeredBy: form.administeredBy || null, notes: form.notes || null } },
      { onSuccess: () => { invalidate(); setShowForm(false); setForm({ animalId: 0, vaccineName: "", dateAdministered: new Date().toISOString().split("T")[0], nextDueDate: "", administeredBy: "", notes: "" }); } }
    );
  };

  const today = new Date().toISOString().split("T")[0];
  const upcoming = vaccinations.filter(v => v.nextDueDate && v.nextDueDate >= today);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white">{t("vaccinations")}</h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">{vaccinations.length} vaccination records</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition shadow-sm">
            <Plus size={16} />
            {t("addVaccination")}
          </button>
        </div>

        {upcoming.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={16} className="text-amber-600" />
              <h2 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">{t("upcomingAlerts")} ({upcoming.length})</h2>
            </div>
            <div className="space-y-2">
              {upcoming.map(v => (
                <div key={v.id} className="flex items-center justify-between bg-white dark:bg-stone-900 rounded-xl px-4 py-3 shadow-sm">
                  <div>
                    <span className="font-medium text-stone-900 dark:text-white text-sm">{v.animalName}</span>
                    <span className="text-stone-500 dark:text-stone-400 text-xs ml-2">· {v.vaccineName}</span>
                  </div>
                  <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">Due: {v.nextDueDate}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-stone-800 mb-5 flex gap-3">
          <select value={animalFilter} onChange={e => setAnimalFilter(e.target.value ? Number(e.target.value) : "")}
            className="border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-sm dark:bg-stone-800 dark:text-white focus:outline-none">
            <option value="">All Animals</option>
            {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-green-600" /></div>
        ) : vaccinations.length === 0 ? (
          <div className="text-center py-20 text-stone-400"><p>{t("noData")}</p></div>
        ) : (
          <div className="space-y-3">
            {vaccinations.map(v => {
              const isUpcoming = v.nextDueDate && v.nextDueDate >= today;
              return (
                <div key={v.id} className="bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-stone-900 dark:text-white">{v.animalName}</span>
                      <span className="px-2.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">{v.vaccineName}</span>
                      {isUpcoming && <span className="flex items-center gap-1 text-amber-600 text-xs"><AlertTriangle size={12} /> Due soon</span>}
                    </div>
                    <div className="text-stone-500 dark:text-stone-400 text-xs space-x-4">
                      <span>Administered: {v.dateAdministered}</span>
                      {v.nextDueDate && <span>Next: {v.nextDueDate}</span>}
                      {v.administeredBy && <span>By: {v.administeredBy}</span>}
                    </div>
                    {v.notes && <p className="text-stone-400 text-xs mt-1">{v.notes}</p>}
                  </div>
                  <button onClick={() => deleteMutation.mutate({ id: v.id }, { onSuccess: invalidate })}
                    className="text-red-400 hover:text-red-600 transition ml-4 p-1.5">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white">{t("addVaccination")}</h2>
              <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1">Animal</label>
                <select value={form.animalId} onChange={e => setForm(f => ({ ...f, animalId: Number(e.target.value) }))} required
                  className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30">
                  <option value="">Select animal</option>
                  {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1">{t("vaccineName")}</label>
                <input value={form.vaccineName} onChange={e => setForm(f => ({ ...f, vaccineName: e.target.value }))} required
                  placeholder="e.g. FMD, Brucellosis"
                  className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1">{t("dateAdministered")}</label>
                  <input type="date" value={form.dateAdministered} onChange={e => setForm(f => ({ ...f, dateAdministered: e.target.value }))} required
                    className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1">{t("nextDue")}</label>
                  <input type="date" value={form.nextDueDate} onChange={e => setForm(f => ({ ...f, nextDueDate: e.target.value }))}
                    className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1">{t("administeredBy")}</label>
                <input value={form.administeredBy} onChange={e => setForm(f => ({ ...f, administeredBy: e.target.value }))}
                  placeholder="Dr. Name / Vet"
                  className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1">{t("notes")}</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-medium transition">{t("cancel")}</button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2">
                  {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  {t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
