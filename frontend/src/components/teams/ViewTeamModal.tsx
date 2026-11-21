
import { useEffect, useId, useState } from "react";
import { ArrowRight, CircleAlert, Crown, Info, RefreshCw, Trash2, Users, X } from "lucide-react";
import {
  deleteTeam,
  fetchPlayerVerification,
  fetchTeamDetails,
  fetchTeamRoster,
  finalizeTeamRegistration,
  type TeamInfo,
  type TeamRosterMember,
} from "../../services/teamService";
import TeamCodeCard from "./TeamCodeCard";

interface Props {
  team: TeamInfo | null;
  onClose: () => void;
  onTeamDeleted: (teamId: string) => void;
  onTeamUpdated?: (team: TeamInfo) => void;
}

const headerButtonClass =
  "grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/65 transition-colors enabled:hover:border-white/30 enabled:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50";

export default function ViewTeamModal({ team, ...props }: Props) {
  if (!team) return null;
  return <TeamDetails key={team.id} initialTeam={team} {...props} />;
}

function TeamDetails({
  initialTeam,
  onClose,
  onTeamDeleted,
  onTeamUpdated,
}: Omit<Props, "team"> & { initialTeam: TeamInfo }) {
  const [team, setTeam] = useState(initialTeam);
  const [roster, setRoster] = useState<TeamRosterMember[]>();
  const [rosterError, setRosterError] = useState("");
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState("");
  const [refreshAttempt, setRefreshAttempt] = useState(0);
  const [registering, setRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [verification, setVerification] = useState<"checking" | "verified" | { message: string }>("checking");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const modalId = useId();
  const registrationWarningId = `${modalId}-registration-warning`;
  const teamId = initialTeam.id;

  useEffect(() => {
    if (confirmDelete) return;

    let active = true;
    const loadTeam = async () => {
      await fetchTeamRoster(teamId).then(
        (members) => {
          if (active) {
            setRoster(members);
            setRosterError("");
          }
        },
        (error: unknown) => {
          if (active) {
            setRosterError(error instanceof Error ? error.message : "Could not load the team roster.");
          }
        }
      );
      if (!active) return;

      // Read registration after the roster so a just-completed join is reflected.
      await fetchTeamDetails(teamId).then(
        (details) => {
          if (!active) return;
          setTeam(details);
          setStatusError("");
          onTeamUpdated?.(details);
        },
        () => {
          if (active) setStatusError("Could not refresh team registration.");
        }
      );
      if (active) setStatusLoading(false);
    };
    void loadTeam();
    return () => {
      active = false;
    };
  }, [teamId, refreshAttempt, onTeamUpdated, confirmDelete]);

  const { min_team_size: min, max_team_size: max } = team;
  const count = roster?.length ?? 0;
  const sizeMeetsRequirements =
    min !== null && max !== null && count >= min && count <= max;
  const leader = roster?.find((member) => member.is_leader);
  const isLeader = Boolean(leader?.is_you);
  const leaderName = leader?.full_name?.trim();
  const isRegistered = Boolean(team.registration_id);
  const isCancelled = team.status === "cancelled";
  const needsRetry =
    !statusLoading && !statusError && !isRegistered &&
    !isCancelled && sizeMeetsRequirements;
  const canInvite =
    team.status === "forming" &&
    !isRegistered &&
    max !== null &&
    count < max;
  const statusLabel = isRegistered
    ? "Registered"
    : isCancelled
      ? "Cancelled"
      : sizeMeetsRequirements
        ? "Ready to register"
        : team.status === "registered"
          ? "Registration pending"
          : "Forming";
  const needsLeaderVerification = Boolean(needsRetry && isLeader);
  const waitingForLeader = leader && !isLeader && !isRegistered && !isCancelled;
  const busy = registering || deleting;

  useEffect(() => {
    if (!canInvite || statusLoading || statusError || rosterError || confirmDelete) return;

    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setStatusLoading(true);
      setRefreshAttempt((attempt) => attempt + 1);
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [canInvite, statusLoading, statusError, rosterError, confirmDelete]);

  useEffect(() => {
    if (!needsLeaderVerification) return;

    let active = true;
    fetchPlayerVerification()
      .then((verified) => {
        if (active) {
          setVerification(
            verified ? "verified" : { message: "Verify your participant code to retry registration." }
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
  }, [needsLeaderVerification, refreshAttempt]);

  const refreshTeam = () => {
    setRoster(undefined);
    setRosterError("");
    setStatusLoading(true);
    setStatusError("");
    setRegistrationError("");
    setVerification("checking");
    setRefreshAttempt((attempt) => attempt + 1);
  };

  const retryRegistration = async () => {
    if (!needsLeaderVerification || verification !== "verified" || busy || confirmDelete) return;
    setRegistering(true);
    setRegistrationError("");
    try {
      const registrationId = await finalizeTeamRegistration(teamId);
      const registeredTeam: TeamInfo = {
        ...team,
        status: "registered",
        registration_id: registrationId,
      };
      setTeam(registeredTeam);
      onTeamUpdated?.(registeredTeam);
    } catch (error) {
      setRegistrationError(
        error instanceof Error ? error.message : "Could not register the team."
      );
    } finally {
      setRegistering(false);
    }
  };

  const confirmTeamDeletion = async () => {
    if (!isLeader || !confirmDelete || busy) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const deleted = await deleteTeam(teamId);
      if (!deleted) {
        setDeleteError("This team no longer exists.");
        return;
      }
      onTeamDeleted(teamId);
      onClose();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Could not delete the team.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[125] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${modalId}-title`}
        className="max-h-[calc(100dvh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-[#111217] text-white shadow-[0_24px_90px_rgba(0,0,0,0.65)]"
      >
        <header className="sticky top-0 z-10 border-b border-white/10 bg-[#111217] px-4 pb-4 pt-5 sm:px-6">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-pink-600 via-amber-400 to-teal-400" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-2 flex items-center gap-2 font-space-mono text-[10px] uppercase tracking-[0.22em] text-pink-400">
                <Users size={14} aria-hidden="true" />
                Team details
              </p>
              <h2 id={`${modalId}-title`} className="wrap-anywhere font-squid text-2xl uppercase leading-tight">
                {team.team_name}
              </h2>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={refreshTeam}
                disabled={busy || statusLoading || confirmDelete}
                aria-label="Refresh team"
                title="Refresh team"
                className={headerButtonClass}
              >
                <RefreshCw size={16} aria-hidden="true" className={statusLoading ? "motion-safe:animate-spin" : undefined} />
              </button>
              <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className={headerButtonClass}>
                <X size={19} aria-hidden="true" />
              </button>
            </div>
          </div>

          <span
            role="status"
            className={`mt-3 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-space-mono text-[9px] uppercase tracking-widest ${
              isRegistered
                ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200"
                : isCancelled
                  ? "border-white/15 bg-white/5 text-white/65"
                  : "border-amber-300/25 bg-amber-400/10 text-amber-200"
            }`}
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            {statusLabel}
          </span>
        </header>

        <div className="space-y-5 px-4 py-5 sm:px-6">
          <section aria-labelledby={`${modalId}-roster-title`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id={`${modalId}-roster-title`} className="font-a24 text-xs uppercase tracking-widest text-pink-400">
                Team members
              </h3>
              {roster && (
                <span className="rounded-full border border-teal-300/20 bg-teal-400/10 px-2.5 py-1 font-space-mono text-[9px] uppercase tracking-wider text-teal-200">
                  {max === null ? `${count} ${count === 1 ? "member" : "members"}` : `${count}/${max} members`}
                </span>
              )}
            </div>

            {rosterError ? (
              <p role="alert" className="mt-3 text-sm text-red-200">{rosterError}</p>
            ) : roster === undefined ? (
              <p role="status" className="mt-3 text-sm text-white/60">Loading roster…</p>
            ) : roster.length === 0 ? (
              <p className="mt-3 text-sm text-white/60">No roster is available for this team.</p>
            ) : (
              <ul className="mt-2.5 space-y-2">
                {roster.map((member, index) => (
                  <li
                    key={`${member.full_name}-${index}`}
                    className={`flex min-h-12 items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 ${
                      member.is_leader ? "border-teal-300/25 bg-teal-400/[0.07]" : "border-white/[0.07] bg-[#181a22]"
                    }`}
                  >
                    <span className={`min-w-0 wrap-anywhere leading-5 ${member.is_leader ? "text-sm" : "text-[13px]"} ${
                      member.is_you ? "font-semibold text-teal-300" : member.is_leader ? "font-semibold text-teal-100" : "text-white/65"
                    }`}>
                      {member.full_name?.trim() || "Team member"}{member.is_you && " (you)"}
                    </span>
                    {member.is_leader && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-pink-400/25 bg-pink-500/10 px-2 py-1 font-space-mono text-[9px] uppercase tracking-widest text-pink-300">
                        <Crown size={12} aria-hidden="true" />
                        Leader
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {roster && canInvite && min !== null && count < min && (
              <p className="mt-2 font-space-mono text-[10px] text-white/65">
                {min} {min === 1 ? "member" : "members"} needed to register
              </p>
            )}
          </section>

          <TeamCodeCard code={team.team_code} label={canInvite ? "Invite code" : "Team code"} />

          {needsLeaderVerification && (
            <div className="space-y-2.5">
              <button
                type="button"
                className="event-action-button event-action-button-neon-pink flex w-full items-center justify-center gap-2 font-a24 disabled:opacity-50"
                disabled={busy || confirmDelete || verification !== "verified"}
                aria-describedby={registrationWarningId}
                onClick={() => void retryRegistration()}
              >
                {registering
                  ? "Registering…"
                  : verification === "checking"
                    ? "Checking verification…"
                    : "Proceed to register"}
                {!registering && verification === "verified" && <ArrowRight size={15} aria-hidden="true" />}
              </button>
              <p id={registrationWarningId} className="flex items-start gap-2 font-space-mono text-sm text-[#ff5ca8]">
                <CircleAlert size={14} aria-hidden="true" className="mt-0.5 shrink-0 motion-safe:animate-pulse" />
                Once registered you can't add members any further
              </p>
            </div>
          )}
          {(waitingForLeader || isRegistered) && (
            <div role="status" className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${
              isRegistered ? "border-teal-300/20 bg-teal-400/[0.08] text-teal-100" : "border-pink-300/20 bg-pink-400/[0.08] text-pink-200"
            }`}>
              <Info size={16} aria-hidden="true" className={`mt-0.5 shrink-0 ${isRegistered ? "text-teal-300" : "text-pink-300"}`} />
              <p>
                {isRegistered ? "This team is closed to new members." : (
                  <>Waiting for team leader{leaderName && <> <strong className="text-pink-100">{leaderName}</strong></>} to finalize tournament registration.</>
                )}
              </p>
            </div>
          )}
          {needsLeaderVerification && typeof verification === "object" && (
            <p role="status" className="text-sm text-amber-200">{verification.message}</p>
          )}
          {(statusError || registrationError) && (
            <p role="alert" className="text-sm text-red-200">{statusError || registrationError}</p>
          )}
        </div>

        {isLeader && (
          <footer className="border-t border-white/10 bg-black/20 px-4 py-3.5 sm:px-6">
            {confirmDelete ? (
              <div role="group" aria-label="Confirm team deletion">
                <p className="text-sm text-red-100">
                  Delete {team.team_name}? This permanently removes the team for all members
                  {isRegistered ? " and removes its event registration." : "."}
                </p>
                {deleteError && (
                  <p role="alert" className="mt-2 text-sm text-red-200">{deleteError}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-md border border-white/20 px-3 py-2 text-xs text-white hover:border-white/50"
                  >
                    Keep team
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void confirmTeamDeletion()}
                    className="rounded-md border border-red-400/50 bg-red-950/40 px-3 py-2 text-xs text-red-100 hover:bg-red-900/50 disabled:opacity-50"
                  >
                    {deleting ? "Deleting…" : "Delete permanently"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setDeleteError("");
                  setConfirmDelete(true);
                }}
                className="inline-flex items-center gap-2 rounded-md border border-red-400/35 bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-red-300 transition-colors enabled:hover:bg-red-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-200 disabled:opacity-50"
              >
                <Trash2 size={14} aria-hidden="true" />
                Delete team
              </button>
            )}
          </footer>
        )}
      </section>
    </div>
  );
}
