import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import {
  CalendarDays,
  ClipboardCheck,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Plus,
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

type AdminSection = "attendance" | "registrations" | "payments" | "admins" | "settings";

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
  attendance: {
    title: "Attendance",
    description: "Mark attendance for registered participants and teams.",
    icon: ClipboardCheck,
    note: "Attendance management is ready.",
  },
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
    note: "Review administrator accounts and manage their access.",
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
            href="/admin/attendance"
            active={section === "attendance"}
            icon={<ClipboardCheck size={18} />}
            label="Attendance"
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
          ) : section === "attendance" ? (
            <AdminAttendanceSection />
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
          ) : section === "admins" ? (
            <AdminManagementSection />
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

type AttendanceEvent = {
  id: string;
  name: string;
  event_type: "solo" | "team";
};

type AttendanceEnrollment = {
  user_id: string | null;
  team_id: string | null;
  profiles: {
    full_name: string;
    college_roll: string;
    college_name: string;
    department: string;
  } | null;
  teams: { team_name: string; team_code: string } | null;
};

type AttendanceRecord = {
  user_id: string | null;
  team_id: string | null;
  status: "present" | "absent";
  marked_at: string;
};

type AttendanceTarget = {
  key: string;
  userId: string | null;
  teamId: string | null;
  name: string;
  secondary: string;
  status: "present" | "absent" | null;
  markedAt: string | null;
};

function AdminAttendanceSection() {
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [targets, setTargets] = useState<AttendanceTarget[]>([]);
  const [search, setSearch] = useState("");
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!supabase) {
      setIsLoadingEvents(false);
      setError("Supabase is not configured.");
      return;
    }
    let mounted = true;
    setIsLoadingEvents(true);
    void supabase
      .from("events")
      .select("id,name,event_type")
      .order("name", { ascending: true })
      .then(({ data, error: queryError }) => {
        if (!mounted) return;
        setIsLoadingEvents(false);
        if (queryError) {
          setError(queryError.message);
          return;
        }
        const rows = (data ?? []) as AttendanceEvent[];
        setEvents(rows);
        setSelectedEventId((current) => current || rows[0]?.id || "");
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!supabase || !selectedEventId) {
      setTargets([]);
      setIsLoadingTargets(false);
      return;
    }
    let mounted = true;
    setIsLoadingTargets(true);
    setError("");
    setNotice("");
    void (async () => {
      const { data: enrollmentData, error: enrollmentError } = await supabase!
        .from("registrations")
        .select("user_id,team_id,profiles(full_name,college_roll,college_name,department),teams(team_name,team_code)")
        .eq("event_id", selectedEventId)
        .eq("status", "registered");
      if (enrollmentError) {
        if (mounted) {
          setIsLoadingTargets(false);
          setError(enrollmentError.message);
        }
        return;
      }

      const { data: attendanceData, error: attendanceError } = await supabase!
        .from("attendance")
        .select("user_id,team_id,status,marked_at")
        .eq("event_id", selectedEventId);
      if (attendanceError) {
        if (mounted) {
          setIsLoadingTargets(false);
          setError(attendanceError.message);
        }
        return;
      }

      if (!mounted) return;
      const enrollments = (enrollmentData ?? []) as unknown as AttendanceEnrollment[];
      const attendance = (attendanceData ?? []) as AttendanceRecord[];
      const byTarget = new Map<string, AttendanceRecord>();
      attendance.forEach((record) => {
        const key = record.user_id ? `user:${record.user_id}` : `team:${record.team_id}`;
        byTarget.set(key, record);
      });
      setTargets(
        enrollments.flatMap((enrollment) => {
          const isTeam = enrollment.team_id !== null;
          const targetId = isTeam ? enrollment.team_id : enrollment.user_id;
          if (!targetId) return [];
          const key = `${isTeam ? "team" : "user"}:${targetId}`;
          const marked = byTarget.get(key);
          const person = enrollment.profiles;
          const team = enrollment.teams;
          return [{
            key,
            userId: isTeam ? null : enrollment.user_id,
            teamId: isTeam ? enrollment.team_id : null,
            name: isTeam ? (team?.team_name ?? "Team") : (person?.full_name ?? "Participant"),
            secondary: isTeam
              ? `Team code: ${team?.team_code ?? "—"}`
              : `${person?.college_roll ?? "No roll number"} · ${person?.department ?? "Department unavailable"}`,
            status: marked?.status ?? null,
            markedAt: marked?.marked_at ?? null,
          }];
        }),
      );
      setIsLoadingTargets(false);
    })();
    return () => {
      mounted = false;
    };
  }, [reload, selectedEventId]);

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;
  const visibleTargets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return targets.filter((target) => !query || `${target.name} ${target.secondary}`.toLowerCase().includes(query));
  }, [search, targets]);
  const presentCount = targets.filter((target) => target.status === "present").length;
  const absentCount = targets.filter((target) => target.status === "absent").length;
  const unmarkedCount = targets.filter((target) => target.status === null).length;

  const markAttendance = async (target: AttendanceTarget, status: "present" | "absent") => {
    if (!supabase || !selectedEventId) return;
    setSavingKey(target.key);
    setError("");
    setNotice("");
    const { error: actionError } = await supabase.rpc("mark_attendance", {
      p_event_id: selectedEventId,
      p_user_id: target.userId,
      p_team_id: target.teamId,
      p_status: status,
    });
    setSavingKey("");
    if (actionError) {
      setError(actionError.message);
      return;
    }
    setNotice(`${target.name}: marked ${status}.`);
    setReload((value) => value + 1);
  };

  return (
    <div className="mt-7 space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RegistrationSummary label="Registered targets" value={targets.length} />
        <RegistrationSummary label="Present" value={presentCount} accent="text-emerald-300" />
        <RegistrationSummary label="Absent" value={absentCount} accent="text-rose-200" />
        <RegistrationSummary label="Not marked" value={unmarkedCount} accent="text-amber-200" />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 md:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-white/10 bg-[#0b121c] px-3">
          <Search size={17} className="shrink-0 text-slate-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search participant, roll number, or team…" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500" aria-label="Search attendance targets" />
        </label>
        <select value={selectedEventId} onChange={(event) => setSelectedEventId(event.target.value)} disabled={isLoadingEvents || events.length === 0} className="h-11 rounded-lg border border-white/10 bg-[#0b121c] px-3 text-sm text-slate-200 outline-none md:w-72" aria-label="Choose event">
          {events.length === 0 && <option value="">No events available</option>}
          {events.map((event) => <option key={event.id} value={event.id}>{event.name} · {event.event_type}</option>)}
        </select>
      </div>

      {error && <p role="alert" className="rounded-lg border border-rose-300/20 bg-rose-300/5 px-4 py-3 text-sm text-rose-200">Attendance error: {error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-300/20 bg-emerald-300/5 px-4 py-3 text-sm text-emerald-200">{notice}</p>}

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1520]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="font-semibold">{selectedEvent ? `${selectedEvent.name} attendance` : "Event attendance"}</h2>
            <p className="mt-1 text-xs text-slate-500" aria-live="polite">{isLoadingTargets ? "Loading registered targets…" : `${visibleTargets.length} shown`}</p>
          </div>
          <button type="button" onClick={() => setReload((value) => value + 1)} disabled={isLoadingTargets || !selectedEventId} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50">
            <RefreshCw size={14} className={isLoadingTargets ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto" aria-busy={isLoadingTargets}>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-400">
              <tr><th className="px-5 py-4 font-medium">Participant / team</th><th className="px-4 py-4 font-medium">Target</th><th className="px-4 py-4 font-medium">Attendance</th><th className="px-5 py-4 text-right font-medium">Mark</th></tr>
            </thead>
            <tbody className="divide-y divide-white/[0.07]">
              {isLoadingTargets && Array.from({ length: 4 }, (_, index) => (
                <tr key={`attendance-skeleton-${index}`} aria-hidden="true">{["w-40", "w-32", "w-20", "w-28"].map((width, cell) => <td key={cell} className="px-4 py-5"><span className={`admin-skeleton block h-4 ${width} rounded`} /></td>)}</tr>
              ))}
              {!isLoadingTargets && visibleTargets.map((target) => (
                <tr key={target.key} className="transition hover:bg-white/[0.025]">
                  <td className="px-5 py-4"><p className="font-semibold text-white">{target.name}</p><p className="mt-1 text-xs text-slate-500">{target.secondary}</p></td>
                  <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${target.teamId ? "bg-sky-400/10 text-sky-200" : "bg-violet-400/10 text-violet-200"}`}>{target.teamId ? "Team" : "Individual"}</span></td>
                  <td className="px-4 py-4">
                    {target.status ? <><span className={`rounded-full px-2.5 py-1 text-xs capitalize ${target.status === "present" ? "bg-emerald-400/10 text-emerald-200" : "bg-rose-400/10 text-rose-200"}`}>{target.status}</span><p className="mt-1 text-[11px] text-slate-500">{target.markedAt ? new Date(target.markedAt).toLocaleString() : ""}</p></> : <span className="text-xs text-amber-200">Not marked</span>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => void markAttendance(target, "present")}
                        disabled={savingKey === target.key || isLoadingTargets}
                        aria-pressed={target.status === "present"}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1520] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${target.status === "present" ? "border-emerald-200 bg-emerald-300 text-slate-950 shadow-md shadow-emerald-950/30 hover:bg-emerald-200" : "border-emerald-300/25 text-emerald-200 hover:border-emerald-200 hover:bg-emerald-300 hover:text-slate-950"}`}
                      >
                        {savingKey === target.key ? "Saving…" : target.status === "present" ? "Present ✓" : "Present"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void markAttendance(target, "absent")}
                        disabled={savingKey === target.key || isLoadingTargets}
                        aria-pressed={target.status === "absent"}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1520] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${target.status === "absent" ? "border-rose-200 bg-rose-300 text-slate-950 shadow-md shadow-rose-950/30 hover:bg-rose-200" : "border-rose-300/25 text-rose-200 hover:border-rose-200 hover:bg-rose-300 hover:text-slate-950"}`}
                      >
                        {target.status === "absent" ? "Absent ✓" : "Absent"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoadingTargets && visibleTargets.length === 0 && <tr><td colSpan={4} className="px-5 py-14 text-center text-slate-400">{error ? "Attendance targets could not be loaded." : search ? "No registered participants or teams match this search." : "No registered participants or teams for this event yet."}</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="border-t border-white/10 px-5 py-3 text-xs text-slate-500">Solo events are marked per participant. Team events are marked once per registered team, as enforced by the database.</p>
      </div>
    </div>
  );
}

type AdminRecord = {
  id: string;
  user_id: string;
  role: "ADMIN" | "SUPER_ADMIN";
  status: "active" | "inactive";
  created_at: string;
};

function AdminManagementSection() {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, AdminRecord["role"]>>({});
  const [userId, setUserId] = useState("");
  const [newRole, setNewRole] = useState<AdminRecord["role"]>("ADMIN");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      setError("Supabase is not configured.");
      return;
    }
    let mounted = true;
    setIsLoading(true);
    setError("");
    void supabase
      .from("admin_users")
      .select("id,user_id,role,status,created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!mounted) return;
        setIsLoading(false);
        if (queryError) {
          setError(queryError.message);
          return;
        }
        const rows = (data ?? []) as AdminRecord[];
        setAdmins(rows);
        setRoleDrafts(Object.fromEntries(rows.map((admin) => [admin.id, admin.role])));
      });
    return () => {
      mounted = false;
    };
  }, [reload]);

  const runAction = async (
    action: () => Promise<{ error: { message: string } | null }>,
    successMessage: string,
  ) => {
    setError("");
    setNotice("");
    setIsSaving(true);
    const { error: actionError } = await action();
    setIsSaving(false);
    if (actionError) {
      setError(actionError.message);
      return false;
    }
    setNotice(successMessage);
    setReload((value) => value + 1);
    return true;
  };

  const addAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    const normalizedId = userId.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalizedId)) {
      setError("Enter a valid Auth user UUID.");
      return;
    }
    const succeeded = await runAction(
      async () => await supabase!.rpc("create_admin", { p_user_id: normalizedId, p_role: newRole }),
      "Admin access granted.",
    );
    if (succeeded) setUserId("");
  };

  const saveRole = async (admin: AdminRecord) => {
    if (!supabase) return;
    const selectedRole = roleDrafts[admin.id] ?? admin.role;
    if (selectedRole === admin.role) return;
    await runAction(
      async () =>
        await supabase!.rpc("update_admin", {
          p_admin_id: admin.id,
          p_role: selectedRole,
          p_status: admin.status,
        }),
      "Admin role updated.",
    );
  };

  const changeStatus = async (admin: AdminRecord) => {
    if (!supabase) return;
    if (admin.status === "active") {
      if (!window.confirm("Deactivate this admin account? They will lose access immediately.")) return;
      await runAction(
        async () => await supabase!.rpc("deactivate_admin", { p_admin_id: admin.id }),
        "Admin access deactivated.",
      );
      return;
    }
    await runAction(
      async () =>
        await supabase!.rpc("update_admin", {
          p_admin_id: admin.id,
          p_role: admin.role,
          p_status: "active",
        }),
      "Admin access reactivated.",
    );
  };

  const activeCount = admins.filter((admin) => admin.status === "active").length;
  const superAdminCount = admins.filter((admin) => admin.role === "SUPER_ADMIN" && admin.status === "active").length;

  return (
    <div className="mt-7 space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <RegistrationSummary label="Total admin accounts" value={admins.length} />
        <RegistrationSummary label="Active admins" value={activeCount} accent="text-emerald-300" />
        <RegistrationSummary label="Active super admins" value={superAdminCount} accent="text-violet-200" />
      </div>

      <form onSubmit={addAdmin} className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-end">
        <label className="block text-xs font-medium text-slate-300">
          Existing Supabase Auth user ID
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#0b121c] px-3 font-mono text-xs text-slate-100 outline-none focus:border-emerald-300/50"
            aria-label="Existing Supabase Auth user ID"
            required
          />
        </label>
        <label className="block text-xs font-medium text-slate-300">
          Role
          <select value={newRole} onChange={(event) => setNewRole(event.target.value as AdminRecord["role"])} className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#0b121c] px-3 text-sm text-slate-100 outline-none">
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super admin</option>
          </select>
        </label>
        <button type="submit" disabled={isSaving || !userId.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50">
          <Plus size={16} /> Grant access
        </button>
        <p className="text-xs leading-5 text-slate-500 md:col-span-3">
          The account must already exist in Supabase Authentication. Copy its user ID from the local or project Auth Users page. This form grants admin access; it does not create or invite an Auth account.
        </p>
      </form>

      {error && <p role="alert" className="rounded-lg border border-rose-300/20 bg-rose-300/5 px-4 py-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-300/20 bg-emerald-300/5 px-4 py-3 text-sm text-emerald-200">{notice}</p>}

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1520]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="font-semibold">Administrator accounts</h2>
            <p className="mt-1 text-xs text-slate-500" aria-live="polite">{isLoading ? "Loading admins…" : `${admins.length} accounts`}</p>
          </div>
          <button type="button" onClick={() => setReload((value) => value + 1)} disabled={isLoading || isSaving} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50">
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto" aria-busy={isLoading}>
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-4 font-medium">Auth user ID</th>
                <th className="px-4 py-4 font-medium">Role</th>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-4 py-4 font-medium">Added</th>
                <th className="px-5 py-4 text-right font-medium">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.07]">
              {isLoading && Array.from({ length: 3 }, (_, index) => (
                <tr key={`admin-skeleton-${index}`} aria-hidden="true">
                  {["w-48", "w-24", "w-20", "w-24", "w-24"].map((width, cell) => <td key={cell} className="px-4 py-5"><span className={`admin-skeleton block h-4 ${width} rounded`} /></td>)}
                </tr>
              ))}
              {!isLoading && admins.map((admin) => (
                <tr key={admin.id} className="transition hover:bg-white/[0.025]">
                  <td className="px-5 py-4 font-mono text-xs text-slate-300">{admin.user_id}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <select value={roleDrafts[admin.id] ?? admin.role} onChange={(event) => setRoleDrafts((drafts) => ({ ...drafts, [admin.id]: event.target.value as AdminRecord["role"] }))} className="h-9 rounded-lg border border-white/10 bg-[#0b121c] px-2 text-xs text-slate-200 outline-none" aria-label={`Role for ${admin.user_id}`}>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super admin</option>
                      </select>
                      {(roleDrafts[admin.id] ?? admin.role) !== admin.role && <button type="button" onClick={() => void saveRole(admin)} disabled={isSaving} className="text-xs font-semibold text-emerald-200 hover:text-emerald-100 disabled:opacity-50">Save</button>}
                    </div>
                  </td>
                  <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs capitalize ${admin.status === "active" ? "bg-emerald-400/10 text-emerald-200" : "bg-slate-400/10 text-slate-300"}`}>{admin.status}</span></td>
                  <td className="px-4 py-4 text-xs text-slate-400">{new Date(admin.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-right"><button type="button" onClick={() => void changeStatus(admin)} disabled={isSaving} className={`rounded-lg border px-3 py-2 text-xs font-medium transition disabled:opacity-50 ${admin.status === "active" ? "border-rose-300/20 text-rose-200 hover:bg-rose-300/10" : "border-emerald-300/20 text-emerald-200 hover:bg-emerald-300/10"}`}>{admin.status === "active" ? "Deactivate" : "Reactivate"}</button></td>
                </tr>
              ))}
              {!isLoading && admins.length === 0 && <tr><td colSpan={5} className="px-5 py-14 text-center text-slate-400">No admin accounts found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
