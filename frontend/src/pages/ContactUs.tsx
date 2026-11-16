import { useEffect, useRef, useState } from "react";
import { ChevronDown, Circle, Square, Triangle } from "lucide-react";
import Navbar from "../components/Navbar";
import LiquidGradientBackground from "../components/LiquidGradientBackground";
import { mockEvents, type EventCategory } from "../data/events";

const categories: EventCategory[] = [
  "Civilized",
  "Robotics",
  "Tech",
  "Mechanized",
  "Management",
  "Gaming",
  "Miscellaneous",
];

const ContactHeading = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLHeadingElement>(null);

  const mouse = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
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

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    mouse.current.x = event.clientX - rect.left;
    mouse.current.y = event.clientY - rect.top;
  };

  return (
    <div
      ref={wrapRef}
      className="events-splash-wrap relative inline-block"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => overlayRef.current?.classList.add("is-visible")}
      onMouseLeave={() => overlayRef.current?.classList.remove("is-visible")}
    >
      <h1 className="font-squid text-4xl sm:text-6xl md:text-7xl text-white/90 leading-none tracking-wider select-none py-4">
        contact us
      </h1>
      <h1
        ref={overlayRef}
        aria-hidden="true"
        className="events-splash-overlay font-squid text-4xl sm:text-6xl md:text-7xl leading-none tracking-wider select-none pointer-events-none"
      >
        contact us
      </h1>
    </div>
  );
};

function ContactUs() {
  const [openCategory, setOpenCategory] = useState<EventCategory | null>(null);
  const [openEvent, setOpenEvent] = useState<string | null>(null);

  const toggleEvent = (eventId: string) => {
    setOpenEvent(openEvent === eventId ? null : eventId);
  };

  return (
    <main className="contact-us-page relative min-h-screen overflow-hidden bg-[#101010] text-white">
      <LiquidGradientBackground />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[#101010]/50" />

      <Navbar />

      <section className="relative z-10 px-5 pb-24 pt-36 bottom-18 sm:px-8 md:pt-44">
        <div className="mx-auto max-w-6xl">
          <header className="mx-auto mb-14 max-w-2xl text-center md:mb-20">
            <ContactHeading />
            <p className="whitespace-nowrap font-space-mono text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-white/80 mt-2">
              EVENT CO-ORDINATORS // SRISTI 2K26
            </p>
          </header>

          <div className="space-y-4">
            {categories.map((category) => {
              const isOpen = openCategory === category;
              const events = mockEvents.filter((event) => event.category === category);

              return (
                <div key={category} className="contact-category-group">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenCategory(isOpen ? null : category)}
                    className="contact-category-card group flex w-full items-center gap-5 rounded-lg border border-pink-200/45 bg-[#171717]/95 px-6 py-5 text-left transition-all duration-300 hover:border-pink-200/80 hover:bg-[#1d181f] sm:px-9 sm:py-6"
                  >
                    <span className="min-w-0 flex-1 font-title text-lg lowercase tracking-wide text-pink-200 sm:text-2xl">
                      {category}
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-pink-200/80 transition-transform duration-300 group-hover:translate-x-1 sm:gap-4">
                      <span className="contact-category-shape">
                        <Circle className="contact-category-shape-outline h-5 w-5" strokeWidth={1.6} />
                        <Circle aria-hidden="true" className="contact-category-shape-fill h-5 w-5" stroke="none" />
                      </span>
                      <span className="contact-category-shape">
                        <Triangle className="contact-category-shape-outline h-5 w-5" strokeWidth={1.6} />
                        <Triangle aria-hidden="true" className="contact-category-shape-fill h-5 w-5" stroke="none" />
                      </span>
                      <span className="contact-category-shape">
                        <Square className="contact-category-shape-outline h-5 w-5" strokeWidth={1.6} />
                        <Square aria-hidden="true" className="contact-category-shape-fill h-5 w-5" stroke="none" />
                      </span>
                      <ChevronDown
                        className={`ml-1 h-5 w-5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                        strokeWidth={1.6}
                      />
                    </span>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div
                        className="contact-event-list ml-3 border-x border-b border-pink-200/20 bg-[#1d1b20]/90 py-2 sm:ml-6"
                      >
                        {events.map((event) => (
                          <div
                            key={event.id}
                            role="button"
                            tabIndex={0}
                            aria-expanded={openEvent === event.id}
                            onClick={() => toggleEvent(event.id)}
                            onKeyDown={(keyboardEvent) => {
                              if (keyboardEvent.target !== keyboardEvent.currentTarget) return;
                              if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                                keyboardEvent.preventDefault();
                                toggleEvent(event.id);
                              }
                            }}
                            className={`contact-event-card w-full border-b border-pink-100/10 px-5 py-4 text-left last:border-b-0 sm:px-8 ${openEvent === event.id ? "is-open" : ""}`}
                          >
                            <span className="contact-event-card-title font-ui text-sm text-pink-100/80 sm:text-base">
                              {event.title}
                            </span>

                            {openEvent === event.id && (
                              <span className="contact-coordinator-grid">
                                {["NAME 1", "NAME 2"].map((coordinator) => (
                                  <span key={coordinator} className="contact-coordinator-card">
                                    <span className="contact-coordinator-copy">
                                      <span className="contact-coordinator-name">{coordinator}</span>
                                      <a
                                        href="mailto:placeholder@email.com"
                                        onClick={(clickEvent) => clickEvent.stopPropagation()}
                                        className="contact-coordinator-detail contact-coordinator-link"
                                      >
                                        placeholder@email.com
                                      </a>
                                    </span>
                                      <a
                                        href="tel:+910000000000"
                                        onClick={(clickEvent) => clickEvent.stopPropagation()}
                                        className="contact-coordinator-phone contact-coordinator-link"
                                      >
                                        +91 00000 00000
                                      </a>
                                  </span>
                                ))}
                              </span>
                            )}
                            </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

export default ContactUs;