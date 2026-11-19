
import { useEffect, useId, useState } from "react";
import {
  X,
  Users,
  Check,
  CircleAlert,
  Loader2,
  KeyRound,
} from "lucide-react";
import { fetchPlayerVerification, type TeamInfo } from "../../services/teamService";
import TeamCodeCard from "./TeamCodeCard";

interface TeamModalProps {
  mode: "create" | "join";
  eventName: string;
  onClose: () => void;
  onSubmit: (value: string) => Promise<void>;
}

interface TeamSuccessModalProps {
  team: TeamInfo;
  mode: TeamModalProps["mode"];
  eventName?: string;
  onClose: () => void;
}

const overlayClass =
  "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4";

const TeamModal = ({
  mode,
  eventName,
  onClose,
  onSubmit,
}: TeamModalProps) => {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verification, setVerification] = useState<"checking" | "verified" | { message: string }>("checking");
  const [verificationAttempt, setVerificationAttempt] = useState(0);

  const formId = useId();
  const isCreate = mode === "create";

  useEffect(() => {
    let active = true;
    fetchPlayerVerification()
      .then((verified) => {
        if (active) {
          setVerification(
            verified ? "verified" : { message: "Verify your participant code from your profile to continue." }
          );
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setVerification({
            message: error instanceof Error ? error.message : "Could not check verification.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [verificationAttempt]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading || verification !== "verified") return;
    setError("");

    if (!value.trim()) {
      setError(isCreate ? "Please enter a team name." : "Please enter your team code.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(value.trim());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={overlayClass}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-title`}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/15 bg-[#111219] shadow-[0_24px_90px_rgba(0,0,0,0.65)]"
      >
        <header
          className={`flex items-start gap-3 border-b border-white/10 bg-linear-to-br px-5 py-5 sm:gap-4 sm:px-7 sm:py-6 ${
            isCreate ? "from-pink-500/15 to-transparent" : "from-teal-400/15 to-transparent"
          }`}
        >
          <div
            aria-hidden="true"
            className={`grid size-11 shrink-0 place-items-center rounded-xl border ${
              isCreate ? "border-pink-400/30 bg-pink-400/10 text-pink-300" : "border-teal-300/30 bg-teal-300/10 text-teal-200"
            }`}
          >
            {isCreate ? <Users size={21} /> : <KeyRound size={21} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="wrap-anywhere font-space-mono text-[10px] leading-4 tracking-widest text-white/65">
              {eventName}
            </p>
            <h2 id={`${formId}-title`} className="mt-1 font-squid text-2xl uppercase leading-tight tracking-wide text-white sm:text-3xl">
              {isCreate ? "Create Team" : "Join Team"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-black/20 text-white/70 transition-colors enabled:hover:border-white/30 enabled:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-40"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSubmit} aria-busy={loading} className="space-y-5 p-5 sm:p-7">
          <div>
            <label htmlFor={`${formId}-input`} className="mb-2 block text-sm font-semibold text-white/90">
              {isCreate ? "Team name" : "Team invite code"}
            </label>
            <input
              id={`${formId}-input`}
              aria-describedby={`${formId}-hint`}
              type="text"
              value={value}
              onChange={(e) => {
                setValue(isCreate ? e.target.value : e.target.value.toUpperCase());
                setError("");
              }}
              placeholder={isCreate ? "Enter your team name" : "A4F91C2B"}
              maxLength={isCreate ? 40 : undefined}
              autoComplete="off"
              autoCapitalize={isCreate ? undefined : "characters"}
              spellCheck={isCreate ? undefined : false}
              autoFocus
              className={`w-full rounded-lg border border-white/20 bg-black/30 px-4 py-3 text-base text-white outline-none transition-colors placeholder:text-white/40 focus:ring-2 ${
                isCreate ? "focus:border-pink-400 focus:ring-pink-400/25" : "font-space-mono tracking-[0.16em] focus:border-teal-300 focus:ring-teal-300/25"
              }`}
            />
            <p id={`${formId}-hint`} className="mt-2 text-sm leading-5 text-white/65">
              {isCreate
                ? "After you create your team, share its invite code with your teammates."
                : "Use the 8-character code from your team leader. It determines which event you join."}
            </p>
          </div>

          {verification === "checking" && (
            <p role="status" className="flex items-center gap-2 text-sm text-white/65">
              <Loader2 size={16} aria-hidden="true" className="motion-safe:animate-spin" />
              Checking player verification…
            </p>
          )}
          {typeof verification === "object" && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-300/25 bg-amber-300/8 px-3 py-2.5 text-sm leading-5 text-amber-100">
              <CircleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              <div>
                <p role="status">{verification.message}</p>
                <button
                  type="button"
                  className="mt-1 font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
                  onClick={() => {
                    setVerification("checking");
                    setVerificationAttempt((attempt) => attempt + 1);
                  }}
                >
                  Recheck verification
                </button>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-sm leading-5 text-red-200">
              <CircleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              <p className="min-w-0 wrap-anywhere">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || verification !== "verified" || !value.trim()}
            className={`flex min-h-12 w-full items-center justify-center gap-2 font-a24 disabled:cursor-not-allowed disabled:opacity-40 ${
              isCreate
                ? "rounded-lg border border-pink-400 bg-pink-600 px-4 py-3 text-xs uppercase tracking-widest text-white transition-colors enabled:hover:bg-pink-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-300"
                : "event-action-button event-action-button-teal"
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={16} aria-hidden="true" className="motion-safe:animate-spin" />
                {isCreate ? "Creating team…" : "Joining team…"}
              </>
            ) : isCreate ? "Create team" : "Join team"}
          </button>
        </form>
      </section>
    </div>
  );
};

export const TeamSuccessModal = ({
  team,
  mode,
  eventName,
  onClose,
}: TeamSuccessModalProps) => {
  const created = mode === "create";
  const canInvite = created && team.status === "forming" && !team.registration_id;

  return (
    <div className={overlayClass}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-success-title"
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/15 bg-[#111217] shadow-[0_24px_90px_rgba(0,0,0,0.65)]"
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

        <div className="p-6 text-center sm:p-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10 text-emerald-400">
            <Check size={32} />
          </div>

          {eventName && (
            <p className="font-space-mono text-[10px] uppercase tracking-[0.3em] text-emerald-400">
              {eventName}
            </p>
          )}

          <h2
            id="team-success-title"
            className="mt-3 font-squid text-3xl text-white"
          >
            {created ? "TEAM CREATED" : "TEAM JOINED"}
          </h2>

          <p className="mt-3 font-space-mono text-xs leading-6 text-white/45">
            {created
              ? canInvite
                ? "Share this invite code with your teammates."
                : "Your team has been created."
              : "You have successfully joined the team."}
          </p>

          <div className="mt-7 rounded-xl border border-white/10 bg-[#181a22] p-4">
            <p className="mb-2 font-space-mono text-[9px] uppercase tracking-[0.2em] text-white/55">
              Team Name
            </p>

            <h3 className="wrap-anywhere font-squid text-xl text-white">
              {team.team_name}
            </h3>
          </div>

          <div className="mt-2.5">
            <TeamCodeCard code={team.team_code} label={canInvite ? "Invite code" : "Team code"} />
          </div>

          <p className="mt-4 font-space-mono text-[9px] leading-5 text-white/40">
            {team.registration_id
              ? "Your team is registered and closed to new members."
              : team.status === "forming"
                ? "Your team is forming. Check View team for the roster and registration status."
                : "Team registration is pending. Check the status in View team."}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-lg border border-white/15 bg-white/5 px-5 py-3 font-a24 text-xs uppercase tracking-widest text-white transition-colors hover:border-emerald-300/40 hover:text-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
          >
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamModal;
