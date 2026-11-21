import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, TicketCheck, Users } from "lucide-react";
import {
  fetchPlayerRegistrations,
  type RegistrationItem,
} from "../../services/teamService";
import ViewTeamModal from "./ViewTeamModal";

export default function RegisteredEventsDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedTeam, setSelectedTeam] =
    useState<RegistrationItem["team"]>(null);
  const [placement, setPlacement] = useState({ above: false, maxHeight: 460 });

  const panelId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasLoadedRef = useRef(false);

  useLayoutEffect(() => {
    if (!open) return;

    const positionPanel = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const bounds = trigger.getBoundingClientRect();
      const navbar = trigger.closest("main")?.querySelector("nav");
      const topBoundary = Math.max(0, navbar?.getBoundingClientRect().bottom ?? 0);
      const below = window.innerHeight - bounds.bottom - 24;
      const above = bounds.top - topBoundary - 24;
      const openAbove = below < 180 && above > below;
      setPlacement({
        above: openAbove,
        maxHeight: Math.max(0, Math.min(460, openAbove ? above : below)),
      });
    };

    positionPanel();
    window.addEventListener("resize", positionPanel);
    return () => window.removeEventListener("resize", positionPanel);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && ref.current?.contains(document.activeElement)) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let active = true;
    fetchPlayerRegistrations()
      .then((registrations) => {
        if (active) {
          hasLoadedRef.current = true;
          setItems(registrations);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setMessage(
            hasLoadedRef.current
              ? "Could not refresh. Showing your last loaded registrations."
              : error instanceof Error
                ? error.message
                : "Unable to load registrations."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      // Keep the last result on screen while refreshing in the background.
      setLoading(true);
      setMessage("");
    }
    setOpen(!open);
  };

  return (
    <>
      <div ref={ref} className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          className={`flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 font-a24 text-[10px] uppercase tracking-wider transition ${
            open
              ? "border-pink-300/60 bg-pink-400/10 text-pink-100"
              : "border-white/20 bg-white/[0.03] text-white/65 hover:border-pink-300/40 hover:text-white"
          }`}
        >
          <TicketCheck size={14} />
          Registered events
          <ChevronDown
            size={13}
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div
            id={panelId}
            style={{ maxHeight: placement.maxHeight }}
            className={`absolute left-1/2 z-[90] w-[min(360px,calc(100vw_-_2rem))] -translate-x-1/2 overflow-y-auto overscroll-contain border border-white/15 bg-[#101014]/15 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl md:right-0 md:left-auto md:translate-x-0 ${
              placement.above ? "bottom-full mb-3" : "top-full mt-3"
            }`}
          >
            <p className="px-2 pb-3 font-space-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
              Your registrations
            </p>

            {loading ? (
              <p className="px-2 py-5 font-space-mono text-[10px] text-white/50">
                Loading...
              </p>
            ) : message ? (
              <p
                role="alert"
                className="px-2 py-4 font-space-mono text-[10px] text-red-200"
              >
                {message}
              </p>
            ) : items.length === 0 ? (
              <p className="px-2 py-5 font-space-mono text-[10px] text-white/45">
                No registered events yet.
              </p>
            ) : (
              
                <ul
                  className={`space-y-1 ${
                    items.length > 4
                      ? "max-h-60 overflow-y-auto overscroll-contain pr-2 registered-events-list"
                      : ""
                  }`}
                >

                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-2 py-3 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-a24 text-xs uppercase text-white">
                        {item.event_name}
                      </p>
                      <p className="mt-1 font-space-mono text-[9px] uppercase tracking-wider text-emerald-200/70">
                        Registered
                        {item.team ? ` · ${item.team.team_name}` : " · Solo"}
                      </p>
                    </div>

                    {item.team && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTeam(item.team);
                          setOpen(false);
                        }}
                        className="flex shrink-0 items-center gap-1.5 border border-cyan-300/25 px-2.5 py-2 font-space-mono text-[9px] uppercase text-cyan-100/80 hover:border-cyan-200/60 hover:text-cyan-100"
                      >
                        <Users size={12} />
                        View team
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <ViewTeamModal
        team={selectedTeam}
        onClose={() => setSelectedTeam(null)}
        onTeamDeleted={(teamId) => {
          setItems((current) => current.filter((item) => item.team?.id !== teamId));
        }}
      />
    </>
  );
}
