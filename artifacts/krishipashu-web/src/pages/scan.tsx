import { useRoute } from "wouter";
import { usePublicAnimal } from "@/lib/extended-api";
import { Loader2, Phone, User, Calendar, Droplets, Syringe } from "lucide-react";

const HEALTH_COLORS: Record<string, string> = {
  healthy: "bg-green-100 text-green-700",
  sick: "bg-red-100 text-red-700",
  injured: "bg-orange-100 text-orange-700",
  pregnant: "bg-purple-100 text-purple-700",
};

export default function ScanPage() {
  const [, params] = useRoute("/scan/:animalId");
  const animalId = params?.animalId;
  const { data, isLoading, error } = usePublicAnimal(animalId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-lg font-bold text-stone-900 mb-1">Animal Not Found</h2>
          <p className="text-stone-500 text-sm">
            The animal tag <span className="font-mono">{animalId}</span> could not be found.
          </p>
        </div>
      </div>
    );
  }

  const { animal, owner, vaccinations, recentMilk } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 dark:from-stone-950 dark:to-stone-900 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500 rounded-2xl shadow-lg mb-3">
            <span className="text-white text-2xl font-bold">K</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">KrishiPashu</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm">Animal Identity Card</p>
        </div>

        {/* Animal card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl overflow-hidden mb-4">
          {animal.imageUrl ? (
            <img src={animal.imageUrl} alt={animal.name} className="w-full h-48 object-cover" />
          ) : (
            <div className="h-32 bg-gradient-to-r from-green-600 to-green-700" />
          )}
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white">
                  {animal.name}
                </h2>
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  {animal.species} · {animal.breed}
                </p>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${HEALTH_COLORS[animal.healthStatus] || "bg-gray-100 text-gray-700"}`}
              >
                {animal.healthStatus}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t border-stone-100 dark:border-stone-800">
              <div>
                <p className="text-stone-400 text-xs uppercase tracking-wide">Tag ID</p>
                <p className="font-mono font-medium text-stone-900 dark:text-white">
                  {animal.animalId}
                </p>
              </div>
              <div>
                <p className="text-stone-400 text-xs uppercase tracking-wide">Age</p>
                <p className="font-medium text-stone-900 dark:text-white">{animal.age} years</p>
              </div>
            </div>
            {animal.notes && (
              <p className="text-sm text-stone-600 dark:text-stone-300 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                {animal.notes}
              </p>
            )}
          </div>
        </div>

        {/* Owner card */}
        {owner && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm p-5 mb-4">
            <h3 className="font-semibold text-stone-900 dark:text-white text-sm mb-3 flex items-center gap-2">
              <User size={16} className="text-green-600" /> Owner
            </h3>
            <p className="text-stone-700 dark:text-stone-200 font-medium">{owner.name}</p>
            {owner.phone && (
              <a
                href={`tel:${owner.phone}`}
                className="inline-flex items-center gap-2 mt-2 text-sm text-green-600 hover:text-green-700"
              >
                <Phone size={14} /> {owner.phone}
              </a>
            )}
          </div>
        )}

        {/* Vaccinations */}
        {vaccinations.length > 0 && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm p-5 mb-4">
            <h3 className="font-semibold text-stone-900 dark:text-white text-sm mb-3 flex items-center gap-2">
              <Syringe size={16} className="text-amber-600" /> Vaccination History
            </h3>
            <div className="space-y-2">
              {vaccinations.map((v, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between text-sm py-2 border-b border-stone-100 dark:border-stone-800 last:border-0"
                >
                  <div>
                    <p className="font-medium text-stone-900 dark:text-white">
                      {v.vaccineName}
                    </p>
                    <p className="text-stone-500 text-xs flex items-center gap-1 mt-0.5">
                      <Calendar size={12} /> {v.dateAdministered}
                      {v.administeredBy && ` · By ${v.administeredBy}`}
                    </p>
                  </div>
                  {v.nextDueDate && (
                    <span className="text-xs text-amber-600">
                      Next: {v.nextDueDate}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent milk */}
        {recentMilk.length > 0 && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm p-5 mb-4">
            <h3 className="font-semibold text-stone-900 dark:text-white text-sm mb-3 flex items-center gap-2">
              <Droplets size={16} className="text-blue-500" /> Recent Milk Production
            </h3>
            <div className="space-y-1.5">
              {recentMilk.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-1.5"
                >
                  <span className="text-stone-600 dark:text-stone-300">
                    {m.date} · {m.session}
                  </span>
                  <span className="font-semibold text-stone-900 dark:text-white">
                    {m.quantityLiters.toFixed(1)} L
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-stone-400 mt-6">
          Powered by KrishiPashu · Smart Livestock Management
        </p>
      </div>
    </div>
  );
}
