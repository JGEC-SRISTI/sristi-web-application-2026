import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  Trophy,
} from "lucide-react";
import Navbar from "../components/Navbar";
import LiquidGradientBackground from "../components/LiquidGradientBackground";
import {
  mockEvents,
  type Event,
  type EventCategory,
  type ParticipationType,
} from "../data/events";
import { galleryData } from "../data/gallery";

interface DropdownProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

const Dropdown = ({ label, value, options, onChange }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? label;

  const offWhite = "#f2f2f2";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`
          flex items-center gap-2.5
          px-5 py-2.5
          rounded-lg
          font-a24 text-[11px] font-medium tracking-[0.02em] uppercase whitespace-nowrap
          border transition-all duration-300
          ${
            open
              ? "bg-[#f2f2f2]/10 shadow-[0_0_24px_rgba(242,242,242,0.1)]"
              : "bg-white/[0.03] hover:border-[#f2f2f2]/40"
          }
        `}
        style={{
          borderColor: open ? offWhite : "rgba(242,242,242,0.2)",
          color: open ? offWhite : "rgba(242,242,242,0.68)",
        }}
      >
        {selectedLabel}
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`
            dropdown-menu
            absolute top-full left-0 mt-3 z-50
            min-w-[180px]
            rounded-lg overflow-hidden
            border border-[#f2f2f2]/20
            bg-black/35 backdrop-blur-xl
            shadow-[0_16px_48px_rgba(0,0,0,0.7)]
            ${open ? "is-open" : ""}
          `}
        role="listbox"
        aria-label={label}
        aria-hidden={!open}
      >
        {options.map((opt, index) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
            }}
            className={`
                dropdown-item
                w-full text-left px-5 py-2.5
                font-a24 text-[11px] font-medium tracking-[-0.01em]
                ${
                  value === opt.value
                    ? "is-selected text-[#f2f2f2]"
                    : "text-[#f2f2f2]"
                }
              `}
            role="option"
            aria-selected={value === opt.value}
            tabIndex={open ? 0 : -1}
            style={{ transitionDelay: `${index * 45}ms` }}
          >
            <span className="dropdown-item-label">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// EVENT CARDS
interface EventCardProps {
  event: Event;
  position: number; // -2, -1, 0, 1, 2
  onClick: () => void;
}

const EventCard = ({ event, position, onClick }: EventCardProps) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const isCenter = position === 0;
  const abs = Math.abs(position);
  const imageIndex = [...event.id].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  ) % galleryData.length;
  const eventImage = galleryData[imageIndex]?.image;

  // card color accents based on category
  const categoryAccent: Record<EventCategory, string> = {
    Civilized:      "#fbbf24",
    Gaming:         "#f472b6",
    Management:     "#34d399",
    Mechanized:     "#fb923c",
    Robotics:       "#38bdf8",
    Tech:           "#a78bfa",
    Miscellaneous:  "#f472b6",
  };

  const accent = categoryAccent[event.category] ?? "#a78bfa";

  // transform values for 5-card spread
  const transforms: Record<number, { scale: number; blur: string; opacity: number }> = {
    0: { scale: 1,    blur: "0px",  opacity: 1 },
    1: { scale: 0.88, blur: "2px",  opacity: 0.65 },
    2: { scale: 0.75, blur: "4px",  opacity: 0.4 },
  };

  const t = transforms[abs] ?? { scale: 0.6, blur: "6px", opacity: 0.25 };

  // center card is widest and others are smaller
  const widthMap: Record<number, string> = {
    0: "360px",
    1: "240px",
    2: "190px",
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sceneRef.current || e.pointerType !== "mouse") return;

    const rect = sceneRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 2 - 1;
    const y = (e.clientY - rect.top) / rect.height * 2 - 1;
    const sheenX = ((e.clientX - rect.left) / rect.width) * 100;
    const sheenY = ((e.clientY - rect.top) / rect.height) * 100;
    const rotateX = y * 7;
    const rotateY = -x * 9;

    sceneRef.current.style.setProperty("--card-sheen-x", `${sheenX.toFixed(2)}%`);
    sceneRef.current.style.setProperty("--card-sheen-y", `${sheenY.toFixed(2)}%`);
    sceneRef.current.style.transform =
      `scale(var(--card-hover-scale)) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
  };

  const resetTilt = () => {
    if (sceneRef.current) {
      sceneRef.current.style.setProperty("--card-sheen-x", "50%");
      sceneRef.current.style.setProperty("--card-sheen-y", "35%");
      sceneRef.current.style.transform =
        "scale(var(--card-hover-scale)) rotateX(0deg) rotateY(0deg)";
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        event-card
        event-card-position-${position}
        flex-shrink-0
        transition-[transform,width,filter,opacity] duration-1200 ease-[cubic-bezier(0.02,1,0.7,1)]
        ${isCenter ? "z-20 cursor-pointer" : "z-10 cursor-pointer"}
      `}
      style={{
        width: widthMap[abs] ?? "160px",
        transform: `scale(${t.scale})`,
        filter: `blur(${t.blur})`,
        opacity: t.opacity,
        perspective: "1200px",
      }}
    >
      <div
        ref={sceneRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        className="event-card-scene"
        style={{
          transform: "scale(var(--card-hover-scale)) rotateX(0deg) rotateY(0deg)",
          color: accent,
        }}
      >
        <div
          className="event-card-shell relative rounded-2xl backdrop-blur-md transition-all duration-500"
          style={{
            background: "#111116ee",
            color: accent,
            border: `1px solid ${accent}`,
            boxShadow: isCenter
              ? `0 0 40px ${accent}20, 0 24px 64px rgba(0,0,0,0.7), inset 0 0 0 1px ${accent}18`
              : `0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px ${accent}12`,
          }}
        >
          <div
            className="
              relative overflow-hidden rounded-t-2xl flex items-center justify-center
              h-52 sm:h-72
            "
            style={{
              background: `radial-gradient(ellipse at 50% 30%, ${accent}18 0%, transparent 70%)`,
            }}
          >
            {eventImage && (
              <img
                src={eventImage}
                alt={`${event.title} event`}
                className="absolute inset-0 h-full w-full object-cover opacity-75"
              />
            )}
            <div className="absolute inset-0 bg-black/35" />

            <span
              className="
                absolute top-3 left-3
                px-2.5 py-1 rounded-md
                font-space-mono text-[8px] font-bold tracking-[0.18em] uppercase
                bg-black/40 border border-white/10
              "
            >
              {event.category}
            </span>

          </div>

          <div className="px-4 pb-5 pt-3 space-y-2.5">
            <h3 className="font-squid text-xl sm:text-2xl text-white leading-tight tracking-wide">
              {event.title}
            </h3>

            {isCenter && (
              <p className="font-space-mono text-[10px] text-white/35 leading-relaxed line-clamp-2 uppercase tracking-wider">
                {event.description}
              </p>
            )}

            {isCenter && (
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-white/35 text-[9px] font-space-mono uppercase tracking-[0.12em]">
                  <Trophy size={10} style={{ color: accent }} />
                  <span>Upto {event.prize_pool}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/35 text-[9px] font-space-mono uppercase tracking-[0.12em]">
                  <Users size={10} style={{ color: accent }} />
                  <span>{event.team_size.toUpperCase()}</span>
                </div>
              </div>
            )}
          </div>
        </div>{/* /front face */}
      </div>{/* /3d scene */}
    </div>
  );
};


const SplashHeading = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLHeadingElement>(null);

  const mouse = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const hovering = useRef(false);
  const rafId = useRef(0);

  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      pos.current.x = lerp(pos.current.x, mouse.current.x, 0.08);
      pos.current.y = lerp(pos.current.y, mouse.current.y, 0.08);

      if (overlayRef.current) {
        overlayRef.current.style.setProperty("--splash-x", `${pos.current.x}px`);
        overlayRef.current.style.setProperty("--splash-y", `${pos.current.y}px`);
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

  const handleEnter = () => {
    hovering.current = true;
    overlayRef.current?.classList.add("is-visible");
  };

  const handleLeave = () => {
    hovering.current = false;
    overlayRef.current?.classList.remove("is-visible");
  };

  return (
    <div
      ref={wrapRef}
      className="events-splash-wrap relative inline-block"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <h1 className="font-squid text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white/90 leading-none tracking-wider select-none py-4">
        events
      </h1>
      <h1
        ref={overlayRef}
        aria-hidden="true"
        className="events-splash-overlay font-squid text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-none tracking-wider select-none pointer-events-none"
      >
        events
      </h1>
    </div>
  );
};


const CATEGORY_OPTIONS = [
  { label: "All categories", value: "ALL" },
  { label: "Civilized", value: "Civilized" },
  { label: "Gaming", value: "Gaming" },
  { label: "Management", value: "Management" },
  { label: "Mechanized", value: "Mechanized" },
  { label: "Robotics", value: "Robotics" },
  { label: "Tech", value: "Tech" },
  { label: "Miscellaneous", value: "Miscellaneous" },
];

const PARTICIPATION_OPTIONS = [
  { label: "Solo & team", value: "ALL" },
  { label: "Solo", value: "SOLO" },
  { label: "Team", value: "TEAM" },
];

const Events = () => {
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [participationFilter, setParticipationFilter] = useState("ALL");
  const [activeIndex, setActiveIndex] = useState(0);
  const [filterRevision, setFilterRevision] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setShowIntro(false);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const filteredEvents = mockEvents.filter((e) => {
    const catOk =
      categoryFilter === "ALL" || e.category === categoryFilter;
    const partOk =
      participationFilter === "ALL" || e.participation === participationFilter;
    return catOk && partOk;
  });

  const handleCategoryChange = (val: string) => {
    setCategoryFilter(val as EventCategory | "ALL");
    setActiveIndex(0);
    setFilterRevision((revision) => revision + 1);
  };
  const handleParticipationChange = (val: string) => {
    setParticipationFilter(val as ParticipationType | "ALL");
    setActiveIndex(0);
    setFilterRevision((revision) => revision + 1);
  };

  const goLeft = useCallback(() => {
    setActiveIndex((prev) =>
      (prev - 1 + filteredEvents.length) % filteredEvents.length
    );
  }, [filteredEvents.length]);

  const goRight = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % filteredEvents.length);
  }, [filteredEvents.length]);

  const getVisibleCards = () => {
    if (filteredEvents.length === 0) return [];
    const visible: { event: Event; position: number }[] = [];
    for (let offset = -2; offset <= 2; offset++) {
      const idx =
        (activeIndex + offset + filteredEvents.length) % filteredEvents.length;
      visible.push({ event: filteredEvents[idx], position: offset });
    }
    return visible;
  };

  const visibleCards = getVisibleCards();

  return (
    <main className="events-page h-screen w-screen overflow-hidden text-white flex flex-col">

      <LiquidGradientBackground />

      <Navbar />

      <div className="relative z-10 flex-1 flex flex-col pt-18 pb-4 px-4 sm:px-8">

        <div className="events-header grid grid-cols-[1fr_auto_1fr] items-start mb-2 sm:mb-4">

          <div className="events-heading text-center">
            <SplashHeading />
            <p className="whitespace-nowrap font-space-mono text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-white/80 mt-2">
              SRISTI 2K26 — CHOOSE YOUR ARENA
            </p>
          </div>

          <div className="events-filters">
            <div className="events-filter events-filter-left">
              <Dropdown
                label="Solo/Team"
                value={participationFilter}
                options={PARTICIPATION_OPTIONS}
                onChange={handleParticipationChange}
              />
            </div>
            <div className="events-filter events-filter-right">
              <Dropdown
                label="Category"
                value={categoryFilter}
                options={CATEGORY_OPTIONS}
                onChange={handleCategoryChange}
              />
            </div>
          </div>
        </div>

        <div className="events-card-stage relative flex-1 flex items-center justify-center min-h-0">

          <button
            type="button"
            onClick={goLeft}
            aria-label="Previous event"
            disabled={filteredEvents.length <= 1}
            className="
              events-carousel-arrow
              absolute left-0 sm:left-2 z-30
              w-10 h-10 sm:w-12 sm:h-12 rounded-full
              flex items-center justify-center
              border border-white/10 bg-black/30 backdrop-blur-md text-white/50
              hover:border-[#c084fc]/40 hover:text-[#c084fc] hover:bg-black/50
              transition-all duration-300
              disabled:opacity-20 disabled:cursor-not-allowed
            "
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={goRight}
            aria-label="Next event"
            disabled={filteredEvents.length <= 1}
            className="
              events-carousel-arrow
              absolute right-0 sm:right-2 z-30
              w-10 h-10 sm:w-12 sm:h-12 rounded-full
              flex items-center justify-center
              border border-white/10 bg-black/30 backdrop-blur-md text-white/50
              hover:border-[#c084fc]/40 hover:text-[#c084fc] hover:bg-black/50
              transition-all duration-300
              disabled:opacity-20 disabled:cursor-not-allowed
            "
          >
            <ChevronRight size={18} />
          </button>

          {filteredEvents.length > 0 ? (
            <div
              key={filterRevision}
              className="events-carousel event-card-filter-transition flex items-center justify-center gap-3 sm:gap-5 lg:gap-6"
            >
              {visibleCards.map(({ event, position }) => (
                <EventCard
                  key={
                    filteredEvents.length > 4
                      ? event.id
                      : `${event.id}-${position}`
                  }
                  event={event}
                  position={position}
                  onClick={() => navigate(`/events/${event.slug}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center">
              <p className="font-space-mono text-sm text-white/30 tracking-widest uppercase">
                No events match your filters
              </p>
            </div>
          )}
        </div>
      </div>

      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-[100] bg-black transition-opacity duration-700 ease-out ${
          showIntro ? "opacity-100" : "opacity-0"
        }`}
      />
    </main>
  );
};

export default Events;
