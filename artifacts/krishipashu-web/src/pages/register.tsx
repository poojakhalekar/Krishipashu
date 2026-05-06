import { useState } from "react";
import { useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const mutation = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    mutation.mutate(
      { data: { name, email, password, role: "farmer", phone } },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          navigate("/dashboard");
        },
        onError: (err: any) => {
          setError(err?.data?.error || "Registration failed. Please try again.");
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-amber-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl shadow-xl mb-4">
            <span className="text-white text-3xl font-bold">K</span>
          </div>
          <h1 className="text-3xl font-bold text-white">{t("welcome")}</h1>
          <p className="text-green-300 mt-2 text-sm">{t("welcomeSubtitle")}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-7 shadow-2xl border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-5">{t("register")}</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 text-red-200 rounded-xl px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-green-200 text-sm font-medium mb-1.5">
                {t("name")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-green-300/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition"
                placeholder="Ram Singh"
              />
            </div>
            <div>
              <label className="block text-green-200 text-sm font-medium mb-1.5">
                {t("email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-green-300/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-green-200 text-sm font-medium mb-1.5">
                {t("phone")} <span className="text-green-300/60 text-xs">({t("optional")})</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-green-300/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition"
                placeholder="+91 9876543210"
              />
            </div>
            <div>
              <label className="block text-green-200 text-sm font-medium mb-1.5">
                {t("password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-green-300/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg mt-2"
            >
              {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : null}
              {t("register")}
            </button>
          </form>

          <p className="text-center text-green-300 text-sm mt-5">
            Already have an account?{" "}
            <a href="/login" className="text-amber-400 hover:text-amber-300 font-medium transition">
              {t("login")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
