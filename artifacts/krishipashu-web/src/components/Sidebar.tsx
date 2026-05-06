import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Dog,
  Droplets,
  Syringe,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Lightbulb,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";
import NotificationBell from "./NotificationBell";

interface NavItem {
  key: string;
  path: string;
  icon: any;
}

const navItems: NavItem[] = [
  { key: "dashboard", path: "/dashboard", icon: LayoutDashboard },
  { key: "animals", path: "/animals", icon: Dog },
  { key: "milk", path: "/milk", icon: Droplets },
  { key: "vaccinations", path: "/vaccinations", icon: Syringe },
  { key: "analytics", path: "/analytics", icon: BarChart3 },
  { key: "recommendations", path: "/recommendations", icon: Lightbulb },
  { key: "notifications", path: "/notifications", icon: Bell },
  { key: "settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = navItems;

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-green-700/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">KrishiPashu</h1>
            <p className="text-green-300 text-xs">Livestock Manager</p>
          </div>
        </div>
        <NotificationBell />
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleItems.map(({ key, path, icon: Icon }) => {
          const active = location === path || (path !== "/" && location.startsWith(path));
          return (
            <Link
              key={key}
              href={path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-green-100 hover:bg-green-700/50 hover:text-white",
              )}
            >
              <Icon size={18} />
              <span>{t(key)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-green-700/30">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-green-300 text-xs truncate capitalize">
              {user?.role || "farmer"}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200"
        >
          <LogOut size={16} />
          <span>{t("logout")}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-gradient-to-b from-green-900 to-green-950 h-full fixed left-0 top-0 bottom-0 z-40 shadow-2xl">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-green-900 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="font-bold text-white text-base">KrishiPashu</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white p-1"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex flex-col w-72 bg-gradient-to-b from-green-900 to-green-950 h-full shadow-2xl">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}
