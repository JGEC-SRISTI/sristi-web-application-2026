import { supabase } from "./supabase";

export type AdminAccessResult = {
  role: string | null;
  error: string | null;
};

const CACHE_DURATION_MS = 30_000;

const cachedRoles = new Map<
  string,
  { role: string; expiresAt: number }
>();
const pendingChecks = new Map<string, Promise<AdminAccessResult>>();

export function clearAdminAccessCache(userId?: string) {
  if (userId) {
    cachedRoles.delete(userId);
    pendingChecks.delete(userId);
    return;
  }

  cachedRoles.clear();
  pendingChecks.clear();
}

export function getCachedActiveAdminRole(userId: string) {
  const cached = cachedRoles.get(userId);
  if (!cached || cached.expiresAt <= Date.now()) {
    cachedRoles.delete(userId);
    return null;
  }
  return cached.role;
}

export function getActiveAdminRole(userId: string) {
  const cachedRole = getCachedActiveAdminRole(userId);
  if (cachedRole) {
    return Promise.resolve<AdminAccessResult>({ role: cachedRole, error: null });
  }

  const pending = pendingChecks.get(userId);
  if (pending) return pending;

  const check = (async (): Promise<AdminAccessResult> => {
    if (!supabase) {
      return { role: null, error: "Supabase is not configured." };
    }

    const { data, error } = await supabase
      .from("admin_users")
      .select("role,status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (error) return { role: null, error: error.message };
    if (!data) {
      return {
        role: null,
        error: "This signed-in account does not have an active admin role.",
      };
    }

    cachedRoles.set(userId, {
      role: data.role,
      expiresAt: Date.now() + CACHE_DURATION_MS,
    });
    return { role: data.role, error: null };
  })();

  pendingChecks.set(userId, check);
  const clearPending = () => {
    if (pendingChecks.get(userId) === check) pendingChecks.delete(userId);
  };
  void check.then(clearPending, clearPending);

  return check;
}
