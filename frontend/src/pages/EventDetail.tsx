import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import LiquidGradientBackground from "../components/LiquidGradientBackground";
import { mockEvents, type Event, type EventCategory } from "../data/events";

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

const EventPoster = ({ event }: { event: Event }) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const accent = categoryAccent[event.category];

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
              src={event.image}
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
              <span className="flex min-w-0 items-center gap-2"><MapPin size={12} style={{ color: accent }} />{event.venue}</span>
              <span className="flex min-w-0 items-center gap-2"><Users size={12} style={{ color: accent }} />{event.team_size}</span>
              <span className="flex min-w-0 items-center gap-2"><Calendar size={12} style={{ color: accent }} />{new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              <span className="flex min-w-0 items-center gap-2"><Trophy size={12} style={{ color: accent }} />Upto {event.prize_pool}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EventDetail = () => {
  const { eventSlug } = useParams();
  const event = mockEvents.find((item) => item.slug === eventSlug);

  if (!event) return <Navigate to="/events" replace />;

  const accent = categoryAccent[event.category];

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
                {event.category} / {event.participation}
              </p>
              <EventTitle title={event.title} accent={accent} />
            </section>
            <section className="event-detail-info relative text-left">
              <p className="mt-5 font-space-mono text-xs uppercase leading-6 tracking-[0.1em] text-white/65 sm:text-sm">
              {event.description}
              </p>
              <div className="mt-6 border-y border-white/15 py-4">
                <h2 className="font-a24 text-sm uppercase tracking-[0.15em] text-white">Event leads</h2>
                <div className="mt-4 grid gap-3 font-space-mono text-xs uppercase tracking-[0.12em] text-white/65 sm:grid-cols-2">
                  <p>Lead1 <span className="ml-3 text-white/35">+91 98765 43210</span></p>
                  <p>Lead2 <span className="ml-3 text-white/35">+91 98765 43210</span></p>
                </div>
              </div>
              <a
                href="https://example.com/sristi-brochure.pdf"
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 font-space-mono text-[10px] uppercase tracking-[0.18em] text-white/70 underline decoration-white/30 underline-offset-8 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                View brochure <ExternalLink size={13} />
              </a>
              <div className="mt-10 flex flex-wrap gap-3">
                {event.participation === "TEAM" ? (
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