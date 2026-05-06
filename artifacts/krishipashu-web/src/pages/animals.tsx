import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import {
  useListAnimals,
  useCreateAnimal,
  useUpdateAnimal,
  useDeleteAnimal,
  getListAnimalsQueryKey,
} from "@workspace/api-client-react";
import { useI18n } from "@/contexts/I18nContext";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, QrCode, Edit, Trash2, Loader2, X, Upload, ImageIcon } from "lucide-react";
import QRCode from "qrcode";
import type { Animal } from "@workspace/api-client-react";

const HEALTH_COLORS: Record<string, string> = {
  healthy: "bg-green-100 text-green-700",
  sick: "bg-red-100 text-red-700",
  injured: "bg-orange-100 text-orange-700",
  pregnant: "bg-purple-100 text-purple-700",
};

async function compressImage(file: File, maxSize = 600, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No canvas context"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AnimalForm({ initial, onClose, onSave }: {
  initial?: Animal;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    species: initial?.species ?? "Cow",
    breed: initial?.breed ?? "",
    age: initial?.age ?? 0,
    healthStatus: initial?.healthStatus ?? "healthy",
    notes: initial?.notes ?? "",
    imageUrl: initial?.imageUrl ?? "",
  });
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compressImage(file);
      setForm((f) => ({ ...f, imageUrl: dataUrl }));
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
            {initial ? t("edit") : t("addAnimal")}
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          {/* Image upload */}
          <div>
            <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-2">
              {t("animalPhoto")}
            </label>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-700 overflow-hidden flex items-center justify-center bg-stone-50 dark:bg-stone-800">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={22} className="text-stone-300" />
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-stone-200 dark:border-stone-700 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 dark:text-white"
                >
                  {uploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  {form.imageUrl ? t("changePhoto") : t("uploadPhoto")}
                </button>
                {form.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                    className="ml-2 text-xs text-red-500 hover:text-red-700"
                  >
                    {t("remove")}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1">
              {t("name")}
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1">
                {t("species")}
              </label>
              <select
                value={form.species}
                onChange={(e) => setForm((f) => ({ ...f, species: e.target.value }))}
                className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
              >
                {["Cow", "Buffalo", "Goat", "Sheep", "Pig", "Hen", "Other"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1">
                {t("breed")}
              </label>
              <input
                value={form.breed}
                onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))}
                className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1">
                {t("age")}
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.age}
                onChange={(e) => setForm((f) => ({ ...f, age: Number(e.target.value) }))}
                className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1">
                {t("healthStatus")}
              </label>
              <select
                value={form.healthStatus}
                onChange={(e) => setForm((f) => ({ ...f, healthStatus: e.target.value }))}
                className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
              >
                {["healthy", "sick", "injured", "pregnant"].map((s) => (
                  <option key={s} value={s}>{t(s)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block mb-1">
              {t("notes")}
            </label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
          >
            {t("cancel")}
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition"
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function QRModal({ animal, onClose }: { animal: Animal; onClose: () => void }) {
  const [qrUrl, setQrUrl] = useState("");
  const publicBase =
    (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
    window.location.origin;
  const scanUrl = `${publicBase}/scan/${animal.animalId}`;

  useEffect(() => {
    QRCode.toDataURL(scanUrl, { width: 240, margin: 2 }).then(setQrUrl);
  }, [scanUrl]);

  const downloadQR = () => {
    if (!qrUrl) return;
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `${animal.animalId}-qr.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
        <button
          onClick={onClose}
          className="float-right text-stone-400 hover:text-stone-600"
        >
          <X size={20} />
        </button>
        <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-1">{animal.name}</h3>
        <p className="text-stone-500 text-sm font-mono mb-4">{animal.animalId}</p>
        {qrUrl && <img src={qrUrl} alt="QR Code" className="mx-auto rounded-xl" />}
        <p className="text-stone-400 text-xs mt-4 break-all">{scanUrl}</p>
        <button
          onClick={downloadQR}
          className="mt-4 w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition"
        >
          Download QR
        </button>
      </div>
    </div>
  );
}

export default function AnimalsPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editAnimal, setEditAnimal] = useState<Animal | null>(null);
  const [qrAnimal, setQrAnimal] = useState<Animal | null>(null);

  const qc = useQueryClient();
  const { data: animals = [], isLoading } = useListAnimals({ search, species: speciesFilter });
  const createMutation = useCreateAnimal();
  const updateMutation = useUpdateAnimal();
  const deleteMutation = useDeleteAnimal();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListAnimalsQueryKey() });

  const handleCreate = (data: any) => {
    createMutation.mutate({ data }, { onSuccess: () => { invalidate(); setShowForm(false); } });
  };

  const handleUpdate = (data: any) => {
    if (!editAnimal) return;
    updateMutation.mutate(
      { id: editAnimal.id, data },
      { onSuccess: () => { invalidate(); setEditAnimal(null); } },
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm(t("confirmDelete"))) return;
    deleteMutation.mutate({ id }, { onSuccess: invalidate });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white">{t("animals")}</h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
              {animals.length} animals registered
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
          >
            <Plus size={16} />
            {t("addAnimal")}
          </button>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-stone-800 mb-5 flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search") + "..."}
              className="w-full pl-9 pr-4 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
            />
          </div>
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className="border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
          >
            <option value="">All Species</option>
            {["Cow", "Buffalo", "Goat", "Sheep", "Pig", "Hen", "Other"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-green-600" />
          </div>
        ) : animals.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <p className="text-lg mb-2">{t("noData")}</p>
            <p className="text-sm">Add your first animal to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {animals.map((animal) => (
              <div
                key={animal.id}
                className="bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-100 dark:border-stone-800 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  {animal.imageUrl ? (
                    <img
                      src={animal.imageUrl}
                      alt={animal.name}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <ImageIcon size={20} className="text-green-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-stone-900 dark:text-white truncate">
                      {animal.name}
                    </h3>
                    <p className="text-stone-500 dark:text-stone-400 text-xs mt-0.5">
                      {animal.species} · {animal.breed}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${HEALTH_COLORS[animal.healthStatus] || "bg-gray-100 text-gray-700"}`}
                  >
                    {t(animal.healthStatus)}
                  </span>
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mb-4 space-y-1">
                  <p>
                    ID:{" "}
                    <span className="font-mono text-stone-700 dark:text-stone-300">
                      {animal.animalId}
                    </span>
                  </p>
                  <p>Age: {animal.age} years</p>
                  {animal.notes && <p className="truncate">Note: {animal.notes}</p>}
                </div>
                <div className="flex gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                  <button
                    onClick={() => setQrAnimal(animal)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition"
                  >
                    <QrCode size={14} /> QR
                  </button>
                  <button
                    onClick={() => setEditAnimal(animal)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition"
                  >
                    <Edit size={14} /> {t("edit")}
                  </button>
                  <button
                    onClick={() => handleDelete(animal.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                  >
                    <Trash2 size={14} /> {t("delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && <AnimalForm onClose={() => setShowForm(false)} onSave={handleCreate} />}
      {editAnimal && (
        <AnimalForm
          initial={editAnimal}
          onClose={() => setEditAnimal(null)}
          onSave={handleUpdate}
        />
      )}
      {qrAnimal && <QRModal animal={qrAnimal} onClose={() => setQrAnimal(null)} />}
    </Layout>
  );
}
