import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import {
  CalendarDays,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Settings,
  ShieldCheck,
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
  }, []);

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
          <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] p-6">
            {canViewSection ? (
              <p className="text-sm text-slate-300">{details.note}</p>
            ) : (
              <p role="alert" className="text-sm text-rose-200">
                Only a super admin can access admin management.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
