import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { initApiAuth } from "@/lib/api";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import AnimalsPage from "@/pages/animals";
import MilkPage from "@/pages/milk";
import VaccinationsPage from "@/pages/vaccinations";
import AnalyticsPage from "@/pages/analytics";
import SettingsPage from "@/pages/settings";
import NotificationsPage from "@/pages/notifications";
import RecommendationsPage from "@/pages/recommendations";
import ScanPage from "@/pages/scan";

initApiAuth();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => { window.location.href = "/dashboard"; return null; }} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/scan/:animalId" component={ScanPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/animals" component={AnimalsPage} />
      <Route path="/milk" component={MilkPage} />
      <Route path="/vaccinations" component={VaccinationsPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/recommendations" component={RecommendationsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
