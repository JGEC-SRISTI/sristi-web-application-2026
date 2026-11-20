import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, ChevronDown, Circle, Square, Triangle } from "lucide-react";
import Navbar from "../components/Navbar";
import LiquidGradientBackground from "../components/LiquidGradientBackground";
import { mockEvents, type EventCategory } from "../data/events";
import { getEventCoordinators, type EventCoordinator } from "../data/eventContacts";

const categories: EventCategory[] = [
  "Civilized",
  "Robotics",
  "Technical",
  "Aeronautical",
  "Management",
  "Gaming",
  "Miscellaneous",
];

const directorGroups: { role: string; people: EventCoordinator[] }[] = [
  {
    role: "Event Manager",
    people: [
      { name: "Koustav Batabyal", phone: "8250796390", email: "kb2868@cse.jgec.ac.in" },
      { name: "Ambika Bag", phone: "7908642787", email: "ab2863@ce.jgec.ac.in" },
    ],
  },
  {
    role: "Event Planner",
    people: [
      { name: "Subhamoy Phadikar", phone: "9007347483", email: "sp2828@ece.jgec.ac.in" },
      { name: "Dyutimoy Dan", phone: "8910350260", email: "dd2875@me.jgec.ac.in" },
    ],
  },
];

const socialLinks = [
  { label: "Instagram", handle: "@sristi.jgec", icon: "bxl-instagram", href: "https://www.instagram.com/sristi.jgec/", external: true },
  { label: "LinkedIn", handle: "sristi-jgec", icon: "bxl-linkedin-square", href: "https://www.linkedin.com/company/sristi-jgec/", external: true },
  { label: "YouTube", handle: "@sristi-jgec", icon: "bxl-youtube", href: "https://www.youtube.com/@sristi-jgec", external: true },
  { label: "Email", handle: "contact@sristi2k26.tech", icon: "bx-envelope", href: "mailto:contact@sristi2k26.tech", external: false },
];

const categoryShapes = [Circle, Triangle, Square];

interface ContactSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function ContactSection({ title, isOpen, onToggle, children }: ContactSectionProps) {
  const panelId = useId();

  return (
    <div>
      <h2>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="contact-category-card group flex w-full items-center gap-3 px-6 py-5 text-left sm:gap-5 sm:px-9 sm:py-6"
        >
          <span className="min-w-0 flex-1 font-title text-[clamp(0.875rem,4.6vw,1.125rem)] lowercase tracking-wide text-pink-200 sm:text-2xl">
            {title}
          </span>
          <span aria-hidden="true" className="flex shrink-0 items-center gap-2 text-pink-200/80 transition-transform duration-300 group-hover:translate-x-1 sm:gap-4">
            {categoryShapes.map((Shape, index) => (
              <span key={index} className="contact-category-shape">
                <Shape className="contact-category-shape-outline size-full" strokeWidth={1.6} />
                <Shape className="contact-category-shape-fill size-full" stroke="none" />
              </span>
            ))}
            <ChevronDown
              className={`size-4 transition-transform duration-300 sm:ml-1 sm:size-5 ${isOpen ? "rotate-180" : ""}`}
              strokeWidth={1.6}
            />
          </span>
        </button>
      </h2>

      <div
        id={panelId}
        inert={!isOpen}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="contact-event-list mx-2 sm:mx-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function CoordinatorCards({ people }: { people: EventCoordinator[] }) {
  return (
    <span className="contact-coordinator-grid">
      {people.map(({ name, email, phone }) => (
        <span key={name} className="contact-coordinator-card">
          <span className="contact-coordinator-copy">
            <span className="contact-coordinator-name">{name}</span>
            <a
              href={`mailto:${email}`}
              onClick={(event) => event.stopPropagation()}
              className="contact-coordinator-detail contact-coordinator-link"
            >
              {email}
            </a>
          </span>
          <a
            href={`tel:${phone.replace(/[^+0-9]/g, "")}`}
            onClick={(event) => event.stopPropagation()}
            className="contact-coordinator-phone contact-coordinator-link"
          >
            {phone}
          </a>
        </span>
      ))}
    </span>
  );
}

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
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openEvent, setOpenEvent] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection((current) => current === section ? null : section);
  };

  const toggleEvent = (eventId: string) => {
    setOpenEvent((current) => current === eventId ? null : eventId);
  };

  return (
    <main className="contact-us-page relative min-h-screen overflow-hidden bg-[#101010] text-white">
      <LiquidGradientBackground />
      <div className="pointer-events-none fixed inset-0 z-1 bg-[#101010]/30" />

      <Navbar />

      <section className="relative z-10 px-5 pb-24 pt-36 bottom-18 sm:px-8 md:pt-44">
        <div className="mx-auto max-w-6xl">
          <header className="mx-auto mb-14 max-w-2xl text-center md:mb-20">
            <ContactHeading />
            <p className="mt-2 font-space-mono text-[10px] uppercase tracking-[0.22em] text-white/80 sm:text-[11px] sm:tracking-[0.35em]">
              EVENT CO-ORDINATORS // SRISTI 2K26
            </p>
          </header>

          <div className="space-y-4">
            <ContactSection
              title="Event Directors"
              isOpen={openSection === "Event Directors"}
              onToggle={() => toggleSection("Event Directors")}
            >
              <ul className="contact-director-branches">
                {directorGroups.map(({ role, people }) => (
                  <li key={role} className="contact-director-branch">
                    <h3 className="font-ui text-xs uppercase tracking-[0.16em] text-pink-200 sm:text-sm">{role}</h3>
                    <CoordinatorCards people={people} />
                  </li>
                ))}
              </ul>
            </ContactSection>

            {categories.map((category) => {
              const events = mockEvents.filter((event) => event.category === category);

              return (
                <ContactSection
                  key={category}
                  title={category}
                  isOpen={openSection === category}
                  onToggle={() => toggleSection(category)}
                >
                  <div className="py-2">
                    {events.map((event) => {
                      const coordinators = getEventCoordinators(event.id);
                      const isOpen = openEvent === event.id;

                      return (
                        <div
                          key={event.id}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isOpen}
                          onClick={() => toggleEvent(event.id)}
                          onKeyDown={(keyboardEvent) => {
                            if (keyboardEvent.target !== keyboardEvent.currentTarget) return;
                            if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                              keyboardEvent.preventDefault();
                              toggleEvent(event.id);
                            }
                          }}
                          className={`contact-event-card border-b border-pink-100/10 px-5 py-4 text-left last:border-b-0 sm:px-8 ${isOpen ? "is-open" : ""}`}
                        >
                          <span className="contact-event-card-title font-ui text-sm text-pink-100/80 sm:text-base">
                            {event.title}
                          </span>
                          {isOpen && coordinators.length > 0 && (
                            <CoordinatorCards people={coordinators} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ContactSection>
              );
            })}

            <ContactSection
              title="Social Handles"
              isOpen={openSection === "Social Handles"}
              onToggle={() => toggleSection("Social Handles")}
            >
              <ul className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
                {socialLinks.map(({ label, handle, icon, href, external }) => (
                  <li key={label} className="min-w-0">
                    <a
                      href={href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className="contact-social-link group flex h-full items-center gap-3"
                    >
                      <i className={`bx ${icon} shrink-0 text-2xl text-pink-200`} aria-hidden="true" />
                      <span className="contact-coordinator-copy flex-1">
                        <span className="font-ui text-sm font-semibold text-white">{label}</span>
                        <span className="contact-coordinator-detail">{handle}</span>
                      </span>
                      {external && <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-pink-200/70 group-hover:text-pink-200" />}
                    </a>
                  </li>
                ))}
              </ul>
            </ContactSection>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ContactUs;
