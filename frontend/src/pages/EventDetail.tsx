
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CircleCheck,
  ExternalLink,
  MapPin,
  Users,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import LiquidGradientBackground from "../components/LiquidGradientBackground";
import { getEventImage, type EventCategory } from "../data/events";

import TeamModal, {
  TeamSuccessModal,
} from "../components/teams/TeamModal";
import ViewTeamModal from "../components/teams/ViewTeamModal";

import {
  createTeam,
  fetchEventBrochureUrl,
  fetchPlayerTeamForEvent,
  fetchRegistrationEvent,
  fetchTeamDetails,
  getCachedEventBrochureUrl,
  getCachedRegistrationEvent,
  hasSoloRegistration,
  joinTeam,
  registerSoloEvent,
  type RegistrationEvent,
  type TeamInfo,
} from "../services/teamService";

import { mockEvents, type Event } from "../data/events";
import { supabase } from "../lib/supabase";

const categoryAccent: Record<EventCategory, string> = {
  Civilized: "#fbbf24",
  Gaming: "#f472b6",
  Management: "#34d399",
  Aeronautical: "#fb923c",
  Robotics: "#38bdf8",
  Technical: "#a78bfa",
  Miscellaneous: "#f472b6",
};

type EventCardMetadata = {
  venue: string;
  event_type: "solo" | "team";
  min_team_size: number | null;
  max_team_size: number | null;
};

const EventTitle = ({
  title,
  accent,
}: {
  title: string;
  accent: string;
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLHeadingElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const position = useRef({ x: 0, y: 0 });
  const rafId = useRef(0);

  useEffect(() => {
    const lerp = (from: number, to: number, amount: number) =>
      from + (to - from) * amount;

    const tick = () => {
      position.current.x = lerp(position.current.x, mouse.current.x, 0.08);
      position.current.y = lerp(position.current.y, mouse.current.y, 0.08);

      if (overlayRef.current) {
        overlayRef.current.style.setProperty(
          "--splash-x",
          `${position.current.x}px`
        );
        overlayRef.current.style.setProperty(
          "--splash-y",
          `${position.current.y}px`
        );
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    mouse.current.x = e.clientX - rect.left;
    mouse.current.y = e.clientY - rect.top;
  };

  return (
    <div
      ref={wrapRef}
      className="events-splash-wrap relative inline-block max-w-full"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => overlayRef.current?.classList.add("is-visible")}
      onMouseLeave={() => overlayRef.current?.classList.remove("is-visible")}
    >
      <h1 className="max-w-full break-words py-4 text-left font-squid text-5xl leading-[0.88] tracking-wide text-white sm:text-7xl lg:text-8xl">
        {title}
      </h1>

      <h1
        ref={overlayRef}
        aria-hidden="true"
        className="events-splash-overlay max-w-full break-words text-left font-squid text-5xl leading-[0.88] tracking-wide sm:text-7xl lg:text-8xl [overflow-wrap:anywhere] pointer-events-none"
        style={{ color: accent }}
      >
        {title}
      </h1>
    </div>
  );
};

const EventPoster = ({
  event,
  metadata,
}: {
  event: Event;
  metadata: EventCardMetadata;
}) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const accent = categoryAccent[event.category] ?? "#a78bfa";

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sceneRef.current || e.pointerType !== "mouse") return;

    const rect = sceneRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    sceneRef.current.style.setProperty(
      "--card-sheen-x",
      `${(((e.clientX - rect.left) / rect.width) * 100).toFixed(2)}%`
    );
    sceneRef.current.style.setProperty(
      "--card-sheen-y",
      `${(((e.clientY - rect.top) / rect.height) * 100).toFixed(2)}%`
    );

    sceneRef.current.style.transform =
      `scale(var(--card-hover-scale)) rotateX(${(y * 5).toFixed(2)}deg) rotateY(${(-x * 7).toFixed(2)}deg)`;
  };

  const resetTilt = () => {
    if (!sceneRef.current) return;

    sceneRef.current.style.transform =
      "scale(var(--card-hover-scale)) rotateX(0deg) rotateY(0deg)";
    sceneRef.current.style.setProperty("--card-sheen-x", "50%");
    sceneRef.current.style.setProperty("--card-sheen-y", "35%");
  };

  return (
    <div className="event-detail-poster w-[380px] max-w-[420px] perspective-[1200px]">
      <div
        ref={sceneRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        className="event-card-scene"
        style={{
          color: accent,
          transform: "scale(var(--card-hover-scale)) rotateX(0deg) rotateY(0deg)",
        }}
      >
        <div
          className="event-card-shell relative overflow-hidden rounded-2xl backdrop-blur-md"
          style={{
            background: "#111116ee",
            border: `1px solid ${accent}`,
            boxShadow: `0 0 52px ${accent}20, 0 28px 72px rgba(0,0,0,0.72), inset 0 0 0 1px ${accent}18`,
          }}
        >
          <div
            className="event-detail-poster-image relative flex h-[min(48vh,400px)] items-center justify-center overflow-hidden rounded-t-2xl"
            style={{
              background: `radial-gradient(ellipse at 50% 30%, ${accent}18 0%, transparent 70%)`,
            }}
          >
            <img
              src={getEventImage(event.title)}
              alt={`${event.title} event`}
              className="absolute inset-0 h-full w-full object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-black/35" />

            <span className="absolute left-5 top-5 rounded-md border border-white/10 bg-black/40 px-3 py-1.5 font-space-mono text-[9px] font-bold uppercase tracking-[0.18em]">
              {event.category}
            </span>
          </div>

          <div className="space-y-4 px-6 pb-6 pt-5">
            <h2 className="font-squid text-3xl leading-tight tracking-wide text-white sm:text-4xl">
              {event.title}
            </h2>

            <div className="grid grid-cols-2 gap-x-3 gap-y-3 font-space-mono text-[9px] uppercase tracking-[0.12em] text-white/40">
              <span className="flex min-w-0 items-center gap-2">
                <MapPin size={12} style={{ color: accent }} />
                {metadata.venue}
              </span>

              <span className="flex min-w-0 items-center gap-2">
                <Users size={12} style={{ color: accent }} />
                {metadata.event_type === "team"
                  ? metadata.min_team_size !== null && metadata.max_team_size !== null
                    ? `${metadata.min_team_size}-${metadata.max_team_size} members`
                    : event.team_size
                  : "Individual"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type TeamMode = "create" | "join";
type TeamSubmission = { id: string; mode: TeamMode };

function RegisteredBadge({ note }: { note?: string }) {
  return (
    <div role="status" className="self-center">
      <span className="inline-flex items-center gap-1.5 font-a24 text-xs text-emerald-200">
        <CircleCheck aria-hidden="true" size={15} />
        Registered
      </span>
      {note && <p className="mt-1 font-space-mono text-[10px] text-amber-200">{note}</p>}
    </div>
  );
}

const EventDetailContent = ({ event }: { event: Event }) => {
  const [eventCardMetadata, setEventCardMetadata] =
    useState<EventCardMetadata | null>(null);
  const [registrationEvent, setRegistrationEvent] = useState<
    RegistrationEvent | null | undefined
  >(() => getCachedRegistrationEvent(event.slug));
  const [brochureUrl, setBrochureUrl] = useState<string | null>(() => {
    const cachedEvent = getCachedRegistrationEvent(event.slug);
    return cachedEvent ? getCachedEventBrochureUrl(cachedEvent.id) : null;
  });
  const [brochureLoading, setBrochureLoading] = useState(false);
  const [teamMode, setTeamMode] = useState<TeamMode | null>(null);
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [submittedTeam, setSubmittedTeam] = useState<TeamSubmission | null>(null);
  const [successTeam, setSuccessTeam] = useState<{
    team: TeamInfo;
    mode: TeamMode;
  } | null>(null);
  const [showTeam, setShowTeam] = useState(false);

  const [registered, setRegistered] = useState(false);
  const [registrationCheck, setRegistrationCheck] = useState<"checking" | "ready" | "failed">("checking");
  const [registrationCheckAttempt, setRegistrationCheckAttempt] = useState(0);
  const [registrationBusy, setRegistrationBusy] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    const client = supabase;
    const loadEventCardMetadata = async () => {
      try {
        const { data, error } = await client
          .from("events")
          .select("venue,event_type,min_team_size,max_team_size")
          .eq("slug", event.slug)
          .maybeSingle();
        if (!active) return;
        if (error) {
          setRegistrationMessage("Could not load the latest event details.");
          return;
        }
        if (data) setEventCardMetadata(data as EventCardMetadata);
      } catch {
        if (active) {
          setRegistrationMessage("Could not load the latest event details.");
        }
      }
    };
    void loadEventCardMetadata();

    return () => {
      active = false;
    };
  }, [event.slug]);

  useEffect(() => {
    let active = true;

    fetchRegistrationEvent(event.slug)
      .then((target) => {
        if (!active) return;
        if (target || !getCachedRegistrationEvent(event.slug)) {
          setRegistrationEvent(target);
        }
      })
      .catch(() => {
        if (!active) return;
        if (getCachedRegistrationEvent(event.slug)) {
          setRegistrationMessage("Using saved event details while the connection recovers.");
          return;
        }
        setRegistrationEvent(null);
        setRegistrationMessage(
          "Could not check registration availability. Please reload to try again."
        );
      });

    return () => {
      active = false;
    };
  }, [event.slug]);

  const eventId = registrationEvent?.id;
  const eventType = registrationEvent?.event_type;

  useEffect(() => {
    if (!supabase || !eventId) return;

    let mounted = true;
    const cachedUrl = getCachedEventBrochureUrl(eventId);
    if (cachedUrl) setBrochureUrl(cachedUrl);
    else setBrochureLoading(true);

    void fetchEventBrochureUrl(eventId)
      .then((url) => {
        if (!mounted) return;
        setBrochureUrl(url);
        setBrochureLoading(false);
      })
      .catch(() => {
        if (mounted) setBrochureLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    let active = true;

    const loadRegistration = async () => {
      if (eventType === "team") {
        const existingTeam = await fetchPlayerTeamForEvent(eventId);
        if (active) setTeam(existingTeam);
      } else {
        const alreadyRegistered = await hasSoloRegistration(eventId);
        if (active) setRegistered(alreadyRegistered);
      }
      if (active) setRegistrationCheck("ready");
    };

    void loadRegistration().catch(() => {
      if (active) setRegistrationCheck("failed");
    });

    return () => {
      active = false;
    };
  }, [eventId, eventType, registrationCheckAttempt]);

  const formingTeamId = team?.status === "forming" && !team.registration_id
    ? team.id
    : undefined;
  useEffect(() => {
    if (!formingTeamId || showTeam || successTeam) return;
    let active = true;

    const refreshTeamStatus = async () => {
      if (!document.hidden) {
        try {
          const details = await fetchTeamDetails(formingTeamId);
          if (active) setTeam(details);
        } catch {
          // Keep the displayed team until the next status check.
        }
      }
      if (active) timer = window.setTimeout(refreshTeamStatus, 10_000);
    };
    let timer = window.setTimeout(refreshTeamStatus, 10_000);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [formingTeamId, showTeam, successTeam]);

  const accent = categoryAccent[event.category] ?? "#a78bfa";
  const cardMetadata: EventCardMetadata = eventCardMetadata ?? {
    venue: event.venue,
    event_type: event.participation === "TEAM" ? "team" : "solo",
    min_team_size: null,
    max_team_size: null,
  };

  const loadSubmittedTeam = async ({ id, mode }: TeamSubmission) => {
    setRegistrationBusy(true);
    setRegistrationMessage("");
    try {
      const details = await fetchTeamDetails(id);
      if (details.event_id === eventId) setTeam(details);
      setSuccessTeam({ team: details, mode });
      setSubmittedTeam(null);
    } catch {
      setRegistrationMessage(
        mode === "create"
          ? "Team created. Try loading the team details again to see your invite code."
          : "Team joined. Try loading the team details again."
      );
    } finally {
      setRegistrationBusy(false);
    }
  };

  const handleTeamSubmit = async (value: string) => {
    if (!eventId || !teamMode) return;

    const existingTeam = team ?? await fetchPlayerTeamForEvent(eventId);
    if (existingTeam) {
      setTeam(existingTeam);
      setTeamMode(null);
      return;
    }

    const id =
      teamMode === "create"
        ? await createTeam(eventId, value)
        : await joinTeam(value);
    const submission = { id, mode: teamMode };
    setSubmittedTeam(submission);
    setTeamMode(null);
    await loadSubmittedTeam(submission);
  };

  const handleSoloRegistration = async () => {
    if (!eventId) return;
    setRegistrationBusy(true);
    setRegistrationMessage("");

    try {
      await registerSoloEvent(eventId);
      setRegistered(true);
      setRegistrationMessage("Registration successful.");
    } catch (error) {
      setRegistrationMessage(
        error instanceof Error ? error.message : "Registration failed."
      );
    } finally {
      setRegistrationBusy(false);
    }
  };

  return (
    <main className="event-detail-page events-page relative h-[100svh] overflow-hidden text-white">
      <LiquidGradientBackground />
      <Navbar />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-5 pb-6 pt-24 sm:px-10 lg:px-16">
        <Link
          to="/events"
          className="event-detail-back group mb-4 inline-flex w-fit items-center gap-2 font-a24 text-xs uppercase tracking-[0.12em] text-white/60 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          aria-label="Back to events"
        >
          <ArrowLeft
            size={15}
            className="transition-transform group-hover:-translate-x-1"
          />
          Back to events
        </Link>

        <div className="event-detail-content grid min-h-0 flex-1 items-center gap-8 lg:grid-cols-[minmax(280px,0.55fr)_minmax(0,1.45fr)] lg:gap-8">
          <div className="event-detail-poster-wrap relative right-20 bottom-5 lg:justify-start">
            <EventPoster event={event} metadata={cardMetadata} />
          </div>

          <div className="event-detail-copy min-w-0">
            <section className="event-detail-header relative bottom-6 left-4 text-left">
              <p
                className="mb-3 text-left font-space-mono text-[10px] uppercase tracking-[0.3em]"
                style={{ color: accent }}
              >
                {event.category} / {eventType?.toUpperCase() ?? event.participation}
              </p>

              <EventTitle title={event.title} accent={accent} />
            </section>

            <section className="event-detail-info relative text-left">
              <p className="mt-5 font-space-mono text-xs uppercase leading-6 tracking-[0.1em] text-white/65 sm:text-sm">
                {registrationEvent?.description?.trim() || event.description}
              </p>

              <div className="mt-6 border-y border-white/15 py-4">
                <h2 className="font-a24 text-sm uppercase tracking-[0.15em] text-white">
                  Event leads
                </h2>

                <div className="mt-4 grid gap-3 font-space-mono text-xs uppercase tracking-[0.12em] text-white/65 sm:grid-cols-2">
                  <p>
                    Lead1{" "}
                    <span className="ml-3 text-white/35">
                      +91 98765 43210
                    </span>
                  </p>
                  <p>
                    Lead2{" "}
                    <span className="ml-3 text-white/35">
                      +91 98765 43210
                    </span>
                  </p>
                </div>
              </div>

              {brochureUrl ? (
                <a
                  href={brochureUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 font-space-mono text-[10px] uppercase tracking-[0.18em] text-white/70 underline decoration-white/30 underline-offset-8 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  View brochure <ExternalLink size={13} />
                </a>
              ) : brochureLoading ? (
                <p role="status" className="mt-5 font-space-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                  Loading brochure…
                </p>
              ) : null}

              <div className="mt-10 flex flex-wrap gap-3">
                {registrationEvent === undefined ? (
                  <div
                    role="status"
                    aria-label="Loading registration options"
                    className="flex items-center gap-3"
                  >
                    <span className="h-10 w-32 animate-pulse rounded-lg border border-white/10 bg-white/5" />
                    <span className="h-10 w-28 animate-pulse rounded-lg border border-white/10 bg-white/5" />
                    <span className="sr-only">Loading registration options…</span>
                  </div>
                ) : registrationEvent === null ? (
                  <p role="status" className="font-space-mono text-xs text-white/65">
                    {registrationMessage || "Registration is unavailable for this event."}
                  </p>
                ) : registrationCheck === "failed" ? (
                  <>
                    <p role="alert" className="self-center font-space-mono text-xs text-red-200">
                      Could not check your registration.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setRegistrationCheck("checking");
                        setRegistrationCheckAttempt((attempt) => attempt + 1);
                      }}
                      className="event-action-button font-a24"
                    >
                      Try again
                    </button>
                  </>
                ) : submittedTeam ? (
                  <button
                    type="button"
                    disabled={registrationBusy}
                    onClick={() => void loadSubmittedTeam(submittedTeam)}
                    className="event-action-button event-action-button-primary font-a24 disabled:opacity-50"
                  >
                    {registrationBusy ? "Loading team details..." : "Load team details"}
                  </button>
                ) : eventType === "team" ? (
                  <>
                    {!team && (
                      <>
                        <button
                          type="button"
                          onClick={() => setTeamMode("create")}
                          className="event-action-button event-action-button-primary font-a24"
                        >
                          Create team
                        </button>

                        <button
                          type="button"
                          onClick={() => setTeamMode("join")}
                          className="event-action-button event-action-button-teal font-a24"
                        >
                          Join team
                        </button>
                      </>
                    )}

                    {team && (
                      <>
                        <RegisteredBadge
                          note={team.registration_id
                            ? undefined
                            : team.status === "forming"
                              ? "Team forming · Event registration pending"
                              : "Event registration pending"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowTeam(true)}
                          className="event-action-button event-action-button-primary font-a24"
                        >
                          View team
                        </button>
                      </>
                    )}
                  </>
                ) : registered ? (
                  <RegisteredBadge />
                ) : (
                  <button
                    type="button"
                    disabled={registrationBusy}
                    onClick={handleSoloRegistration}
                    className="event-action-button event-action-button-primary font-a24 disabled:opacity-50"
                  >
                    {registrationBusy ? "Registering..." : "Register"}
                  </button>
                )}
              </div>

              {registrationEvent && registrationCheck === "checking" && (
                <p role="status" className="mt-3 font-space-mono text-[10px] text-white/55">
                  Syncing your registration status…
                </p>
              )}

              {registrationEvent && registrationMessage && (
                <p
                  role="status"
                  className="mt-3 font-space-mono text-[10px] text-white/65"
                >
                  {registrationMessage}
                </p>
              )}

              {teamMode && (
                <TeamModal
                  mode={teamMode}
                  eventName={event.title}
                  onClose={() => setTeamMode(null)}
                  onSubmit={handleTeamSubmit}
                />
              )}

              {successTeam && (
                <TeamSuccessModal
                  team={successTeam.team}
                  mode={successTeam.mode}
                  eventName={
                    successTeam.team.event_id === eventId ? event.title : successTeam.team.event_name
                  }
                  onClose={() => setSuccessTeam(null)}
                />
              )}

              <ViewTeamModal
                team={showTeam ? team : null}
                onClose={() => setShowTeam(false)}
                onTeamDeleted={(teamId) => {
                  setTeam((current) => current?.id === teamId ? null : current);
                  setRegistrationMessage("Team deleted.");
                }}
                onTeamUpdated={setTeam}
              />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

const EventDetail = () => {
  const { eventSlug } = useParams();
  const event = mockEvents.find((item) => item.slug === eventSlug);

  if (!event) return <Navigate to="/events" replace />;
  return <EventDetailContent key={event.slug} event={event} />;
};

export default EventDetail;
