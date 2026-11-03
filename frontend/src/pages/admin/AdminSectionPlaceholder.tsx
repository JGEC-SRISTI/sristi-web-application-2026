import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase, supabaseConfigMissing } from "../../lib/supabase";
import collegeLogo from "../../assets/icons/logo1.png";
import sristiLogo from "../../assets/icons/sristi_logo.png";
import { AdminAccessGate, NavItem } from "./AdminEvents";
import "./AdminEvents.css";

type AdminSection =
  | "attendance"
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
          ) : section === "payments" ? (
            <AdminPaymentsSection />
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

function AdminPaymentsSection() {
  const [payments, setPayments] = useState<PaymentView[]>([]);
  const [participants, setParticipants] = useState<PaymentParticipant[]>([]);
  const [search, setSearch] = useState("");
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

  const loadParticipants = async () => {
    if (!supabase) return;
    setIsLoadingParticipants(true);
    setError("");
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
  };

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
    const query = search.trim().toLowerCase();
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
  }, [participants, payments, search]);

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

      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 md:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-white/10 bg-[#0b121c] px-3">
          <Search size={17} className="shrink-0 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search participant, roll number, college, reference…"
            className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
            aria-label="Search payments"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-11 rounded-lg border border-white/10 bg-[#0b121c] px-3 text-sm text-slate-200 outline-none"
          aria-label="Filter payments by status"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setNotice("");
            setError("");
            setVerifyParticipant(null);
            setSearch("");
            void loadParticipants();
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
        >
          <Plus size={16} /> Record cash payment
        </button>
      </div>

      {(error || notice) && (
        <p
          role={error ? "alert" : "status"}
          className={`rounded-lg border px-4 py-3 text-sm ${error ? "border-rose-300/20 bg-rose-300/5 text-rose-200" : "border-emerald-300/20 bg-emerald-300/5 text-emerald-200"}`}
        >
          {error || notice}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1520]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
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
        <div className="overflow-x-auto" aria-busy={isLoading}>
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
                          onClick={() => {
                            setError("");
                            setNotice("");
                            setIssuedCode("");
                            setIsCodeCopied(false);
                            setCodePayment(payment);
                          }}
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
                    {payments.length === 0
                      ? "No payment records yet."
                      : "No payments match those filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {participants.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1520]">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="font-semibold">
              Participants available for offline verification
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Confirm cash received before recording a verified offline payment.
            </p>
          </div>
          <div className="max-h-72 divide-y divide-white/[0.07] overflow-y-auto">
            {matchingParticipants.slice(0, 50).map((participant) => (
              <div
                key={participant.id}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-white/[0.025]"
              >
                <div className="min-w-0">
                  <p className="font-medium text-white">
                    {participant.full_name}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {participant.college_roll}{" "}
                    <span className="px-1 text-slate-600">·</span>{" "}
                    {participant.college_name}{" "}
                    <span className="px-1 text-slate-600">·</span>{" "}
                    {participant.phone}
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
            {matchingParticipants.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                No participants match this search or all have verified payments.
              </p>
            )}
            {matchingParticipants.length > 50 && (
              <p className="px-5 py-3 text-xs text-slate-500">
                Showing first 50 matches. Refine the search to find a
                participant.
              </p>
            )}
          </div>
        </div>
      )}
      {isLoadingParticipants && (
        <p role="status" className="text-sm text-slate-400">
          Loading participant profiles…
        </p>
      )}

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
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101a27] p-6 shadow-2xl"
          >
            <h2 className="text-lg font-semibold text-white">
              Confirm cash payment
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Verify the cash with the participant before recording it. This uses the configured fest fee.
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
            className="w-full max-w-md rounded-2xl border border-cyan-200/20 bg-[#101a27] p-6 shadow-2xl shadow-black/50"
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
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition disabled:opacity-50 ${admin.status === "active" ? "border-rose-300/20 text-rose-200 hover:bg-rose-300/10" : "border-emerald-300/20 text-emerald-200 hover:bg-emerald-300/10"}`}
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
