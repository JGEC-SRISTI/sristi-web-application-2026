import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import {
  CalendarDays,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  ListChecks,
  LogOut,
  RefreshCw,
  Search,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase, supabaseConfigMissing } from "../../lib/supabase";
import collegeLogo from "../../assets/icons/logo1.png";
import sristiLogo from "../../assets/icons/sristi_logo.png";
import { AdminAccessGate, NavItem } from "./AdminEvents";
import "./AdminEvents.css";

type AdminSection = "registrations" | "payments" | "admins" | "settings";

type RegistrationRow = {
  id: string;
  event_id: string;
  user_id: string | null;
  team_id: string | null;
  status: "registered" | "cancelled";
  registered_at: string;
  events: { name: string; event_type: "solo" | "team" } | null;
  profiles: {
    full_name: string;
    college_name: string;
    college_roll: string;
    department: string;
  } | null;
  teams: { team_name: string; team_code: string } | null;
};

const sectionDetails: Record<
  AdminSection,
  { title: string; description: string; icon: typeof ListChecks; note: string }
> = {
  registrations: {
    title: "Registrations",
    description: "Review individual and team event registrations.",
    icon: ListChecks,
    note: "Registration management is ready to be assigned.",
  },
  payments: {
    title: "Payments",
    description: "Review payment records and verification status.",
    icon: Wallet,
    note: "Payment review and verification is ready to be assigned.",
  },
  admins: {
    title: "Admins",
    description: "Manage admin access and roles.",
    icon: Users,
    note: "Admin management is ready to be assigned.",
  },
  settings: {
    title: "Settings",
    description: "Manage festival-wide settings.",
    icon: Settings,
    note: "Festival settings are ready to be assigned.",
  },
};

export default function AdminSectionPlaceholder({
  section,
}: {
  section: AdminSection;
}) {
  const [accessState, setAccessState] = useState<
    "loading" | "config" | "signed-out" | "checking" | "denied" | "ready"
  >(supabaseConfigMissing ? "config" : "loading");
  const [role, setRole] = useState("");
  const [accessError, setAccessError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInError, setSignInError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false);
  const [registrationsError, setRegistrationsError] = useState("");
  const [registrationReload, setRegistrationReload] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");

  const visibleRegistrations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return registrations.filter((registration) => {
      const participant = registration.profiles;
      const team = registration.teams;
      const event = registration.events;
      const matchesSearch =
        !query ||
        [
          participant?.full_name,
          participant?.college_roll,
          participant?.college_name,
          participant?.department,
          team?.team_name,
          team?.team_code,
          event?.name,
        ].some((value) => value?.toLowerCase().includes(query));
      return (
        matchesSearch &&
        (statusFilter === "all" || registration.status === statusFilter) &&
        (typeFilter === "all" || event?.event_type === typeFilter) &&
        (eventFilter === "all" || registration.event_id === eventFilter)
      );
    });
  }, [eventFilter, registrations, search, statusFilter, typeFilter]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let mounted = true;
    const checkAdmin = async (user: User | null) => {
      if (!user) {
        setRole("");
        setAccessState("signed-out");
        return;
      }
      setAccessState("checking");
      const { data, error } = await client
        .from("admin_users")
        .select("role,status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      if (!mounted) return;
      if (error || !data) {
        setAccessError(
          error?.message ??
            "This signed-in account does not have an active admin role.",
        );
        setAccessState("denied");
        return;
      }
      setRole(data.role);
      setAccessState("ready");
    };
    void client.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setAccessError(error.message);
        setAccessState("denied");
        return;
      }
      void checkAdmin(data.session?.user ?? null);
    });
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => void checkAdmin(session?.user ?? null));
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [section]);

  useEffect(() => {
    if (!supabase || section !== "registrations" || accessState !== "ready") {
      return;
    }
    let mounted = true;
    setIsLoadingRegistrations(true);
    setRegistrationsError("");
    void supabase
      .from("registrations")
      .select(
        "id,event_id,user_id,team_id,status,registered_at,events(name,event_type),profiles(full_name,college_name,college_roll,department),teams(team_name,team_code)",
      )
      .order("registered_at", { ascending: false })
      .then(({ data: rows, error }) => {
        if (!mounted) return;
        setIsLoadingRegistrations(false);
        if (error) {
          setRegistrationsError(error.message);
          return;
        }
        setRegistrations((rows ?? []) as unknown as RegistrationRow[]);
      });
    return () => {
      mounted = false;
    };
  }, [accessState, registrationReload, section]);

  const registrationEvents = useMemo(() => {
    const eventMap = new Map<string, string>();
    registrations.forEach((registration) => {
      if (registration.events) {
        eventMap.set(registration.event_id, registration.events.name);
      }
    });
    return Array.from(eventMap.entries());
  }, [registrations]);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setSignInError("");
    setIsSigningIn(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsSigningIn(false);
    if (error) setSignInError(error.message);
  };
  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  if (accessState !== "ready") {
    return (
      <AdminAccessGate
        state={accessState}
        accessError={accessError}
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSignIn={signIn}
        onSignOut={signOut}
        signInError={signInError}
        isSigningIn={isSigningIn}
      />
    );
  }

  const details = sectionDetails[section];
  const Icon = details.icon;
  const isSuperAdminOnly = section === "admins";
  const canViewSection = !isSuperAdminOnly || role === "SUPER_ADMIN";
  const activeRegistrationCount = registrations.filter(
    (registration) => registration.status === "registered",
  ).length;
  const soloRegistrationCount = registrations.filter(
    (registration) => registration.events?.event_type === "solo",
  ).length;
  const teamRegistrationCount = registrations.filter(
    (registration) => registration.events?.event_type === "team",
  ).length;

  return (
    <div className="admin-panel min-h-screen bg-[#080d14] font-body text-slate-100">
      <div className="admin-shapes" aria-hidden="true">
        <span className="shape shape-circle shape-one" />
        <span className="shape shape-triangle shape-two" />
        <span className="shape shape-square shape-three" />
        <span className="shape shape-circle shape-four" />
        <span className="shape shape-triangle shape-five" />
        <span className="shape shape-square shape-six" />
      </div>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-white/10 bg-[#0b121c] px-5 py-6 lg:flex lg:flex-col">
        <Link
          to="/admin"
          viewTransition
          className="mb-10 flex flex-col items-start gap-2 text-white no-underline"
        >
          <span className="admin-brand-lockup flex h-16 w-full items-center gap-2 rounded-xl px-3">
            <img
              src={collegeLogo}
              alt="Jalpaiguri Government Engineering College"
              className="h-11 w-11 shrink-0 object-contain"
            />
            <img
              src={sristiLogo}
              alt="SRISTI"
              className="h-9 min-w-0 flex-1 object-contain object-left"
            />
          </span>
          <span className="admin-section-label">EVENT OPERATIONS</span>
        </Link>
        <nav className="space-y-2" aria-label="Admin navigation">
          <NavItem
            href="/admin"
            icon={<LayoutDashboard size={18} />}
            label="Overview"
          />
          <NavItem
            href="/admin/events"
            icon={<CalendarDays size={18} />}
            label="Events"
          />
          <NavItem
            href="/admin/registrations"
            active={section === "registrations"}
            icon={<ListChecks size={18} />}
            label="Registrations"
          />
          <NavItem
            href="/admin/payments"
            active={section === "payments"}
            icon={<Wallet size={18} />}
            label="Payments"
          />
          <NavItem
            href="/admin/admins"
            active={section === "admins"}
            icon={<Users size={18} />}
            label="Admins"
          />
        </nav>
        <div className="mt-auto space-y-2 border-t border-white/10 pt-5">
          <NavItem
            href="/admin/settings"
            active={section === "settings"}
            icon={<Settings size={18} />}
            label="Settings"
          />
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-slate-400">
            <p className="mb-1 flex items-center gap-2 font-semibold text-slate-200">
              <CircleHelp size={14} />
              Admin access
            </p>
            Actions remain protected by Supabase policies.
          </div>
        </div>
      </aside>
      <main className="min-h-screen lg:ml-64">
        <header className="flex h-16 items-center justify-between border-b border-white/10 px-5 md:px-9">
          <nav aria-label="Breadcrumb">
            <ol className="admin-breadcrumbs flex items-center gap-2 text-sm">
              <li>
                <Link to="/">SRISTI</Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight size={15} />
              </li>
              <li>
                <Link to="/admin">Admin</Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight size={15} />
              </li>
              <li aria-current="page">
                <span>{details.title}</span>
              </li>
            </ol>
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span className="grid size-8 place-items-center rounded-full bg-slate-700 font-semibold">
              {role.slice(0, 1) || "A"}
            </span>
            <span className="hidden sm:inline">
              {role.replaceAll("_", " ")}
            </span>
            <button
              onClick={signOut}
              className="ml-2 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
              aria-label="Sign out"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>
        <section className="mx-auto max-w-7xl px-5 py-8 md:px-9">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Admin workspace
          </p>
          <div className="flex items-center gap-3">
            <Icon size={26} className="text-emerald-300" />
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {details.title}
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-400">{details.description}</p>
          {!canViewSection ? (
            <div className="mt-7 rounded-xl border border-rose-300/20 bg-rose-300/5 p-5">
              <p role="alert" className="text-sm text-rose-200">
                Only a super admin can access admin management.
              </p>
            </div>
          ) : section === "registrations" ? (
            <div className="mt-7 space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <RegistrationSummary
                  label="Total registrations"
                  value={registrations.length}
                />
                <RegistrationSummary
                  label="Active"
                  value={activeRegistrationCount}
                  accent="text-emerald-300"
                />
                <RegistrationSummary
                  label="Solo / team"
                  value={`${soloRegistrationCount} / ${teamRegistrationCount}`}
                />
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 xl:flex-row">
                <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-white/10 bg-[#0b121c] px-3">
                  <Search size={17} className="shrink-0 text-slate-500" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search participant, team, roll number, event..."
                    className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
                    aria-label="Search registrations"
                  />
                </label>
                <select
                  value={eventFilter}
                  onChange={(event) => setEventFilter(event.target.value)}
                  className="h-11 rounded-lg border border-white/10 bg-[#0b121c] px-3 text-sm text-slate-200 outline-none"
                  aria-label="Filter by event"
                >
                  <option value="all">All events</option>
                  {registrationEvents.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="h-11 rounded-lg border border-white/10 bg-[#0b121c] px-3 text-sm text-slate-200 outline-none"
                  aria-label="Filter by event type"
                >
                  <option value="all">All types</option>
                  <option value="solo">Solo</option>
                  <option value="team">Team</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-11 rounded-lg border border-white/10 bg-[#0b121c] px-3 text-sm text-slate-200 outline-none"
                  aria-label="Filter by registration status"
                >
                  <option value="all">All statuses</option>
                  <option value="registered">Registered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1520]">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <h2 className="font-semibold">Event registrations</h2>
                    <p
                      className="mt-1 text-xs text-slate-500"
                      aria-live="polite"
                    >
                      {isLoadingRegistrations
                        ? "Loading registrations…"
                        : `${visibleRegistrations.length} shown`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRegistrationReload((count) => count + 1)}
                    disabled={isLoadingRegistrations}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={14}
                      className={isLoadingRegistrations ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                </div>
                {registrationsError && (
                  <p
                    role="alert"
                    className="border-b border-rose-300/20 bg-rose-300/5 px-5 py-3 text-sm text-rose-200"
                  >
                    Could not load registrations: {registrationsError}
                  </p>
                )}
                <div
                  className="overflow-x-auto"
                  aria-busy={isLoadingRegistrations}
                >
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-5 py-4 font-medium">
                          Participant / team
                        </th>
                        <th className="px-4 py-4 font-medium">Event</th>
                        <th className="px-4 py-4 font-medium">Type</th>
                        <th className="px-4 py-4 font-medium">
                          College / team code
                        </th>
                        <th className="px-4 py-4 font-medium">Registered</th>
                        <th className="px-4 py-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.07]">
                      {isLoadingRegistrations &&
                        Array.from({ length: 5 }, (_, index) => (
                          <tr
                            key={`registration-skeleton-${index}`}
                            aria-hidden="true"
                          >
                            {[
                              "w-36",
                              "w-32",
                              "w-14",
                              "w-28",
                              "w-20",
                              "w-20",
                            ].map((width, cell) => (
                              <td key={cell} className="px-4 py-5">
                                <span
                                  className={`admin-skeleton block h-4 ${width} rounded`}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      {!isLoadingRegistrations &&
                        visibleRegistrations.map((registration) => {
                          const participant = registration.profiles;
                          const team = registration.teams;
                          const event = registration.events;
                          const isTeam = event?.event_type === "team";
                          return (
                            <tr
                              key={registration.id}
                              className="transition hover:bg-white/[0.025]"
                            >
                              <td className="px-5 py-4">
                                <p className="font-semibold text-white">
                                  {isTeam
                                    ? (team?.team_name ?? "Team")
                                    : (participant?.full_name ?? "Participant")}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {isTeam
                                    ? "Team registration"
                                    : (participant?.college_roll ??
                                      "Individual registration")}
                                </p>
                              </td>
                              <td className="px-4 py-4 text-slate-200">
                                {event?.name ?? "Event unavailable"}
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs capitalize ${isTeam ? "bg-sky-400/10 text-sky-200" : "bg-violet-400/10 text-violet-200"}`}
                                >
                                  {event?.event_type ?? "unknown"}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-slate-300">
                                {isTeam
                                  ? (team?.team_code ?? "—")
                                  : (participant?.college_name ?? "—")}
                              </td>
                              <td className="px-4 py-4 text-xs text-slate-400">
                                {new Date(
                                  registration.registered_at,
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs capitalize ${registration.status === "registered" ? "bg-emerald-400/10 text-emerald-200" : "bg-slate-400/10 text-slate-300"}`}
                                >
                                  {registration.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      {!isLoadingRegistrations &&
                        visibleRegistrations.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-5 py-14 text-center text-slate-400"
                            >
                              {registrationsError
                                ? "Registration data is unavailable."
                                : search ||
                                    statusFilter !== "all" ||
                                    typeFilter !== "all" ||
                                    eventFilter !== "all"
                                  ? "No registrations match those filters."
                                  : "No registrations yet."}
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm text-slate-300">{details.note}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function RegistrationSummary({
  label,
  value,
  accent = "text-white",
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1520] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}
