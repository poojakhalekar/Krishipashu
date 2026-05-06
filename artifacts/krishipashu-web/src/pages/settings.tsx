import Layout from "@/components/Layout";
import { useI18n } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Sun, Moon, Globe, User } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "mr", label: "Marathi", native: "मराठी" },
];

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">{t("settings")}</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Manage your preferences</p>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <User size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="font-semibold text-stone-900 dark:text-white">{t("profile")}</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500 dark:text-stone-400">{t("name")}</span>
                <span className="text-sm font-medium text-stone-900 dark:text-white">{user?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500 dark:text-stone-400">{t("email")}</span>
                <span className="text-sm font-medium text-stone-900 dark:text-white">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500 dark:text-stone-400">Member since</span>
                <span className="text-sm font-medium text-stone-900 dark:text-white">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                {theme === "dark" ? <Moon size={18} className="text-amber-500" /> : <Sun size={18} className="text-amber-500" />}
              </div>
              <h2 className="font-semibold text-stone-900 dark:text-white">{t("darkMode")}</h2>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600 dark:text-stone-400">
                {theme === "dark" ? "Dark mode is on" : "Light mode is on"}
              </span>
              <button
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-colors ${theme === "dark" ? "bg-amber-500" : "bg-stone-200"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${theme === "dark" ? "translate-x-6" : ""}`} />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Globe size={18} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="font-semibold text-stone-900 dark:text-white">{t("language")}</h2>
            </div>
            <div className="space-y-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as "en" | "hi" | "mr")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition border ${
                    language === lang.code
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                      : "border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                  }`}
                >
                  <span className="font-medium">{lang.native}</span>
                  <span className="text-xs text-stone-400">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800">
            <h2 className="font-semibold text-stone-900 dark:text-white mb-3">About</h2>
            <div className="space-y-2 text-sm text-stone-500 dark:text-stone-400">
              <p>KrishiPashu Web v1.0</p>
              <p>Livestock management platform for rural Indian farmers</p>
              <p>Features: Animal tracking, Milk records, Vaccination alerts, Analytics</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
