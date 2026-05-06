import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import {
  useListMilkEntries,
  useCreateMilkEntry,
  useDeleteMilkEntry,
  useListAnimals,
  getListMilkEntriesQueryKey,
} from "@workspace/api-client-react";
import { useI18n } from "@/contexts/I18nContext";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Mic, MicOff, Download, Trash2, X, Loader2 } from "lucide-react";
import jsPDF from "jspdf";

function exportCSV(entries: any[]) {
  const headers = ["Date", "Animal", "Session", "Quantity (L)", "Notes"];
  const rows = entries.map((e) => [e.date, e.animalName, e.session, e.quantityLiters, e.notes || ""]);
  const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "milk-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(entries: any[]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("KrishiPashu - Milk Production Report", 14, 20);
  doc.setFontSize(10);
  let y = 35;
  doc.text("Date", 14, y);
  doc.text("Animal", 50, y);
  doc.text("Session", 95, y);
  doc.text("Qty (L)", 130, y);
  y += 6;
  doc.line(14, y, 196, y);
  y += 4;
  entries.forEach((e) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(String(e.date), 14, y);
    doc.text(String(e.animalName), 50, y);
    doc.text(String(e.session), 95, y);
    doc.text(String(e.quantityLiters), 130, y);
    y += 7;
  });
  doc.save("milk-report.pdf");
}

export default function MilkPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [animalFilter, setAnimalFilter] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [form, setForm] = useState({
    animalId: 0,
    quantityLiters: 0,
    date: new Date().toISOString().split("T")[0],
    session: "morning",
    notes: "",
  });

  const params: any = {};
  if (animalFilter) params.animalId = animalFilter;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const { data: entries = [], isLoading } = useListMilkEntries(params);
  const { data: animals = [] } = useListAnimals();
  const createMutation = useCreateMilkEntry();
  const deleteMutation = useDeleteMilkEntry();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListMilkEntriesQueryKey() });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.animalId) return;
    createMutation.mutate(
      { data: { ...form, animalId: Number(form.animalId), quantityLiters: Number(form.quantityLiters) } },
      { onSuccess: () => { invalidate(); setShowForm(false); setForm({ animalId: 0, quantityLiters: 0, date: new Date().toISOString().split("T")[0], session: "morning", notes: "" }); } }
    );
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice input not supported in this browser.");
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      const litersMatch = transcript.match(/(\d+(?:\.\d+)?)\s*(liter|litre|l)/i);
      const animalMatch = transcript.match(/for\s+(cow|buffalo|goat|sheep|hen)?\s*(\w+)/i);
      if (litersMatch) setForm(f => ({ ...f, quantityLiters: Number(litersMatch[1]) }));
      if (animalMatch && animals.length) {
        const name = animalMatch[2];
        const found = animals.find(a => a.name.toLowerCase().includes(name));
        if (found) setForm(f => ({ ...f, animalId: found.id }));
      }
      setListening(false);
      setShowForm(true);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const totalLiters = entries.reduce((sum, e) => sum + e.quantityLiters, 0);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white">{t("milk")}</h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Total: {totalLiters.toFixed(1)} L</p>
          </div>
          <div className="flex gap-2">
            <button onClick={startVoice}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition ${listening ? "bg-red-500 text-white" : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200"}`}>
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
              {listening ? t("listeningMsg") : t("voiceInput")}
            </button>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition shadow-sm">
              <Plus size={16} />
              {t("addMilkEntry")}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-stone-800 mb-5 flex gap-3 flex-wrap items-end">
          <div>
            <label className="text-xs text-stone-500 block mb-1">Animal</label>
            <select value={animalFilter} onChange={e => setAnimalFilter(e.target.value ? Number(e.target.value) : "")}
              className="border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-sm dark:bg-stone-800 dark:text-white focus:outline-none">
              <option value="">All Animals</option>
              {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">From</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-sm dark:bg-stone-800 dark:text-white focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">To</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-sm dark:bg-stone-800 dark:text-white focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportCSV(entries)} className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 rounded-xl text-sm transition">
              <Download size={14} /> CSV
            </button>
            <button onClick={() => exportPDF(entries)} className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 rounded-xl text-sm transition">
              <Download size={14} /> PDF
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-green-600" /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-stone-400"><p>{t("noData")}</p></div>
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 dark:bg-stone-800">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-stone-600 dark:text-stone-300">{t("date")}</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-stone-600 dark:text-stone-300">Animal</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-stone-600 dark:text-stone-300">{t("session")}</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-stone-600 dark:text-stone-300">{t("quantity")}</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition">
                    <td className="px-5 py-3.5 text-stone-700 dark:text-stone-300">{e.date}</td>
                    <td className="px-5 py-3.5 text-stone-900 dark:text-white font-medium">{e.animalName}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium capitalize">{e.session}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-green-700 dark:text-green-400">{e.quantityLiters} L</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => deleteMutation.mutate({ id: e.id }, { onSuccess: invalidate })}
                        className="text-red-400 hover:text-red-600 transition"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white">{t("addMilkEntry")}</h2>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1">{t("date")}</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required
                    className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1">{t("session")}</label>
                  <select value={form.session} onChange={e => setForm(f => ({ ...f, session: e.target.value }))}
                    className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30">
                    <option value="morning">{t("morning")}</option>
                    <option value="evening">{t("evening")}</option>
                    <option value="night">{t("night")}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1">{t("quantity")}</label>
                <input type="number" min="0" step="0.1" value={form.quantityLiters} onChange={e => setForm(f => ({ ...f, quantityLiters: Number(e.target.value) }))} required
                  className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1">{t("notes")}</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30" />
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
