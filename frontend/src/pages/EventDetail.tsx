import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Users,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import LiquidGradientBackground from "../components/LiquidGradientBackground";
import { getEventImage, type EventRecord, type EventCategory } from "../data/events";
import { supabase } from "../lib/supabase";

const categoryAccent: Record<EventCategory, string> = {
  Civilized: "#fbbf24",
  Gaming: "#f472b6",
  Management: "#34d399",
  Mechanized: "#fb923c",
  Robotics: "#38bdf8",
  Tech: "#a78bfa",
  Miscellaneous: "#f472b6",
};

const EventTitle = ({ title, accent }: { title: string; accent: string }) => {
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
          `${position.current.x}px`,
        );
        overlayRef.current.style.setProperty(
          "--splash-y",
          `${position.current.y}px`,
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
      <h1 className="max-w-full break-words py-4 text-left font-squid text-5xl leading-[0.88] tracking-wide text-white sm:text-7xl lg:text-8xl ">
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

const EventPoster = ({ event }: { event: EventRecord }) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const accent = categoryAccent[event.category] ?? "#a78bfa";

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sceneRef.current || e.pointerType !== "mouse") return;
    const rect = sceneRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    sceneRef.current.style.setProperty(
      "--card-sheen-x",
      `${(((e.clientX - rect.left) / rect.width) * 100).toFixed(2)}%`,
    );
    sceneRef.current.style.setProperty(
      "--card-sheen-y",
      `${(((e.clientY - rect.top) / rect.height) * 100).toFixed(2)}%`,
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
              src={getEventImage(event.name)}
              alt={`${event.name} event`}
              className="absolute inset-0 h-full w-full object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-black/35" />
            <span className="absolute left-5 top-5 rounded-md border border-white/10 bg-black/40 px-3 py-1.5 font-space-mono text-[9px] font-bold uppercase tracking-[0.18em]">
              {event.category}
            </span>
          </div>
          <div className="space-y-4 px-6 pb-6 pt-5">
            <h2 className="font-squid text-3xl leading-tight tracking-wide text-white sm:text-4xl">
              {event.name}
            </h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3 font-space-mono text-[9px] uppercase tracking-[0.12em] text-white/40">
              <span className="flex min-w-0 items-center gap-2"><MapPin size={12} style={{ color: accent }} />{event.venue}</span>
              <span className="flex min-w-0 items-center gap-2"><Users size={12} style={{ color: accent }} />{event.event_type === "team" ? `${event.min_team_size}-${event.max_team_size} members` : "Individual"}</span>
              <span className="flex min-w-0 items-center gap-2"><MapPin size={12} style={{ color: accent }} />{event.venue}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EventDetail = () => {
  const { eventSlug } = useParams();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [brochureUrl, setBrochureUrl] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client || !eventSlug) {
      setIsLoading(false);
      if (!client) setLoadError("Event service is not configured.");
      return;
    }

    let mounted = true;
    const loadEvent = async () => {
      const { data, error } = await client
        .from("events")
        .select("id,name,slug,short_description,description,event_type,category,venue,min_team_size,max_team_size,created_at,updated_at")
        .eq("slug", eventSlug)
        .maybeSingle();

      if (!mounted) return;
      setIsLoading(false);
      if (error) {
        setLoadError(error.message);
        return;
      }
      setEvent((data as EventRecord | null) ?? null);
    };

    const loadBrochure = async () => {
      const { data: eventRow, error: eventError } = await client
        .from("events")
        .select("id")
        .eq("slug", eventSlug)
        .maybeSingle();

      if (eventError || !eventRow) return;

      const { data: brochure, error: brochureError } = await client
        .from("event_files")
        .select("file_path")
        .eq("event_id", eventRow.id)
        .eq("file_type", "brochure")
        .maybeSingle();

      if (brochureError || !brochure || !mounted) return;

      const { data } = client.storage
        .from("event-files")
        .getPublicUrl(brochure.file_path);
      if (mounted) setBrochureUrl(data.publicUrl);
    };

    void loadEvent();
    void loadBrochure();
    return () => {
      mounted = false;
    };
  }, [eventSlug]);

  if (isLoading) {
    return <main className="events-page flex h-screen items-center justify-center text-white"><p className="font-space-mono text-sm uppercase tracking-widest text-white/50">Loading event...</p></main>;
  }
  if (!event) {
    if (loadError) return <main className="events-page flex h-screen items-center justify-center px-6 text-center text-red-300/80"><p className="font-space-mono text-sm uppercase tracking-widest">Could not load event: {loadError}</p></main>;
    return <Navigate to="/events" replace />;
  }

  const accent = categoryAccent[event.category] ?? "#a78bfa";

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
          <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" />
          Back to events
        </Link>
        <div className="event-detail-content grid min-h-0 flex-1 items-center gap-8 lg:grid-cols-[minmax(280px,0.55fr)_minmax(0,1.45fr)] lg:gap-8">
          <div className="event-detail-poster-wrap relative right-20 bottom-5 lg:justify-start">
            <EventPoster event={event} />
          </div>
          <div className="event-detail-copy min-w-0">
            <section className="event-detail-header relative bottom-6 left-4 text-left">
              <p
                className="mb-3 text-left font-space-mono text-[10px] uppercase tracking-[0.3em]"
                style={{ color: accent }}
              >
                {event.category} / {event.event_type}
              </p>
              <EventTitle title={event.name} accent={accent} />
            </section>
            <section className="event-detail-info relative text-left">
              <p className="mt-5 font-space-mono text-xs uppercase leading-6 tracking-[0.1em] text-white/65 sm:text-sm">
              {event.description}
              </p>
              {brochureUrl && (
                <a
                  href={brochureUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 font-space-mono text-[10px] uppercase tracking-[0.18em] text-white/70 underline decoration-white/30 underline-offset-8 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  View brochure <ExternalLink size={13} />
                </a>
              )}
              <div className="mt-10 flex flex-wrap gap-3">
                {event.event_type === "team" ? (
                  <>
                    <button type="button" className="event-action-button event-action-button-primary font-a24">Create team</button>
                    <button type="button" className="event-action-button font-a24">Join team</button>
                  </>
                ) : (
                  <button type="button" className="event-action-button event-action-button-primary font-a24">Register</button>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default EventDetail;