import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const mutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    mutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          navigate("/dashboard");
        },
        onError: (err: any) => {
          setError(err?.data?.error || "Login failed. Check your credentials.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-amber-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl shadow-xl mb-4">
            <span className="text-white text-3xl font-bold">K</span>
          </div>
          <h1 className="text-3xl font-bold text-white">{t("welcome")}</h1>
          <p className="text-green-300 mt-2 text-sm">{t("welcomeSubtitle")}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-6">{t("login")}</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 text-red-200 rounded-xl px-4 py-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-green-200 text-sm font-medium mb-1.5">{t("email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-green-300/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-green-200 text-sm font-medium mb-1.5">{t("password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-green-300/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg mt-2"
            >
              {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : null}
              {t("login")}
            </button>
          </form>

          <p className="text-center text-green-300 text-sm mt-5">
            Don't have an account?{" "}
            <a href="/register" className="text-amber-400 hover:text-amber-300 font-medium transition">
              {t("register")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
