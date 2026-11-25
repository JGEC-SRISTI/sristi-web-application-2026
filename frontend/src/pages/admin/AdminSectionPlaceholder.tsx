import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import {
  CalendarDays,
  Check,
  CircleCheck,
  ClipboardCheck,
  ChevronRight,
  CircleHelp,
  Download,
  Copy,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase, supabaseConfigMissing } from "../../lib/supabase";
import {
  clearAdminAccessCache,
  getActiveAdminRole,
  getCachedActiveAdminRole,
} from "../../lib/adminAccess";
import collegeLogo from "../../assets/icons/logo1.png";
import sristiLogo from "../../assets/icons/sristi_logo.png";
import { AdminAccessGate, NavItem } from "./AdminEvents";
import "./AdminEvents.css";

type AdminSection =
  | "attendance"
  | "results"
  | "registrations"
  | "payments"
  | "admins"
  | "settings";

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
  teams: { team_name: string; team_code: string; leader_id: string } | null;
};

type TeamMemberExportRow = {
  team_id: string;
  user_id: string;
  joined_at: string;
  profiles: {
    full_name: string;
    college_roll: string;
    college_name: string;
    department: string;
  } | null;
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
  results: {
    title: "Results & leaderboard",
    description:
      "Declare event winners and control public leaderboard visibility.",
    icon: Trophy,
    note: "Manage event results and leaderboard publication.",
  },
  registrations: {
    title: "Registrations",
    description: "Review individual and team event registrations.",
    icon: ListChecks,
    note: "Registration management is ready to be assigned.",
  },
  payments: {
    title: "Payments",
    description:
      "Review payment records, confirm offline payments, and issue participant verification codes.",
    icon: Wallet,
    note: "Payment review and verification is ready.",
  },
  admins: {
    title: "Admins",
    description: "Manage admin access and roles.",
    icon: Users,
    note: "Review administrator accounts and manage their access.",
  },
  settings: {
    title: "Settings",
    description:
      "Set the festival name and registration fee used by payment verification.",
    icon: Settings,
    note: "Festival settings are ready.",
  },
};

export default function AdminSectionPlaceholder({
  section,
  paymentPage,
}: {
  section: AdminSection;
  paymentPage?: "verification" | "records";
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
  const [isExportingRegistrations, setIsExportingRegistrations] = useState(false);
  const [registrationExportError, setRegistrationExportError] = useState("");
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
      const cachedRole = getCachedActiveAdminRole(user.id);
      if (cachedRole) {
        setRole(cachedRole);
        setAccessState("ready");
      } else {
        setAccessState("checking");
      }
      const { role: activeRole, error } = await getActiveAdminRole(user.id);
      if (!mounted) return;
      if (error || !activeRole) {
        setAccessError(error ?? "This account does not have an active admin role.");
        setAccessState("denied");
        return;
      }
      setRole(activeRole);
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
      queueMicrotask(() => {
        if (!session) clearAdminAccessCache();
        void checkAdmin(session?.user ?? null);
      });
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
        "id,event_id,user_id,team_id,status,registered_at,events(name,event_type),profiles(full_name,college_name,college_roll,department),teams(team_name,team_code,leader_id)",
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

  const exportRegistrations = async () => {
    if (!supabase || isExportingRegistrations) return;
    const exportableRegistrations = visibleRegistrations
      .filter((registration) => registration.events)
      .sort((a, b) => {
        const eventOrder = (a.events?.name ?? "").localeCompare(b.events?.name ?? "");
        const nameA = a.teams?.team_name ?? a.profiles?.full_name ?? "";
        const nameB = b.teams?.team_name ?? b.profiles?.full_name ?? "";
        return eventOrder || nameA.localeCompare(nameB);
      });

    if (exportableRegistrations.length === 0) return;

    setIsExportingRegistrations(true);
    setRegistrationExportError("");
    try {
      const teamIds = [
        ...new Set(
          exportableRegistrations
            .filter((row) => row.events?.event_type === "team" && row.team_id)
            .map((row) => row.team_id!),
        ),
      ];
      let memberRows: TeamMemberExportRow[] = [];
      if (teamIds.length > 0) {
        const { data, error } = await supabase
          .from("team_members")
          .select(
            "team_id,user_id,joined_at,profiles(full_name,college_roll,college_name,department)",
          )
          .in("team_id", teamIds)
          .order("joined_at", { ascending: true });

        if (error) throw error;
        memberRows = (data ?? []) as unknown as TeamMemberExportRow[];
      }

      const membersByTeam = new Map<string, TeamMemberExportRow[]>();
      memberRows.forEach((member) => {
        const members = membersByTeam.get(member.team_id) ?? [];
        members.push(member);
        membersByTeam.set(member.team_id, members);
      });

      const headers = [
        "Event",
        "Row type",
        "Team name",
        "Team code",
        "Participant name",
        "College roll number",
        "College",
        "Department",
        "Team leader",
        "Registration status",
        "Registered at",
      ];
      const rows: Array<Array<string | number | null>> = [];
      const registrationsByEvent = new Map<string, RegistrationRow[]>();
      exportableRegistrations.forEach((registration) => {
        const eventRows = registrationsByEvent.get(registration.event_id) ?? [];
        eventRows.push(registration);
        registrationsByEvent.set(registration.event_id, eventRows);
      });

      registrationsByEvent.forEach((eventRows) => {
        const eventName = eventRows[0]?.events?.name ?? "";
        rows.push([eventName, "EVENT", "", "", "", "", "", "", "", "", ""]);

        eventRows.forEach((registration) => {
          if (registration.events?.event_type !== "team") {
            const participant = registration.profiles;
            rows.push([
              "",
              "  SOLO PARTICIPANT",
              "",
              "",
              participant?.full_name ?? "",
              participant?.college_roll ?? "",
              participant?.college_name ?? "",
              participant?.department ?? "",
              "",
              registration.status,
              registration.registered_at,
            ]);
            return;
          }

          const team = registration.teams;
          const members = registration.team_id
            ? membersByTeam.get(registration.team_id) ?? []
            : [];
          rows.push([
            "",
            "  TEAM",
            team?.team_name ?? "",
            team?.team_code ?? "",
            "",
            "",
            "",
            "",
            "",
            registration.status,
            registration.registered_at,
          ]);
          members.forEach((member) => {
            rows.push([
              "",
              "",
              "",
              "    TEAM MEMBER",
              member.profiles?.full_name ?? "",
              member.profiles?.college_roll ?? "",
              member.profiles?.college_name ?? "",
              member.profiles?.department ?? "",
              team ? (member.user_id === team.leader_id ? "Yes" : "No") : "",
              "",
              "",
            ]);
          });
        });
      });

      const csvCell = (value: string | number | null) => {
        const text = String(value ?? "");
        const safeText = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
        return `"${safeText.replace(/"/g, '""')}"`;
      };
      const csv = [headers, ...rows]
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n");
      const blob = new Blob([`\uFEFF${csv}`], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const selectedEventName = eventFilter === "all"
        ? "all-events"
        : registrations.find((row) => row.event_id === eventFilter)?.events?.name ?? "event";
      const filenameEvent = selectedEventName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      link.download = `sristi-${filenameEvent}-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setRegistrationExportError(
        error instanceof Error
          ? error.message
          : "Could not export registrations.",
      );
    } finally {
      setIsExportingRegistrations(false);
    }
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
            href="/admin/results"
            active={section === "results"}
            icon={<Trophy size={18} />}
            label="Results"
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
          ) : section === "results" ? (
            <AdminResultsSection />
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
                  <div className="ml-auto flex flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => void exportRegistrations()}
                      disabled={
                        isExportingRegistrations ||
                        isLoadingRegistrations ||
                        !visibleRegistrations.some((registration) => Boolean(registration.events))
                      }
                      title="Downloads a CSV with solo participants and team rosters, following the current filters."
                      className="admin-team-export-button inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <Download size={14} />
                      {isExportingRegistrations ? "Preparing…" : "Download CSV"}
                    </button>
                    <p className="text-right text-[10px] text-slate-500">
                      Follows filters; choose an event for a separate file.
                    </p>
                  </div>
                </div>
                {registrationExportError && (
                  <p
                    role="alert"
                    className="border-b border-rose-300/20 bg-rose-300/5 px-5 py-3 text-sm text-rose-200"
                  >
                    Could not export registrations: {registrationExportError}
                  </p>
                )}
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
          ) : section === "payments" ? (
            <AdminPaymentsSection page={paymentPage ?? "verification"} />
          ) : section === "settings" ? (
            <AdminFestSettingsSection />
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

type ResultEvent = { id: string; name: string; event_type: "solo" | "team" };
type ResultRow = {
  id: string;
  event_id: string;
  user_id: string | null;
  team_id: string | null;
  position: number;
  declared_at: string;
  profiles: { full_name: string; college_roll: string } | null;
  teams: { team_name: string; team_code: string } | null;
};
type ResultCandidate = {
  id: string;
  name: string;
  detail: string;
  userId: string | null;
  teamId: string | null;
};

function AdminResultsSection() {
  const [events, setEvents] = useState<ResultEvent[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [candidates, setCandidates] = useState<ResultCandidate[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [position, setPosition] = useState("1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    setLoading(true);
    setError("");
    void Promise.all([
      supabase.from("events").select("id,name,event_type").order("name"),
      supabase
        .from("results")
        .select(
          "id,event_id,user_id,team_id,position,declared_at,profiles(full_name,college_roll),teams(team_name,team_code)",
        )
        .order("position"),
    ]).then(([eventResponse, resultResponse]) => {
      if (!active) return;
      setLoading(false);
      const queryError = eventResponse.error ?? resultResponse.error;
      if (queryError) {
        setError(queryError.message);
        return;
      }
      const loadedEvents = (eventResponse.data ?? []) as ResultEvent[];
      setEvents(loadedEvents);
      setResults((resultResponse.data ?? []) as unknown as ResultRow[]);
      setSelectedEvent((current) => current || loadedEvents[0]?.id || "");
    });
    return () => {
      active = false;
    };
  }, [reload]);

  useEffect(() => {
    if (!supabase || !selectedEvent) {
      setCandidates([]);
      return;
    }
    let active = true;
    const event = events.find((item) => item.id === selectedEvent);
    if (!event) return;
    void supabase
      .from("registrations")
      .select(
        "user_id,team_id,profiles(full_name,college_roll),teams(team_name,team_code)",
      )
      .eq("event_id", selectedEvent)
      .eq("status", "registered")
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) {
          setError(queryError.message);
          setCandidates([]);
          return;
        }
        const options = (data ?? []).flatMap((row: any): ResultCandidate[] => {
          if (event.event_type === "team" && row.team_id)
            return [
              {
                id: row.team_id,
                name: row.teams?.team_name ?? "Team",
                detail: row.teams?.team_code ?? "Registered team",
                userId: null,
                teamId: row.team_id,
              },
            ];
          if (event.event_type === "solo" && row.user_id)
            return [
              {
                id: row.user_id,
                name: row.profiles?.full_name ?? "Participant",
                detail: row.profiles?.college_roll ?? "Registered participant",
                userId: row.user_id,
                teamId: null,
              },
            ];
          return [];
        });
        setCandidates(options);
        setCandidateId("");
      });
    return () => {
      active = false;
    };
  }, [events, selectedEvent]);

  const eventResults = results
    .filter((row) => row.event_id === selectedEvent)
    .sort((a, b) => a.position - b.position);
  const usedPlaces = new Set(eventResults.map((row) => row.position));
  const availablePlaces = [1, 2, 3].filter((place) => !usedPlaces.has(place));
  const eligibleCandidates = candidates.filter(
    (candidate) =>
      !eventResults.some((row) =>
        candidate.userId
          ? row.user_id === candidate.userId
          : row.team_id === candidate.teamId,
      ),
  );

  const recordPlacement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    const candidate = candidates.find((item) => item.id === candidateId);
    if (!candidate) return;
    setSaving(true);
    setError("");
    setNotice("");
    const { error: rpcError } = await supabase.rpc("declare_result", {
      p_event_id: selectedEvent,
      p_user_id: candidate.userId,
      p_team_id: candidate.teamId,
      p_position: Number(position),
    });
    setSaving(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setNotice(
      `${placeName(Number(position))} place recorded for ${candidate.name}.`,
    );
    setCandidateId("");
    setReload((count) => count + 1);
  };

  const removePlacement = async (result: ResultRow) => {
    if (
      !supabase ||
      !window.confirm(`Remove the ${placeName(result.position)} place result?`)
    )
      return;
    setError("");
    setNotice("");
    const { error: deleteError } = await supabase
      .from("results")
      .delete()
      .eq("id", result.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setNotice("Result removed. That place can now be assigned again.");
    setReload((count) => count + 1);
  };

  return (
    <div className="mt-7 space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <RegistrationSummary
          label="Events with results"
          value={new Set(results.map((row) => row.event_id)).size}
        />
        <RegistrationSummary
          label="Placements recorded"
          value={results.length}
          accent="text-emerald-300"
        />
        <RegistrationSummary
          label="Public results"
          value="Paused"
          accent="text-slate-300"
        />
      </div>
      <div className="rounded-xl border border-sky-300/20 bg-sky-300/[0.06] p-5 text-sm leading-6 text-sky-100">
        Public results are paused while the participant-facing leaderboard is
        being planned. Placements recorded here remain available to admins.
      </div>
      {(error || notice) && (
        <p
          role={error ? "alert" : "status"}
          className={`rounded-lg border px-4 py-3 text-sm ${error ? "border-rose-300/30 bg-rose-50 text-rose-800" : "border-emerald-300/30 bg-emerald-50 text-emerald-900"}`}
        >
          {error || notice}
        </p>
      )}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1520]">
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Event results</h2>
            <p className="mt-1 text-xs text-slate-500">
              Record up to three placements for each event.
            </p>
          </div>
          <div className="flex gap-2">
            <select
              aria-label="Select event"
              value={selectedEvent}
              onChange={(event) => setSelectedEvent(event.target.value)}
              className="h-10 min-w-48 rounded-lg border border-white/10 bg-[#0b121c] px-3 text-sm text-slate-200"
            >
              <option value="">Select event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} · {event.event_type}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setReload((count) => count + 1)}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
        <form
          onSubmit={recordPlacement}
          className="grid gap-3 border-b border-white/10 p-5 md:grid-cols-[1fr_150px_auto]"
        >
          <select
            required
            aria-label="Registered participant or team"
            value={candidateId}
            onChange={(event) => setCandidateId(event.target.value)}
            disabled={
              !selectedEvent || eligibleCandidates.length === 0 || loading
            }
            className="h-11 rounded-lg border border-white/10 bg-[#0b121c] px-3 text-sm text-slate-200"
          >
            <option value="">
              {!selectedEvent
                ? "Choose an event first"
                : eligibleCandidates.length
                  ? "Choose registered participant / team"
                  : candidates.length
                    ? "All eligible candidates already have a place"
                    : "No registered participants / teams"}
            </option>
            {eligibleCandidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name} · {candidate.detail}
              </option>
            ))}
          </select>
          <select
            aria-label="Placement"
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            className="h-11 rounded-lg border border-white/10 bg-[#0b121c] px-3 text-sm text-slate-200"
          >
            {(availablePlaces.length ? availablePlaces : [1, 2, 3]).map(
              (place) => (
                <option key={place} value={place}>
                  {placeName(place)} place
                </option>
              ),
            )}
          </select>
          <button
            type="submit"
            disabled={
              saving || loading || !candidateId || availablePlaces.length === 0
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200/40 bg-emerald-200 px-4 py-2 text-sm font-bold text-emerald-950 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trophy size={16} />
            {saving ? "Recording…" : "Record placement"}
          </button>
        </form>
        {loading ? (
          <div className="space-y-3 p-5" aria-busy="true">
            {[0, 1, 2].map((item) => (
              <div key={item} className="admin-skeleton h-14 rounded-lg" />
            ))}
          </div>
        ) : !selectedEvent ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">
            Create an event first to record results.
          </p>
        ) : (
          <div className="divide-y divide-white/10">
            {[1, 2, 3].map((place) => {
              const row = eventResults.find((item) => item.position === place);
              const name = row?.profiles?.full_name ?? row?.teams?.team_name;
              const detail =
                row?.profiles?.college_roll ?? row?.teams?.team_code;
              return (
                <div
                  key={place}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-xl font-bold ${place === 1 ? "bg-amber-200 text-amber-950" : "bg-slate-200 text-slate-800"}`}
                    >
                      {place}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {name ?? `${placeName(place)} place not assigned`}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {row
                          ? `${detail ?? (row.user_id ? "Participant" : "Team")} · declared ${new Date(row.declared_at).toLocaleDateString()}`
                          : "Available placement"}
                      </p>
                    </div>
                  </div>
                  {row && (
                    <button
                      type="button"
                      onClick={() => void removePlacement(row)}
                      className="rounded-lg border border-rose-300/50 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 transition hover:bg-rose-100"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <p className="text-xs leading-5 text-slate-500">
        Supabase verifies the participant or team is registered for the event
        and prevents duplicate placements.
      </p>
    </div>
  );
}

function placeName(place: number) {
  return place === 1 ? "1st" : place === 2 ? "2nd" : "3rd";
}

type PaymentRecordRow = {
  id: string;
  user_id: string;
  amount: number;
  payment_method: "offline" | "razorpay";
  status: "pending" | "verified" | "rejected";
  payment_reference: string | null;
  verified_at: string | null;
  created_at: string;
};

type PaymentParticipant = {
  id: string;
  full_name: string;
  college_roll: string;
  college_name: string;
  department: string;
  phone: string;
};

type PaymentCode = {
  id: string;
  code: string;
  status: "issued" | "used" | "revoked";
  created_at: string;
};

type PaymentView = PaymentRecordRow & {
  participant: PaymentParticipant | null;
  code: PaymentCode | null;
};

function AdminPaymentsSection({
  page,
}: {
  page: "verification" | "records";
}) {
  const [payments, setPayments] = useState<PaymentView[]>([]);
  const [participants, setParticipants] = useState<PaymentParticipant[]>([]);
  const [search, setSearch] = useState("");
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantPage, setParticipantPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [paymentToast, setPaymentToast] = useState("");
  const [reload, setReload] = useState(0);
  const [verifyParticipant, setVerifyParticipant] =
    useState<PaymentParticipant | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [codePayment, setCodePayment] = useState<PaymentView | null>(null);
  const [customCode, setCustomCode] = useState("");
  const [isIssuingCode, setIsIssuingCode] = useState(false);
  const [issuedCode, setIssuedCode] = useState("");
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  useEffect(() => {
    if (!paymentToast) return;
    const timeout = window.setTimeout(() => setPaymentToast(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [paymentToast]);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      setError("Supabase is not configured.");
      return;
    }
    let mounted = true;
    setIsLoading(true);
    setError("");
    void (async () => {
      const { data: paymentRows, error: paymentError } = await supabase
        .from("payment_records")
        .select(
          "id,user_id,amount,payment_method,status,payment_reference,verified_at,created_at",
        )
        .order("created_at", { ascending: false });
      if (!mounted) return;
      if (paymentError) {
        setError(paymentError.message);
        setPayments([]);
        setIsLoading(false);
        return;
      }
      const rows = (paymentRows ?? []) as PaymentRecordRow[];
      if (rows.length === 0) {
        setPayments([]);
        setIsLoading(false);
        return;
      }
      const userIds = [...new Set(rows.map((row) => row.user_id))];
      const paymentIds = rows.map((row) => row.id);
      const [{ data: profileRows }, { data: codeRows }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,full_name,college_roll,college_name,department,phone")
          .in("id", userIds),
        supabase
          .from("verification_codes")
          .select("id,code,status,created_at,payment_id")
          .in("payment_id", paymentIds)
          .order("created_at", { ascending: false }),
      ]);
      if (!mounted) return;
      const profiles = new Map(
        ((profileRows ?? []) as PaymentParticipant[]).map((row) => [
          row.id,
          row,
        ]),
      );
      const codesByPayment = new Map<string, PaymentCode>();
      for (const row of (codeRows ?? []) as (PaymentCode & {
        payment_id: string;
      })[]) {
        if (!codesByPayment.has(row.payment_id)) {
          codesByPayment.set(row.payment_id, {
            id: row.id,
            code: row.code,
            status: row.status,
            created_at: row.created_at,
          });
        }
      }
      setPayments(
        rows.map((row) => ({
          ...row,
          participant: profiles.get(row.user_id) ?? null,
          code: codesByPayment.get(row.id) ?? null,
        })),
      );
      setIsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [reload]);

  const loadParticipants = useCallback(async () => {
    if (!supabase) return;
    setIsLoadingParticipants(true);
    const { data, error: queryError } = await supabase
      .from("profiles")
      .select("id,full_name,college_roll,college_name,department,phone")
      .order("full_name", { ascending: true });
    setIsLoadingParticipants(false);
    if (queryError) {
      setError(queryError.message);
      return;
    }
    setParticipants((data ?? []) as PaymentParticipant[]);
  }, []);

  useEffect(() => {
    if (page === "verification") void loadParticipants();
  }, [loadParticipants, page]);

  useEffect(() => {
    try {
      window.localStorage.setItem("sristi-admin-payments-last-page", page);
    } catch {
      // The URL still preserves the selected page when storage is unavailable.
    }
  }, [page]);

  const visiblePayments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return payments.filter((payment) => {
      const participant = payment.participant;
      const matchesQuery =
        !query ||
        [
          participant?.full_name,
          participant?.college_roll,
          participant?.college_name,
          participant?.phone,
          payment.payment_reference,
          payment.payment_method,
        ].some((value) => value?.toLowerCase().includes(query));
      return (
        matchesQuery &&
        (statusFilter === "all" || payment.status === statusFilter)
      );
    });
  }, [payments, search, statusFilter]);

  const matchingParticipants = useMemo(() => {
    const query = participantSearch.trim().toLowerCase();
    const alreadyVerified = new Set(
      payments
        .filter((row) => row.status === "verified")
        .map((row) => row.user_id),
    );
    return participants.filter((participant) => {
      const matchesQuery =
        !query ||
        [
          participant.full_name,
          participant.college_roll,
          participant.college_name,
          participant.phone,
        ].some((value) => value.toLowerCase().includes(query));
      return matchesQuery && !alreadyVerified.has(participant.id);
    });
  }, [participants, payments, participantSearch]);

  const participantPageSize = 10;
  const participantPageCount = Math.ceil(
    matchingParticipants.length / participantPageSize,
  );
  const visibleParticipants = matchingParticipants.slice(
    participantPage * participantPageSize,
    (participantPage + 1) * participantPageSize,
  );

  useEffect(() => {
    const lastPage = Math.max(0, participantPageCount - 1);
    if (participantPage > lastPage) setParticipantPage(lastPage);
  }, [participantPage, participantPageCount]);

  const verifyOfflinePayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !verifyParticipant) return;
    setIsVerifying(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("verify_offline_payment", {
      p_user_id: verifyParticipant.id,
      p_payment_reference: paymentReference.trim() || null,
    });
    setIsVerifying(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setNotice("");
    setPaymentToast(
      `Cash payment verified for ${verifyParticipant.full_name}.`,
    );
    setVerifyParticipant(null);
    setPaymentReference("");
    setReload((value) => value + 1);
  };

  const issueCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !codePayment) return;
    const normalizedCustomCode = customCode.trim().toUpperCase();
    if (normalizedCustomCode && !/^[A-Z0-9]{6}$/.test(normalizedCustomCode)) {
      setError(
        "Use exactly 6 characters from A–Z and 0–9, or leave blank for an automatic code.",
      );
      return;
    }
    setIsIssuingCode(true);
    setError("");
    setIssuedCode("");
    const { data: codeId, error: rpcError } = await supabase.rpc(
      "issue_verification_code",
      {
        p_user_id: codePayment.user_id,
        p_payment_id: codePayment.id,
        p_custom_code: normalizedCustomCode || null,
      },
    );
    if (rpcError || !codeId) {
      setIsIssuingCode(false);
      setError(rpcError?.message ?? "Could not issue a verification code.");
      return;
    }
    const { data: codeRow, error: codeError } = await supabase
      .from("verification_codes")
      .select("code")
      .eq("id", codeId)
      .single();
    setIsIssuingCode(false);
    if (codeError || !codeRow) {
      setError(
        codeError?.message ?? "The code was issued but could not be loaded.",
      );
      setReload((value) => value + 1);
      return;
    }
    setIssuedCode(codeRow.code);
    setIsCodeCopied(false);
    setNotice(
      `Verification code issued for ${codePayment.participant?.full_name ?? "participant"}.`,
    );
    setCustomCode("");
    setReload((value) => value + 1);
  };

  const copyIssuedCode = async () => {
    if (!issuedCode) return;
    try {
      await navigator.clipboard.writeText(issuedCode);
      setIsCodeCopied(true);
    } catch {
      setError("Could not copy the code. Select it and copy manually.");
    }
  };

  const pendingCount = payments.filter(
    (payment) => payment.status === "pending",
  ).length;
  const verifiedCount = payments.filter(
    (payment) => payment.status === "verified",
  ).length;
  const verifiedPayments = payments.filter(
    (payment) => payment.status === "verified",
  );
  const totalVerified = verifiedPayments.reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  );

  const exportVerifiedPayments = () => {
    if (verifiedPayments.length === 0) return;
    const csvCell = (value: string | number | null) => {
      const text = String(value ?? "");
      const safeText = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
      return `"${safeText.replace(/"/g, '""')}"`;
    };
    const headers = [
      "Participant name",
      "College roll number",
      "College",
      "Department",
      "Phone",
      "Payment method",
      "Amount (INR)",
      "Payment reference",
      "Verification code",
      "Code status",
      "Verified at",
    ];
    const rows = verifiedPayments.map((payment) => [
      payment.participant?.full_name ?? "Profile unavailable",
      payment.participant?.college_roll ?? "",
      payment.participant?.college_name ?? "",
      payment.participant?.department ?? "",
      payment.participant?.phone ?? "",
      payment.payment_method,
      Number(payment.amount).toFixed(2),
      payment.payment_reference,
      payment.code?.code ?? "",
      payment.code?.status ?? "",
      payment.verified_at ? new Date(payment.verified_at).toISOString() : "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sristi-verified-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const openCodeIssue = (payment: PaymentView) => {
    setError("");
    setNotice("");
    setIssuedCode("");
    setIsCodeCopied(false);
    setCodePayment(payment);
  };

  return (
    <div className="mt-7 space-y-5">
      {paymentToast && (
        <div
          className="pointer-events-none fixed right-5 top-5 z-[60]"
          aria-live="polite"
        >
          <div
            role="status"
            className="pointer-events-auto flex min-w-72 items-center gap-3 rounded-xl border border-emerald-300/40 bg-[#f8fbf9] px-4 py-3 text-sm font-medium text-[#173d35] shadow-xl"
          >
            <CircleCheck size={19} className="shrink-0 text-emerald-700" />
            <span className="flex-1">{paymentToast}</span>
            <button
              type="button"
              onClick={() => setPaymentToast("")}
              className="rounded-md p-1 text-slate-500 transition hover:bg-slate-200"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2 border-l-4 border-pink-500 pl-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Payment workspace
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {page === "verification"
              ? "Offline payment verification"
              : "Payment records & verification codes"}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            {page === "verification"
              ? "Find a participant, confirm cash was received, and record the payment."
              : "Review verified payments, issue participant codes, and export records."}
          </p>
        </div>
      </div>
      <nav
        className="grid gap-3 sm:grid-cols-2"
        aria-label="Payment tasks"
      >
        <Link
          to="/admin/payments/verification"
          aria-current={page === "verification" ? "page" : undefined}
          className={`group flex min-h-24 items-center gap-4 rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${page === "verification" ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white/70 hover:border-emerald-300"}`}
        >
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${page === "verification" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700"}`}>
            <CircleCheck size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-slate-900">
              Offline verification
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-600">
              Search participants and confirm cash payments
            </span>
          </span>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${page === "verification" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
            {isLoading || isLoadingParticipants
              ? "Loading"
              : matchingParticipants.length}
          </span>
        </Link>
        <Link
          to="/admin/payments/records"
          aria-current={page === "records" ? "page" : undefined}
          className={`group flex min-h-24 items-center gap-4 rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${page === "records" ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white/70 hover:border-emerald-300"}`}
        >
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${page === "records" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700"}`}>
            <Wallet size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-slate-900">
              Payment records &amp; codes
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-600">
              Review payments, issue codes, and export records
            </span>
          </span>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${page === "records" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
            {isLoading ? "Loading" : payments.length}
          </span>
        </Link>
      </nav>
      <div className="grid gap-4 sm:grid-cols-3">
        <RegistrationSummary label="Payment records" value={payments.length} />
        <RegistrationSummary
          label="Pending review"
          value={pendingCount}
          accent="text-sky-200"
        />
        <RegistrationSummary
          label="Verified total"
          value={`₹${totalVerified.toLocaleString("en-IN", { minimumFractionDigits: 2 })} · ${verifiedCount} verified`}
          accent="text-emerald-300"
        />
      </div>

      {(error || notice) && (
        <p
          role={error ? "alert" : "status"}
          className={`rounded-lg border px-4 py-3 text-sm ${error ? "border-rose-300/20 bg-rose-300/5 text-rose-200" : "border-emerald-300/20 bg-emerald-300/5 text-emerald-200"}`}
        >
          {error || notice}
        </p>
      )}

      {page === "verification" && <section
        className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1520]"
        aria-labelledby="offline-verification-title"
      >
        <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div>
            <h2 id="offline-verification-title" className="font-semibold">
              Participants available for offline verification
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {isLoadingParticipants || isLoading
                ? "Loading participant profiles…"
                : `${matchingParticipants.length} participants without a verified payment. Confirm cash received before verifying.`}
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-2 2xl:flex-row">
            <label className="flex min-h-11 w-full min-w-0 items-center gap-3 rounded-lg border border-white/10 bg-[#0b121c] px-3 2xl:w-[28rem]">
              <Search size={17} className="shrink-0 text-slate-500" />
              <input
                value={participantSearch}
                onChange={(event) => {
                  setParticipantSearch(event.target.value);
                  setParticipantPage(0);
                }}
                placeholder="Search name, roll, college, phone…"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
                aria-label="Search participants available for offline verification"
              />
              {participantSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setParticipantSearch("");
                    setParticipantPage(0);
                  }}
                  className="grid size-8 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-white/10 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  aria-label="Clear participant search"
                >
                  <X size={16} />
                </button>
              )}
            </label>
            <button
              type="button"
              onClick={() => void loadParticipants()}
              disabled={isLoadingParticipants}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:cursor-wait disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={isLoadingParticipants ? "animate-spin" : ""}
              />
              Refresh list
            </button>
          </div>
        </div>
        {isLoadingParticipants || isLoading ? (
          <p role="status" className="px-5 py-8 text-center text-sm text-slate-400">
            Loading participants…
          </p>
        ) : visibleParticipants.length > 0 ? (
          <>
            <div className="divide-y divide-white/[0.07]">
              {visibleParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-white/[0.025]"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white">
                      {participant.full_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {participant.college_roll} · {participant.college_name} · {participant.phone}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setNotice("");
                      setPaymentReference("");
                      setVerifyParticipant(participant);
                    }}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-950/30 transition duration-150 hover:-translate-y-0.5 hover:bg-emerald-200 hover:shadow-md hover:shadow-emerald-950/40 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1520]"
                  >
                    <CircleCheck size={16} strokeWidth={2.3} />
                    Verify cash
                  </button>
                </div>
              ))}
            </div>
            {participantPageCount > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3">
                <p className="text-xs text-slate-400" aria-live="polite">
                  Showing {participantPage * participantPageSize + 1}–
                  {Math.min((participantPage + 1) * participantPageSize, matchingParticipants.length)} of {matchingParticipants.length}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setParticipantPage((page) => Math.max(0, page - 1))}
                    disabled={participantPage === 0}
                    className="min-h-9 rounded-lg border border-white/10 px-3 text-xs font-medium text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setParticipantPage((page) => Math.min(participantPageCount - 1, page + 1))}
                    disabled={participantPage >= participantPageCount - 1}
                    className="min-h-9 rounded-lg border border-white/10 px-3 text-xs font-medium text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="px-5 py-12 text-center">
            {participants.length === 0 ? (
              <CircleCheck size={24} className="mx-auto text-emerald-700" />
            ) : (
              <Search size={24} className="mx-auto text-slate-400" />
            )}
            <p className="mt-3 font-semibold text-slate-800">
              {participants.length === 0
                ? "Everyone is up to date"
                : "No matching participants"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {participants.length === 0
                ? "There are no participants waiting for offline payment verification."
                : "Try another name, roll number, college, or phone number."}
            </p>
            {participants.length > 0 && participantSearch && (
              <button
                type="button"
                onClick={() => {
                  setParticipantSearch("");
                  setParticipantPage(0);
                }}
                className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </section>}

      {page === "records" && <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1520]">
        <div className="space-y-4 border-b border-white/10 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Payment records</h2>
              <p className="mt-1 text-xs text-slate-500" aria-live="polite">
                {isLoading
                  ? "Loading payments…"
                  : `${visiblePayments.length} shown · ${verifiedCount} verified`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportVerifiedPayments}
                disabled={isLoading || verifiedCount === 0}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-200/30 bg-emerald-300 px-3 py-2 text-xs font-bold text-[#08251d] transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1520] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Download size={14} />
                Export verified ({verifiedCount})
              </button>
              <button
                type="button"
                onClick={() => setReload((value) => value + 1)}
                disabled={isLoading}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={isLoading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-white/10 bg-[#0b121c] px-3">
              <Search size={17} className="shrink-0 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search payments by participant, roll, college, or reference…"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
                aria-label="Search payment records"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="grid size-8 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-white/10 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  aria-label="Clear payment search"
                >
                  <X size={16} />
                </button>
              )}
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-lg border border-white/10 bg-[#0b121c] px-3 text-sm text-slate-200 outline-none"
              aria-label="Filter payment records by status"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div className="hidden overflow-x-auto xl:block" aria-busy={isLoading}>
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-4 font-medium">Participant</th>
                <th className="px-4 py-4 font-medium">Amount / method</th>
                <th className="px-4 py-4 font-medium">Reference</th>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-4 py-4 font-medium">Verification code</th>
                <th className="px-4 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.07]">
              {isLoading &&
                Array.from({ length: 5 }, (_, index) => (
                  <tr key={`payment-skeleton-${index}`} aria-hidden="true">
                    {["w-36", "w-24", "w-20", "w-20", "w-24", "w-20"].map(
                      (width, cell) => (
                        <td key={cell} className="px-4 py-5">
                          <span
                            className={`admin-skeleton block h-4 ${width} rounded`}
                          />
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              {!isLoading &&
                visiblePayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="transition hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">
                        {payment.participant?.full_name ??
                          "Profile unavailable"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {payment.participant?.college_roll ?? "—"} ·{" "}
                        {payment.participant?.college_name ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-100">
                        ₹
                        {Number(payment.amount).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {payment.payment_method}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {payment.payment_reference || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs capitalize ${payment.status === "verified" ? "bg-emerald-400/10 text-emerald-200" : payment.status === "pending" ? "bg-sky-400/10 text-sky-200" : "bg-rose-400/10 text-rose-200"}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {payment.code ? (
                        <div className="inline-flex max-w-[220px] flex-col items-start gap-1.5 rounded-lg border border-emerald-300/60 bg-[#d9fff1] px-3 py-2 shadow-sm shadow-emerald-950/20">
                          <span className="break-all font-mono text-sm font-extrabold tracking-wide text-[#064e3b]">
                            {payment.code.code}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${payment.code.status === "issued" ? "bg-[#087f5b] text-white" : "bg-slate-200 text-slate-700"}`}
                          >
                            {payment.code.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">
                          Not issued
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {payment.status === "verified" &&
                      payment.code?.status !== "issued" ? (
                        <button
                          type="button"
                          onClick={() => openCodeIssue(payment)}
                          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-cyan-100 bg-cyan-200 px-3 py-2 text-xs font-bold text-[#07131b] shadow-sm shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:bg-cyan-100 hover:shadow-md hover:shadow-cyan-950/40 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1520]"
                        >
                          Issue code
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              {!isLoading && visiblePayments.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-14 text-center text-slate-400"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <Search size={22} className="text-slate-400" />
                      <p className="mt-3 font-semibold text-slate-800">
                        {payments.length === 0
                          ? "No payment records yet"
                          : "No matching payments"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {payments.length === 0
                          ? "Verified and pending payments will appear here."
                          : "Try another search or change the status filter."}
                      </p>
                      {payments.length > 0 && (search || statusFilter !== "all") && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch("");
                            setStatusFilter("all");
                          }}
                          className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-slate-300 xl:hidden" aria-busy={isLoading}>
          {isLoading &&
            Array.from({ length: 3 }, (_, index) => (
              <div
                key={`payment-card-skeleton-${index}`}
                className="space-y-3 p-4"
                aria-hidden="true"
              >
                <span className="admin-skeleton block h-4 w-40 rounded" />
                <span className="admin-skeleton block h-4 w-56 rounded" />
                <span className="admin-skeleton block h-10 w-full rounded-lg" />
              </div>
            ))}
          {!isLoading && visiblePayments.map((payment) => (
            <article key={payment.id} className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900">
                    {payment.participant?.full_name ?? "Profile unavailable"}
                  </h3>
                  <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                    {payment.participant?.college_roll ?? "—"} · {payment.participant?.college_name ?? "—"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${payment.status === "verified" ? "bg-emerald-100 text-emerald-800" : payment.status === "pending" ? "bg-sky-100 text-sky-800" : "bg-rose-100 text-rose-800"}`}
                >
                  {payment.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-white/60 p-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Amount</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    ₹{Number(payment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="mt-0.5 text-xs capitalize text-slate-500">{payment.payment_method}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Reference</p>
                  <p className="mt-1 break-all text-sm text-slate-700">
                    {payment.payment_reference || "—"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Verification code</p>
                  {payment.code ? (
                    <p className="mt-1 font-mono text-sm font-bold tracking-wider text-emerald-800">
                      {payment.code.code} <span className="font-sans text-xs uppercase tracking-normal">· {payment.code.status}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">Not issued</p>
                  )}
                </div>
                {payment.status === "verified" && payment.code?.status !== "issued" && (
                  <button
                    type="button"
                    onClick={() => openCodeIssue(payment)}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-cyan-200 bg-cyan-100 px-3 py-2 text-xs font-bold text-slate-900 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
                  >
                    Issue code
                  </button>
                )}
              </div>
            </article>
          ))}
          {!isLoading && visiblePayments.length === 0 && (
            <div className="px-5 py-12 text-center">
              <Search size={22} className="mx-auto text-slate-400" />
              <p className="mt-3 font-semibold text-slate-800">
                {payments.length === 0 ? "No payment records yet" : "No matching payments"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {payments.length === 0
                  ? "Verified and pending payments will appear here."
                  : "Try another search or change the status filter."}
              </p>
              {payments.length > 0 && (search || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>}

      {verifyParticipant && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setVerifyParticipant(null);
          }}
        >
          <form
            onSubmit={verifyOfflinePayment}
            className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#101a27] p-6 shadow-2xl"
          >
            <h2 className="text-lg font-semibold text-white">
              Confirm cash payment
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Verify the cash with the participant before recording it. This
              uses the configured fest fee.
            </p>
            <p className="mt-4 rounded-lg bg-white/[0.04] p-3 text-sm text-slate-200">
              {verifyParticipant.full_name}{" "}
              <span className="text-slate-500">
                · {verifyParticipant.college_roll}
              </span>
            </p>
            <label className="mt-4 block text-sm text-slate-300">
              Optional receipt / reference
              <input
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                maxLength={160}
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#0b121c] px-3 text-sm text-white outline-none focus:border-emerald-300/50"
              />
            </label>
            {error && (
              <p role="alert" className="mt-3 text-sm text-rose-200">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setVerifyParticipant(null)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="rounded-lg bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
              >
                {isVerifying ? "Verifying…" : "Confirm cash received"}
              </button>
            </div>
          </form>
        </div>
      )}

      {codePayment && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCodePayment(null);
          }}
        >
          <form
            onSubmit={issueCode}
            className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-cyan-200/20 bg-[#101a27] p-6 shadow-2xl shadow-black/50"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan-200/20 bg-cyan-300/10 text-cyan-100">
                <ClipboardCheck size={19} />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Issue verification code
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Participant:{" "}
                  <span className="font-medium text-slate-200">
                    {codePayment.participant?.full_name ?? "participant"}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Verified payment details
                </h3>
                <span className="rounded-full bg-emerald-300/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                  Verified
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Roll number</p>
                  <p className="mt-1 break-words font-medium text-slate-200">
                    {codePayment.participant?.college_roll ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Amount</p>
                  <p className="mt-1 font-medium text-slate-200">
                    ₹{Number(codePayment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Method</p>
                  <p className="mt-1 capitalize font-medium text-slate-200">
                    {codePayment.payment_method}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Reference</p>
                  <p className="mt-1 break-all font-medium text-slate-200">
                    {codePayment.payment_reference || "—"}
                  </p>
                </div>
              </div>
            </div>
            {issuedCode ? (
              <section
                className="mt-5 rounded-xl border border-emerald-700/30 bg-[#d9fff1] p-5 shadow-sm shadow-emerald-950/20"
                aria-label="Issued verification code"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-[#065f46]">
                  <CircleCheck size={18} />
                  Code issued successfully
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#166534]">
                  Participant verification code
                </p>
                <div className="mt-2 flex min-h-16 items-center justify-between gap-3 rounded-lg border border-emerald-700/25 bg-white px-4 py-3 shadow-inner">
                  <code className="select-all break-all font-mono text-xl font-extrabold leading-relaxed tracking-[0.12em] text-[#052e2b] sm:text-2xl">
                    {issuedCode}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyIssuedCode()}
                    className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-[#0f766e] bg-[#0f766e] px-3 text-xs font-bold text-white transition hover:bg-[#115e59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
                    aria-label="Copy verification code"
                  >
                    {isCodeCopied ? <Check size={15} /> : <Copy size={15} />}
                    {isCodeCopied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="mt-3 text-xs font-medium leading-5 text-[#334155]">
                  Share this code securely with the participant. They can enter
                  it to confirm their payment.
                </p>
              </section>
            ) : (
              <>
                <p className="mt-4 text-sm leading-6 text-slate-400">
                  Leave blank for an automatic code, or enter exactly 6
                  characters using A–Z and 0–9. The code will be shown after it
                  is issued.
                </p>
                <label className="mt-5 block text-sm font-medium text-slate-200">
                  Custom code{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                  <input
                    value={customCode}
                    onChange={(event) =>
                      setCustomCode(
                        event.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, 6),
                      )
                    }
                    maxLength={6}
                    pattern="[A-Z0-9]{6}"
                    autoCapitalize="characters"
                    placeholder="6 letters or digits"
                    className="mt-2 h-12 w-full rounded-lg border border-white/15 bg-[#07111a] px-4 font-mono text-base font-semibold tracking-wide text-white outline-none transition placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-500 focus:border-cyan-200/60 focus:ring-2 focus:ring-cyan-200/15"
                  />
                </label>
              </>
            )}
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-rose-300/25 bg-rose-300/[0.08] px-3 py-2.5 text-sm text-rose-100"
              >
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-5">
              {issuedCode ? (
                <button
                  type="button"
                  onClick={() => setCodePayment(null)}
                  className="min-h-11 rounded-lg bg-cyan-200 px-5 text-sm font-bold text-[#07131b] transition hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setCodePayment(null)}
                    className="min-h-11 rounded-lg border border-white/15 px-4 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isIssuingCode}
                    className="min-h-11 rounded-lg bg-cyan-200 px-5 text-sm font-bold text-[#07131b] transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {isIssuingCode ? "Issuing…" : "Issue code"}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

type FestSettingsRecord = {
  id: number;
  fest_name: string;
  fest_fee: number;
  updated_at: string;
};

function AdminFestSettingsSection() {
  const [festName, setFestName] = useState("");
  const [festFee, setFestFee] = useState("");
  const [settingsExist, setSettingsExist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
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
      .from("fest_settings")
      .select("id,fest_name,fest_fee,updated_at")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (!mounted) return;
        setIsLoading(false);
        if (queryError) {
          setError(queryError.message);
          return;
        }
        const settings = data as FestSettingsRecord | null;
        if (!settings) {
          setSettingsExist(false);
          setFestName("SRISTI 2K26");
          setFestFee("");
          setUpdatedAt("");
          return;
        }
        setSettingsExist(true);
        setFestName(settings.fest_name);
        setFestFee(String(settings.fest_fee));
        setUpdatedAt(settings.updated_at);
      });
    return () => {
      mounted = false;
    };
  }, [reload]);

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    const parsedFee = Number(festFee);
    if (!festName.trim()) {
      setError("Enter a festival name.");
      return;
    }
    if (!Number.isFinite(parsedFee) || parsedFee <= 0) {
      setError(
        "Enter a fee greater than ₹0. Payment verification requires a positive fest fee.",
      );
      return;
    }
    setIsSaving(true);
    setError("");
    setNotice("");
    const values = { fest_name: festName.trim(), fest_fee: parsedFee };
    const result = settingsExist
      ? await supabase.from("fest_settings").update(values).eq("id", 1)
      : await supabase.from("fest_settings").insert({ id: 1, ...values });
    setIsSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setSettingsExist(true);
    setNotice(
      "Festival settings saved. Offline payment verification can now use this fee.",
    );
    setUpdatedAt(new Date().toISOString());
  };

  return (
    <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <form
        onSubmit={saveSettings}
        className="rounded-xl border border-white/10 bg-[#0d1520] p-5 md:p-7"
      >
        <div className="mb-6 border-b border-white/10 pb-5">
          <h2 className="text-lg font-semibold text-white">
            Festival configuration
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            These values are shared across participant registration and payment
            verification.
          </p>
        </div>
        {isLoading ? (
          <div
            className="space-y-5"
            aria-label="Loading festival settings"
            aria-busy="true"
          >
            <span className="admin-skeleton block h-4 w-36 rounded" />
            <span className="admin-skeleton block h-11 w-full rounded-lg" />
            <span className="admin-skeleton block h-4 w-28 rounded" />
            <span className="admin-skeleton block h-11 w-full rounded-lg" />
          </div>
        ) : (
          <>
            <label className="block text-sm font-medium text-slate-200">
              Festival name
              <input
                value={festName}
                onChange={(event) => setFestName(event.target.value)}
                maxLength={120}
                required
                className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-[#0b121c] px-3 text-sm text-white outline-none transition focus:border-emerald-300/50"
                placeholder="SRISTI 2K26"
              />
            </label>
            <label className="mt-5 block text-sm font-medium text-slate-200">
              Registration fee
              <input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={festFee}
                onChange={(event) => setFestFee(event.target.value)}
                required
                className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-[#0b121c] px-3 text-sm text-white outline-none transition focus:border-emerald-300/50"
                placeholder="Enter amount in INR"
              />
              <span className="mt-2 block text-xs leading-5 text-slate-500">
                This amount is used when an admin confirms an offline payment.
                Enter the actual fee set by your organizers.
              </span>
            </label>
            {error && (
              <p
                role="alert"
                className="mt-5 rounded-lg border border-rose-300/20 bg-rose-300/5 px-4 py-3 text-sm text-rose-200"
              >
                {error}
              </p>
            )}
            {notice && (
              <p
                role="status"
                className="mt-5 rounded-lg border border-emerald-300/20 bg-emerald-300/5 px-4 py-3 text-sm text-emerald-200"
              >
                {notice}
              </p>
            )}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
              <span className="text-xs text-slate-500">
                {updatedAt
                  ? `Last saved ${new Date(updatedAt).toLocaleString()}`
                  : "Settings have not been saved yet."}
              </span>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving…" : "Save settings"}
              </button>
            </div>
          </>
        )}
      </form>
      <aside className="h-fit rounded-2xl border border-cyan-300/25 bg-[#0b1c28] p-5 shadow-lg shadow-cyan-950/20">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-300 text-[#07131b] shadow-sm shadow-cyan-950/30">
            <Wallet size={19} strokeWidth={2.2} />
          </span>
          <h2 className="font-semibold text-white">Payment verification</h2>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-200">
          A positive fee must be saved before an admin can record a cash
          payment. When saved, the payment function uses this amount and records
          the verifying admin.
        </p>
        <button
          type="button"
          onClick={() => setReload((value) => value + 1)}
          disabled={isLoading || isSaving}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-cyan-200/30 bg-cyan-300 px-4 py-2 text-sm font-semibold text-[#07131b] shadow-sm shadow-cyan-950/30 transition duration-150 hover:-translate-y-0.5 hover:bg-cyan-200 hover:shadow-md hover:shadow-cyan-950/40 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1c28] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          Reload settings
        </button>
      </aside>
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
        .select(
          "user_id,team_id,profiles(full_name,college_roll,college_name,department),teams(team_name,team_code)",
        )
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
      const enrollments = (enrollmentData ??
        []) as unknown as AttendanceEnrollment[];
      const attendance = (attendanceData ?? []) as AttendanceRecord[];
      const byTarget = new Map<string, AttendanceRecord>();
      attendance.forEach((record) => {
        const key = record.user_id
          ? `user:${record.user_id}`
          : `team:${record.team_id}`;
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
          return [
            {
              key,
              userId: isTeam ? null : enrollment.user_id,
              teamId: isTeam ? enrollment.team_id : null,
              name: isTeam
                ? (team?.team_name ?? "Team")
                : (person?.full_name ?? "Participant"),
              secondary: isTeam
                ? `Team code: ${team?.team_code ?? "—"}`
                : `${person?.college_roll ?? "No roll number"} · ${person?.department ?? "Department unavailable"}`,
              status: marked?.status ?? null,
              markedAt: marked?.marked_at ?? null,
            },
          ];
        }),
      );
      setIsLoadingTargets(false);
    })();
    return () => {
      mounted = false;
    };
  }, [reload, selectedEventId]);

  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ?? null;
  const visibleTargets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return targets.filter(
      (target) =>
        !query ||
        `${target.name} ${target.secondary}`.toLowerCase().includes(query),
    );
  }, [search, targets]);
  const presentCount = targets.filter(
    (target) => target.status === "present",
  ).length;
  const absentCount = targets.filter(
    (target) => target.status === "absent",
  ).length;
  const unmarkedCount = targets.filter(
    (target) => target.status === null,
  ).length;

  const markAttendance = async (
    target: AttendanceTarget,
    status: "present" | "absent",
  ) => {
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
        <RegistrationSummary
          label="Registered targets"
          value={targets.length}
        />
        <RegistrationSummary
          label="Present"
          value={presentCount}
          accent="text-emerald-300"
        />
        <RegistrationSummary
          label="Absent"
          value={absentCount}
          accent="text-rose-200"
        />
        <RegistrationSummary
          label="Not marked"
          value={unmarkedCount}
          accent="text-amber-200"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 md:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-white/10 bg-[#0b121c] px-3">
          <Search size={17} className="shrink-0 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search participant, roll number, or team…"
            className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
            aria-label="Search attendance targets"
          />
        </label>
        <select
          value={selectedEventId}
          onChange={(event) => setSelectedEventId(event.target.value)}
          disabled={isLoadingEvents || events.length === 0}
          className="h-11 rounded-lg border border-white/10 bg-[#0b121c] px-3 text-sm text-slate-200 outline-none md:w-72"
          aria-label="Choose event"
        >
          {events.length === 0 && <option value="">No events available</option>}
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name} · {event.event_type}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-300/20 bg-rose-300/5 px-4 py-3 text-sm text-rose-200"
        >
          Attendance error: {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg border border-emerald-300/20 bg-emerald-300/5 px-4 py-3 text-sm text-emerald-200"
        >
          {notice}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1520]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="font-semibold">
              {selectedEvent
                ? `${selectedEvent.name} attendance`
                : "Event attendance"}
            </h2>
            <p className="mt-1 text-xs text-slate-500" aria-live="polite">
              {isLoadingTargets
                ? "Loading registered targets…"
                : `${visibleTargets.length} shown`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            disabled={isLoadingTargets || !selectedEventId}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={isLoadingTargets ? "animate-spin" : ""}
            />{" "}
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto" aria-busy={isLoadingTargets}>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-4 font-medium">Participant / team</th>
                <th className="px-4 py-4 font-medium">Target</th>
                <th className="px-4 py-4 font-medium">Attendance</th>
                <th className="px-5 py-4 text-right font-medium">Mark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.07]">
              {isLoadingTargets &&
                Array.from({ length: 4 }, (_, index) => (
                  <tr key={`attendance-skeleton-${index}`} aria-hidden="true">
                    {["w-40", "w-32", "w-20", "w-28"].map((width, cell) => (
                      <td key={cell} className="px-4 py-5">
                        <span
                          className={`admin-skeleton block h-4 ${width} rounded`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              {!isLoadingTargets &&
                visibleTargets.map((target) => (
                  <tr
                    key={target.key}
                    className="transition hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{target.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {target.secondary}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs ${target.teamId ? "bg-sky-400/10 text-sky-200" : "bg-violet-400/10 text-violet-200"}`}
                      >
                        {target.teamId ? "Team" : "Individual"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {target.status ? (
                        <>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs capitalize ${target.status === "present" ? "bg-emerald-400/10 text-emerald-200" : "bg-rose-400/10 text-rose-200"}`}
                          >
                            {target.status}
                          </span>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {target.markedAt
                              ? new Date(target.markedAt).toLocaleString()
                              : ""}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs text-amber-200">
                          Not marked
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => void markAttendance(target, "present")}
                          disabled={
                            savingKey === target.key || isLoadingTargets
                          }
                          aria-pressed={target.status === "present"}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1520] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${target.status === "present" ? "border-emerald-200 bg-emerald-300 text-slate-950 shadow-md shadow-emerald-950/30 hover:bg-emerald-200" : "border-emerald-300/25 text-emerald-200 hover:border-emerald-200 hover:bg-emerald-300 hover:text-slate-950"}`}
                        >
                          {savingKey === target.key
                            ? "Saving…"
                            : target.status === "present"
                              ? "Present ✓"
                              : "Present"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void markAttendance(target, "absent")}
                          disabled={
                            savingKey === target.key || isLoadingTargets
                          }
                          aria-pressed={target.status === "absent"}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1520] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${target.status === "absent" ? "border-rose-200 bg-rose-300 text-slate-950 shadow-md shadow-rose-950/30 hover:bg-rose-200" : "border-rose-300/25 text-rose-200 hover:border-rose-200 hover:bg-rose-300 hover:text-slate-950"}`}
                        >
                          {target.status === "absent" ? "Absent ✓" : "Absent"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!isLoadingTargets && visibleTargets.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-14 text-center text-slate-400"
                  >
                    {error
                      ? "Attendance targets could not be loaded."
                      : search
                        ? "No registered participants or teams match this search."
                        : "No registered participants or teams for this event yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-white/10 px-5 py-3 text-xs text-slate-500">
          Solo events are marked per participant. Team events are marked once
          per registered team, as enforced by the database.
        </p>
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
  const [roleDrafts, setRoleDrafts] = useState<
    Record<string, AdminRecord["role"]>
  >({});
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
        setRoleDrafts(
          Object.fromEntries(rows.map((admin) => [admin.id, admin.role])),
        );
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
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        normalizedId,
      )
    ) {
      setError("Enter a valid Auth user UUID.");
      return;
    }
    const succeeded = await runAction(
      async () =>
        await supabase!.rpc("create_admin", {
          p_user_id: normalizedId,
          p_role: newRole,
        }),
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
      if (
        !window.confirm(
          "Deactivate this admin account? They will lose access immediately.",
        )
      )
        return;
      await runAction(
        async () =>
          await supabase!.rpc("deactivate_admin", { p_admin_id: admin.id }),
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

  const activeCount = admins.filter(
    (admin) => admin.status === "active",
  ).length;
  const superAdminCount = admins.filter(
    (admin) => admin.role === "SUPER_ADMIN" && admin.status === "active",
  ).length;

  return (
    <div className="mt-7 space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <RegistrationSummary
          label="Total admin accounts"
          value={admins.length}
        />
        <RegistrationSummary
          label="Active admins"
          value={activeCount}
          accent="text-emerald-300"
        />
        <RegistrationSummary
          label="Active super admins"
          value={superAdminCount}
          accent="text-violet-200"
        />
      </div>

      <form
        onSubmit={addAdmin}
        className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-end"
      >
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
          <select
            value={newRole}
            onChange={(event) =>
              setNewRole(event.target.value as AdminRecord["role"])
            }
            className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#0b121c] px-3 text-sm text-slate-100 outline-none"
          >
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super admin</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={isSaving || !userId.trim()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} /> Grant access
        </button>
        <p className="text-xs leading-5 text-slate-500 md:col-span-3">
          The account must already exist in Supabase Authentication. Copy its
          user ID from the local or project Auth Users page. This form grants
          admin access; it does not create or invite an Auth account.
        </p>
      </form>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-300/20 bg-rose-300/5 px-4 py-3 text-sm text-rose-200"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg border border-emerald-300/20 bg-emerald-300/5 px-4 py-3 text-sm text-emerald-200"
        >
          {notice}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1520]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="font-semibold">Administrator accounts</h2>
            <p className="mt-1 text-xs text-slate-500" aria-live="polite">
              {isLoading ? "Loading admins…" : `${admins.length} accounts`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            disabled={isLoading || isSaving}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />{" "}
            Refresh
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
              {isLoading &&
                Array.from({ length: 3 }, (_, index) => (
                  <tr key={`admin-skeleton-${index}`} aria-hidden="true">
                    {["w-48", "w-24", "w-20", "w-24", "w-24"].map(
                      (width, cell) => (
                        <td key={cell} className="px-4 py-5">
                          <span
                            className={`admin-skeleton block h-4 ${width} rounded`}
                          />
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              {!isLoading &&
                admins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="transition hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-slate-300">
                      {admin.user_id}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={roleDrafts[admin.id] ?? admin.role}
                          onChange={(event) =>
                            setRoleDrafts((drafts) => ({
                              ...drafts,
                              [admin.id]: event.target
                                .value as AdminRecord["role"],
                            }))
                          }
                          className="h-9 rounded-lg border border-white/10 bg-[#0b121c] px-2 text-xs text-slate-200 outline-none"
                          aria-label={`Role for ${admin.user_id}`}
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="SUPER_ADMIN">Super admin</option>
                        </select>
                        {(roleDrafts[admin.id] ?? admin.role) !==
                          admin.role && (
                          <button
                            type="button"
                            onClick={() => void saveRole(admin)}
                            disabled={isSaving}
                            className="text-xs font-semibold text-emerald-200 hover:text-emerald-100 disabled:opacity-50"
                          >
                            Save
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs capitalize ${admin.status === "active" ? "bg-emerald-400/10 text-emerald-200" : "bg-slate-400/10 text-slate-300"}`}
                      >
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => void changeStatus(admin)}
                        disabled={isSaving}
                        className={`admin-admin-status-button rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${admin.status === "active" ? "admin-admin-status-button--deactivate" : "admin-admin-status-button--reactivate"}`}
                      >
                        {admin.status === "active"
                          ? "Deactivate"
                          : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                ))}
              {!isLoading && admins.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-14 text-center text-slate-400"
                  >
                    No admin accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
