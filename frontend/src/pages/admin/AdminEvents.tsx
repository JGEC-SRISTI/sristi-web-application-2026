import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  ClipboardCheck,
  Eye,
  EyeOff,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { supabase, supabaseConfigMissing } from "../../lib/supabase";
import collegeLogo from "../../assets/icons/logo1.png";
import sristiLogo from "../../assets/icons/sristi_logo.png";
import "./AdminEvents.css";

type EventType = "solo" | "team";

const EVENT_CATEGORIES = [
  "Civilized",
  "Gaming",
  "Management",
  "Aeronautical",
  "Robotics",
  "Technical",
  "Miscellaneous",
] as const;

type EventRecord = {
  id: string;
  name: string;
  slug: string;
  event_type: EventType;
  category: string;
  venue: string;
  short_description: string;
  description: string;
  min_team_size: number | null;
  max_team_size: number | null;
  updated_at: string;
};

type EventForm = Omit<EventRecord, "id" | "updated_at">;

const emptyForm: EventForm = {
  name: "",
  slug: "",
  event_type: "solo",
  category: "",
  venue: "",
  short_description: "",
  description: "",
  min_team_size: null,
  max_team_size: null,
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminEvents() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [accessState, setAccessState] = useState<
    "loading" | "config" | "signed-out" | "checking" | "denied" | "ready"
  >(supabaseConfigMissing ? "config" : "loading");
  const [adminRole, setAdminRole] = useState("");
  const [accessError, setAccessError] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [signInError, setSignInError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pageMessage, setPageMessage] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | EventType>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setAccessState("config");
      return;
    }

    let mounted = true;
    const checkAccess = async (user: User | null) => {
      if (!user) {
        setAdminRole("");
        setAccessState("signed-out");
        return;
      }

      setAccessState("checking");
      const { data, error: adminError } = await client
        .from("admin_users")
        .select("role, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!mounted) return;
      if (adminError) {
        setAccessError(adminError.message);
        setAccessState("denied");
        return;
      }
      if (!data) {
        setAccessError(
          "This signed-in account does not have an active admin role.",
        );
        setAccessState("denied");
        return;
      }

      setAdminRole(data.role);
      setAccessState("ready");
      setIsLoadingEvents(true);
      const { data: eventRows, error: eventError } = await client
        .from("events")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!mounted) return;
      setIsLoadingEvents(false);
      if (eventError) {
        setPageMessage(`Could not load events: ${eventError.message}`);
        return;
      }
      setEvents((eventRows ?? []) as EventRecord[]);
    };

    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) {
        setAccessError(sessionError.message);
        setAccessState("denied");
        return;
      }
      void checkAccess(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => void checkAccess(session?.user ?? null));
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
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: accountEmail,
      password: accountPassword,
    });
    setIsSigningIn(false);
    if (authError) setSignInError(authError.message);
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error: authError } = await supabase.auth.signOut();
    if (authError) setPageMessage(`Could not sign out: ${authError.message}`);
  };

  const visibleEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      const matchesQuery =
        !query ||
        [event.name, event.slug, event.category, event.venue].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesType =
        typeFilter === "all" || event.event_type === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [events, search, typeFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsSlugCustomized(false);
    setError("");
    setIsFormOpen(true);
  };

  const openEditForm = (event: EventRecord) => {
    setEditingId(event.id);
    setIsSlugCustomized(event.slug !== slugify(event.name));
    setForm({
      name: event.name,
      slug: event.slug,
      event_type: event.event_type,
      category: event.category,
      venue: event.venue,
      short_description: event.short_description,
      description: event.description,
      min_team_size: event.min_team_size,
      max_team_size: event.max_team_size,
    });
    setError("");
    setActiveMenu(null);
    setIsFormOpen(true);
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    const normalizedSlug = slugify(form.slug);

    if (!normalizedSlug) {
      setError("Enter a name so a valid slug can be created.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: normalizedSlug,
      event_type: form.event_type,
      category: form.category.trim(),
      venue: form.venue.trim(),
      short_description: form.short_description.trim(),
      description: form.description.trim(),
      min_team_size: form.event_type === "team" ? 3 : null,
      max_team_size: form.event_type === "team" ? 5 : null,
    };

    setIsSaving(true);
    setError("");
    const result = editingId
      ? await supabase
          .from("events")
          .update(payload)
          .eq("id", editingId)
          .select("*")
          .single()
      : await supabase.from("events").insert(payload).select("*").single();
    setIsSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }

    const savedEvent = result.data as EventRecord;
    setEvents((current) =>
      editingId
        ? current.map((item) => (item.id === editingId ? savedEvent : item))
        : [savedEvent, ...current],
    );
    setIsFormOpen(false);
    setPageMessage("");
    setToastMessage(
      editingId ? "Event updated successfully." : "Event created successfully.",
    );
  };

  const deleteEvent = async (eventId: string) => {
    if (!supabase) return;
    const confirmed = window.confirm(
      "Delete this event? This can also delete registrations, attendance, and results linked to it.",
    );
    if (!confirmed) {
      setActiveMenu(null);
      return;
    }

    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);
    if (deleteError) {
      setPageMessage(`Could not delete event: ${deleteError.message}`);
      setActiveMenu(null);
      return;
    }
    setEvents((current) => current.filter((event) => event.id !== eventId));
    setActiveMenu(null);
    setPageMessage("Event deleted.");
  };

  if (accessState !== "ready") {
    return (
      <AdminAccessGate
        state={accessState}
        accessError={accessError}
        email={accountEmail}
        password={accountPassword}
        onEmailChange={setAccountEmail}
        onPasswordChange={setAccountPassword}
        onSignIn={signIn}
        onSignOut={signOut}
        signInError={signInError}
        isSigningIn={isSigningIn}
      />
    );
  }

  return (
    <div className="admin-panel min-h-screen bg-[#080d14] text-slate-100 font-body">
      {toastMessage && (
        <div
          className="pointer-events-none fixed right-5 top-5 z-50"
          aria-live="polite"
        >
          <div
            role="status"
            className="pointer-events-auto flex min-w-72 items-center gap-3 rounded-xl border border-emerald-300/40 bg-[#f8fbf9] px-4 py-3 text-sm font-medium text-[#173d35] shadow-xl"
          >
            <CircleCheck size={19} className="shrink-0 text-emerald-700" />
            <span className="flex-1">{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage("")}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-200"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
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
          <NavItem active icon={<CalendarDays size={18} />} label="Events" />
          <NavItem
            href="/admin/registrations"
            icon={<ListChecks size={18} />}
            label="Registrations"
          />
          <NavItem
            href="/admin/attendance"
            icon={<ClipboardCheck size={18} />}
            label="Attendance"
          />
          <NavItem
            href="/admin/payments"
            icon={<Wallet size={18} />}
            label="Payments"
          />
          <NavItem
            href="/admin/admins"
            icon={<Users size={18} />}
            label="Admins"
          />
        </nav>
        <div className="mt-auto space-y-2 border-t border-white/10 pt-5">
          <NavItem
            href="/admin/settings"
            icon={<Settings size={18} />}
            label="Settings"
          />
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-slate-400">
            <p className="mb-1 flex items-center gap-2 font-semibold text-slate-200">
              <CircleHelp size={14} /> Admin access
            </p>
            Actions are still enforced by Supabase policies.
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="flex h-16 items-center justify-between border-b border-white/10 px-5 md:px-9">
          <nav aria-label="Breadcrumb">
            <ol className="admin-breadcrumbs flex items-center gap-2 text-sm">
              <li>
                <a href="/">SRISTI</a>
              </li>
              <li aria-hidden="true">
                <ChevronRight size={15} />
              </li>
              <li>
                <span>Admin</span>
              </li>
              <li aria-hidden="true">
                <ChevronRight size={15} />
              </li>
              <li aria-current="page">
                <span>Events</span>
              </li>
            </ol>
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span className="grid size-8 place-items-center rounded-full bg-slate-700 font-semibold">
              {adminRole.slice(0, 1) || "A"}
            </span>
            <span className="hidden sm:inline">
              {adminRole.replaceAll("_", " ")}
            </span>
            <button
              onClick={signOut}
              className="ml-2 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
              aria-label="Sign out"
            >
              <LogOut size={15} />{" "}
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-5 py-8 md:px-9">
          {pageMessage && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-sky-300/20 bg-sky-300/[0.06] px-4 py-3 text-sm text-sky-100"
            >
              {pageMessage}
            </div>
          )}

          <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Content management
              </p>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Events
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Create and manage festival events.
              </p>
            </div>
            <button
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              <Plus size={18} /> Add event
            </button>
          </div>

          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 md:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-white/10 bg-[#0b121c] px-3">
              <Search size={17} className="shrink-0 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search events, category, venue..."
                className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
                aria-label="Search events"
              />
            </label>
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as "all" | EventType)
              }
              className="h-11 rounded-lg border border-white/10 bg-[#0b121c] px-3 text-sm text-slate-200 outline-none"
              aria-label="Filter by event type"
            >
              <option value="all">All event types</option>
              <option value="solo">Solo</option>
              <option value="team">Team</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1520]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="font-semibold">All events</h2>
                <p className="mt-1 text-xs text-slate-500" aria-live="polite">
                  {isLoadingEvents
                    ? "Loading events…"
                    : `${visibleEvents.length} events`}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto" aria-busy={isLoadingEvents}>
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">Event</th>
                    <th className="px-4 py-4 font-medium">Type</th>
                    <th className="px-4 py-4 font-medium">Category</th>
                    <th className="px-4 py-4 font-medium">Venue</th>
                    <th className="px-4 py-4 font-medium">Team size</th>
                    <th className="px-4 py-4 font-medium">Updated</th>
                    <th className="px-4 py-4 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07]">
                  {isLoadingEvents &&
                    Array.from({ length: 5 }, (_, index) => (
                      <tr key={`event-skeleton-${index}`} aria-hidden="true">
                        <td className="px-5 py-4">
                          <span className="admin-skeleton block h-4 w-36 rounded" />
                          <span className="admin-skeleton mt-2 block h-3 w-24 rounded" />
                        </td>
                        <td className="px-4 py-4">
                          <span className="admin-skeleton block h-5 w-12 rounded-full" />
                        </td>
                        <td className="px-4 py-4">
                          <span className="admin-skeleton block h-4 w-24 rounded" />
                        </td>
                        <td className="px-4 py-4">
                          <span className="admin-skeleton block h-4 w-28 rounded" />
                        </td>
                        <td className="px-4 py-4">
                          <span className="admin-skeleton block h-4 w-10 rounded" />
                        </td>
                        <td className="px-4 py-4">
                          <span className="admin-skeleton block h-4 w-20 rounded" />
                        </td>
                        <td className="px-4 py-4">
                          <span className="admin-skeleton ml-auto block h-8 w-8 rounded-lg" />
                        </td>
                      </tr>
                    ))}
                  {visibleEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{event.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          /{event.slug}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs capitalize ${event.event_type === "team" ? "bg-sky-400/10 text-sky-200" : "bg-violet-400/10 text-violet-200"}`}
                        >
                          {event.event_type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {event.category}
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {event.venue}
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {event.event_type === "team"
                          ? `${event.min_team_size}–${event.max_team_size}`
                          : "—"}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {new Date(event.updated_at).toLocaleDateString()}
                      </td>
                      <td className="relative px-4 py-4 text-right">
                        <button
                          onClick={() =>
                            setActiveMenu(
                              activeMenu === event.id ? null : event.id,
                            )
                          }
                          className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10"
                          aria-label={`Actions for ${event.name}`}
                          aria-expanded={activeMenu === event.id}
                        >
                          <MoreVertical size={17} />
                        </button>
                        {activeMenu === event.id && (
                          <div className="absolute right-8 top-14 z-10 w-36 rounded-lg border border-white/10 bg-[#172231] p-1 text-left shadow-xl">
                            <button
                              onClick={() => openEditForm(event)}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-white/10"
                            >
                              <Pencil size={15} /> Edit
                            </button>
                            <button
                              onClick={() => deleteEvent(event.id)}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-rose-300 hover:bg-rose-400/10"
                            >
                              <Trash2 size={15} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!isLoadingEvents && visibleEvents.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-14 text-center text-slate-400"
                      >
                        {search || typeFilter !== "all"
                          ? "No events match those filters."
                          : "No events yet. Add the first event."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-white/10 px-5 py-3 text-xs text-slate-500">
              Event IDs and timestamps are generated by the database when
              connected.
            </div>
          </div>
        </section>
      </main>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-black/65"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsFormOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-form-title"
            className="flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#101a27] shadow-2xl"
          >
            <header className="flex items-start justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">
                  Event details
                </p>
                <h2 id="event-form-title" className="mt-1 text-2xl font-bold">
                  {editingId ? "Edit event" : "Add event"}
                </h2>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </header>

            <form
              onSubmit={submitForm}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                {error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200"
                  >
                    {error}
                  </p>
                )}
                <FormField label="Name" required>
                  <input
                    required
                    value={form.name}
                    onChange={(event) => {
                      const name = event.target.value;
                      setForm((current) => ({
                        ...current,
                        name,
                        slug: isSlugCustomized ? current.slug : slugify(name),
                      }));
                    }}
                    className={inputClass}
                    placeholder="e.g. Robo Rumble"
                  />
                </FormField>
                <FormField
                  label="Slug"
                  required
                  hint="URL-friendly identifier; lowercase letters, numbers, and hyphens."
                >
                  <input
                    required
                    value={form.slug}
                    onChange={(event) => {
                      setIsSlugCustomized(true);
                      setForm((current) => ({
                        ...current,
                        slug: event.target.value,
                      }));
                    }}
                    className={inputClass}
                    placeholder="robo-rumble"
                  />
                </FormField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Event type" required>
                    <select
                      value={form.event_type}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          event_type: event.target.value as EventType,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="solo">Solo</option>
                      <option value="team">Team</option>
                    </select>
                  </FormField>
                  <FormField label="Category" required>
                    <select
                      required
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="" disabled>
                        Select a category
                      </option>
                      {form.category &&
                        !EVENT_CATEGORIES.includes(
                          form.category as (typeof EVENT_CATEGORIES)[number],
                        ) && (
                          <option value={form.category}>{form.category}</option>
                        )}
                      {EVENT_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <FormField label="Venue" required>
                  <input
                    required
                    value={form.venue}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        venue: event.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="e.g. Main Auditorium"
                  />
                </FormField>
                <FormField label="Short description" required>
                  <input
                    required
                    value={form.short_description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        short_description: event.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="A brief one-line description"
                  />
                </FormField>
                <FormField label="Description" required>
                  <textarea
                    required
                    rows={4}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    className={`${inputClass} resize-y`}
                    placeholder="Describe the event"
                  />
                </FormField>
                {form.event_type === "team" && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-semibold">Team size</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      The current database rule requires teams of 3–5 members.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <FormField label="Minimum">
                        <input
                          disabled
                          value="3"
                          className={`${inputClass} cursor-not-allowed opacity-70`}
                        />
                      </FormField>
                      <FormField label="Maximum">
                        <input
                          disabled
                          value="5"
                          className={`${inputClass} cursor-not-allowed opacity-70`}
                        />
                      </FormField>
                    </div>
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  ID and created/updated timestamps are managed by the database.
                </p>
              </div>
              <footer className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  disabled={isSaving}
                  type="submit"
                  className="rounded-lg bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60"
                >
                  {isSaving
                    ? "Saving…"
                    : editingId
                      ? "Save changes"
                      : "Save event"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-white/10 bg-[#0b121c] px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10 disabled:text-slate-400";

export function AdminAccessGate({
  state,
  accessError,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSignIn,
  onSignOut,
  signInError,
  isSigningIn,
}: {
  state: "loading" | "config" | "signed-out" | "checking" | "denied" | "ready";
  accessError: string;
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSignIn: (event: FormEvent<HTMLFormElement>) => void;
  onSignOut: () => void;
  signInError: string;
  isSigningIn: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(
    null,
  );

  return (
    <main className="admin-panel grid min-h-screen place-items-center bg-[#080d14] px-5 py-10 font-body text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1520] p-7 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300">
            <ShieldCheck size={23} />
          </span>
          <div>
            <p className="font-bold tracking-wide">SRISTI ADMIN</p>
            <p className="text-xs text-slate-400">Events management</p>
          </div>
        </div>
        {state === "config" ? (
          <>
            <h1 className="text-xl font-semibold">Connect local Supabase</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Copy <code>frontend/.env.example</code> to{" "}
              <code>frontend/.env.local</code>, then set the local Supabase API
              URL and anon key. Never use a service-role key in the frontend.
            </p>
          </>
        ) : state === "loading" || state === "checking" ? (
          <p className="text-sm text-slate-300">
            {state === "loading"
              ? "Checking your Supabase session…"
              : "Checking admin access…"}
          </p>
        ) : state === "denied" ? (
          <>
            <h1 className="text-xl font-semibold">Admin access required</h1>
            <p className="mt-2 text-sm leading-6 text-rose-200">
              {accessError || "This account is not an active admin."}
            </p>
            <button
              onClick={onSignOut}
              className="mt-5 rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
            >
              Sign out and use another account
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold">Sign in to continue</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Use the local Auth account that has an active admin role.
            </p>
            <form onSubmit={onSignIn} className="mt-5 space-y-4">
              {signInError && (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200"
                >
                  {signInError}
                </p>
              )}
              <div className="relative">
                <input
                  id="admin-email"
                  required
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder=" "
                  className="peer h-12 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 pb-2 pt-5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                />
                <label
                  htmlFor="admin-email"
                  className={`pointer-events-none absolute left-3 z-10 transition-all ${focusedField === "email" || email ? "-top-2 rounded bg-slate-100 px-1 text-xs text-emerald-800" : "top-3.5 text-sm text-slate-500"}`}
                >
                  Email address
                </label>
              </div>
              <div className="relative">
                <input
                  required
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder=" "
                  className="peer h-12 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 pb-2 pr-12 pt-5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                />
                <label
                  htmlFor="admin-password"
                  className={`pointer-events-none absolute left-3 z-10 transition-all ${focusedField === "password" || password ? "-top-2 rounded bg-slate-100 px-1 text-xs text-emerald-800" : "top-3.5 text-sm text-slate-500"}`}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition hover:bg-white/5 hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <button
                disabled={isSigningIn}
                className="w-full rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
              >
                {isSigningIn ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </>
        )}
        <Link
          to="/"
          viewTransition
          className="admin-home-link mt-6 inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200 no-underline shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#087f68] hover:bg-[#087f68] hover:text-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1520]"
        >
          <ArrowLeft size={16} />
          Back to SRISTI home
        </Link>
      </section>
    </main>
  );
}

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-200">
      {label}
      {required && <span className="ml-1 text-rose-300">*</span>}
      {children}
      {hint && (
        <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}

export function NavItem({
  icon,
  label,
  active = false,
  href,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  href?: string;
}) {
  if (href) {
    return (
      <Link
        to={href}
        viewTransition
        className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm no-underline ${active ? "bg-emerald-400/10 font-semibold text-emerald-200" : "text-slate-400 hover:bg-white/5"}`}
        aria-current={active ? "page" : undefined}
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  }
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${active ? "bg-emerald-400/10 font-semibold text-emerald-200" : "text-slate-400"}`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
