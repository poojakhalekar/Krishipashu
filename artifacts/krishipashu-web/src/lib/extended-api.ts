import { useQuery, useMutation, useQueryClient, type UseQueryResult } from "@tanstack/react-query";

export interface AppNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  category: "health" | "milk" | "vaccination" | "general";
  priority: "high" | "medium" | "low";
  title: string;
  message: string;
  action?: string;
}

export interface PublicAnimalView {
  animal: {
    animalId: string;
    name: string;
    species: string;
    breed: string;
    age: number;
    healthStatus: string;
    imageUrl: string | null;
    notes: string | null;
  };
  owner: { name: string; phone: string | null } | null;
  vaccinations: Array<{
    vaccineName: string;
    dateAdministered: string;
    nextDueDate: string | null;
    administeredBy: string | null;
  }>;
  recentMilk: Array<{
    date: string;
    session: string;
    quantityLiters: number;
  }>;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiGet<T>(path: string, requireAuth = true): Promise<T> {
  const res = await fetch(path, { headers: requireAuth ? authHeaders() : {} });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPatch<T>(path: string): Promise<T> {
  const res = await fetch(path, { method: "PATCH", headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useNotifications(): UseQueryResult<AppNotification[]> {
  return useQuery({
    queryKey: ["/api/notifications"],
    queryFn: () => apiGet<AppNotification[]>("/api/notifications"),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiPatch<AppNotification>(`/api/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<{ success: boolean }>("/api/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });
}

export function useRecommendations(lang: string = "en"): UseQueryResult<Recommendation[]> {
  return useQuery({
    queryKey: ["/api/recommendations", lang],
    queryFn: () => apiGet<Recommendation[]>(`/api/recommendations?lang=${encodeURIComponent(lang)}`),
    staleTime: 5 * 60_000,
  });
}

export function usePublicAnimal(animalId: string | undefined): UseQueryResult<PublicAnimalView> {
  return useQuery({
    queryKey: ["/api/public/animals", animalId],
    queryFn: () => apiGet<PublicAnimalView>(`/api/public/animals/${animalId}`, false),
    enabled: !!animalId,
  });
}
