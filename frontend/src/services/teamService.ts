import type { EventRecord } from "../data/events";
import { supabase as configuredSupabase } from "../lib/supabase";

export type TeamInfo = {
  id: string;
  event_id: string;
  event_name: string;
  team_name: string;
  team_code: string;
  leader_id: string;
  status: "forming" | "registered" | "cancelled";
  min_team_size: number | null;
  max_team_size: number | null;
  registration_id: string | null;
};

export type TeamRosterMember = {
  full_name: string | null;
  is_leader: boolean;
  is_you: boolean;
};

type TeamRow = Omit<TeamInfo, "event_name" | "min_team_size" | "max_team_size" | "registration_id"> & {
  events: { name: string } & Pick<TeamInfo, "min_team_size" | "max_team_size">;
  registrations: { id: string }[];
};

export type RegistrationItem = {
  id: string;
  event_id: string;
  event_name: string;
  event_slug: string;
  status: string;
  team: TeamInfo | null;
};

export type RegistrationEvent = Pick<EventRecord, "id" | "slug" | "event_type"> & {
  short_description?: string;
  description?: string;
};

export function getCachedRegistrationEvent(
  eventSlug: string,
): RegistrationEvent | undefined {
  try {
    const cached = sessionStorage.getItem("sristi:events-cache-v1");
    if (!cached) return undefined;
    const rows: unknown = JSON.parse(cached);
    if (!Array.isArray(rows)) return undefined;

    const slugs = [eventSlug];
    const alias = eventRegistrationAliases[eventSlug];
    if (alias) slugs.push(alias);

    const row = rows.find(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "slug" in item &&
        typeof item.slug === "string" &&
        slugs.includes(item.slug),
    );
    if (
      !row ||
      typeof row !== "object" ||
      !("id" in row) ||
      typeof row.id !== "string" ||
      !("event_type" in row) ||
      (row.event_type !== "solo" && row.event_type !== "team")
    ) {
      return undefined;
    }

    return {
      id: row.id,
      slug: "slug" in row && typeof row.slug === "string" ? row.slug : eventSlug,
      event_type: row.event_type,
      short_description:
        "short_description" in row && typeof row.short_description === "string"
          ? row.short_description
          : undefined,
      description:
        "description" in row && typeof row.description === "string"
          ? row.description
          : undefined,
    };
  } catch {
    return undefined;
  }
}

const eventRegistrationAliases: Partial<Record<string, string>> = {
  freefire: "free-fire",
  hackathon: "paradigm-shift",
  "robo-soccer": "robosoccer",
  robowars: "robowar",
  seance: "seance-7-0",
};

const EVENT_BROCHURE_CACHE_KEY = "sristi:event-brochures-v1";

export function getCachedEventBrochureUrl(eventId: string): string | null {
  try {
    const cached = sessionStorage.getItem(EVENT_BROCHURE_CACHE_KEY);
    if (!cached) return null;
    const parsed: unknown = JSON.parse(cached);
    if (typeof parsed !== "object" || parsed === null) return null;
    const url = (parsed as Record<string, unknown>)[eventId];
    return typeof url === "string" ? url : null;
  } catch {
    return null;
  }
}

function cacheEventBrochureUrls(entries: Record<string, string>) {
  try {
    const cached = sessionStorage.getItem(EVENT_BROCHURE_CACHE_KEY);
    const previous: unknown = cached ? JSON.parse(cached) : {};
    const existing =
      typeof previous === "object" && previous !== null
        ? (previous as Record<string, unknown>)
        : {};
    sessionStorage.setItem(
      EVENT_BROCHURE_CACHE_KEY,
      JSON.stringify({ ...existing, ...entries }),
    );
  } catch {
    // Brochure links still load from Supabase when session storage is unavailable.
  }
}

export async function fetchEventBrochureUrl(eventId: string): Promise<string | null> {
  const cached = getCachedEventBrochureUrl(eventId);
  if (cached) return cached;

  const { data, error } = await client()
    .from("event_files")
    .select("file_path")
    .eq("event_id", eventId)
    .eq("file_type", "brochure")
    .maybeSingle();

  if (error || !data) return null;
  const { data: publicUrl } = client()
    .storage
    .from("event-files")
    .getPublicUrl(data.file_path);
  cacheEventBrochureUrls({ [eventId]: publicUrl.publicUrl });
  return publicUrl.publicUrl;
}

export async function prefetchEventBrochureUrls(eventIds: string[]): Promise<void> {
  if (!eventIds.length) return;
  const { data, error } = await client()
    .from("event_files")
    .select("event_id,file_path")
    .eq("file_type", "brochure")
    .in("event_id", eventIds);

  if (error || !data?.length) return;
  const entries = Object.fromEntries(
    data.map((file) => [
      file.event_id,
      client().storage.from("event-files").getPublicUrl(file.file_path).data.publicUrl,
    ]),
  );
  cacheEventBrochureUrls(entries);
}

const teamApiUnavailable =
  "Team registration is temporarily unavailable. The event organizers need to update the team service.";

const client = () => {
  if (!configuredSupabase) {
    throw new Error(
      "Supabase is not configured. Check your environment variables."
    );
  }
  return configuredSupabase;
};

async function getCurrentUserId() {
  const { data, error } = await client().auth.getUser();

  if (error?.name === "AuthSessionMissingError") return null;
  if (error) throw error;
  return data.user?.id ?? null;
}

export async function fetchPlayerVerification(): Promise<boolean> {
  if (!(await getCurrentUserId())) throw new Error("Please sign in to continue.");
  const { data, error } = await client().rpc("is_verified_user", {});
  if (error) {
    throw new Error("Could not check your verification. Please try again.", { cause: error });
  }
  return data === true;
}

export async function fetchRegistrationEvent(
  eventSlug: string
): Promise<RegistrationEvent | null> {
  const slugs = [eventSlug];
  const alias = eventRegistrationAliases[eventSlug];
  if (alias) slugs.push(alias);

  const { data } = await client()
    .from("events")
    .select("id,slug,event_type,short_description,description")
    .in("slug", slugs)
    .throwOnError();

  return data?.find((event) => event.slug === eventSlug) ?? data?.[0] ?? null;
}

export async function fetchTeamDetails(teamId: string): Promise<TeamInfo> {
  const { data: team } = await client()
    .from("teams")
    .select(
      "id,event_id,team_name,team_code,leader_id,status,events!inner(name,min_team_size,max_team_size),registrations(id)"
    )
    .eq("id", teamId)
    .eq("registrations.status", "registered")
    .single()
    .throwOnError()
    .overrideTypes<TeamRow, { merge: false }>();

  if (!team) throw new Error("Team not found.");
  const { events: { name, min_team_size, max_team_size }, registrations, ...details } = team;
  return {
    ...details,
    event_name: name,
    min_team_size,
    max_team_size,
    registration_id: registrations[0]?.id ?? null,
  };
}

export async function fetchTeamRoster(teamId: string): Promise<TeamRosterMember[]> {
  const { data, error, status } = await client().rpc("get_team_roster", { p_team_id: teamId });
  if (error?.code === "P0001") throw new Error(teamActionMessage(error.message));
  if (status === 401) {
    throw new Error("Sign in as a team member to view the roster.", { cause: error });
  }
  if (error?.code === "PGRST202") {
    throw new Error("The team roster is unavailable on this Supabase project.", { cause: error });
  }
  if (error?.code === "42703" && error.message.includes("member_info_consent")) {
    throw new Error("The team roster is unavailable because the database needs a roster update.", { cause: error });
  }
  if (error) throw new Error("Could not load the team roster.", { cause: error });
  return data ?? [];
}

export async function finalizeTeamRegistration(teamId: string): Promise<string> {
  const { data, error } = await client().rpc("finalize_team_registration", {
    p_team_id: teamId,
  });
  if (error?.code === "P0001") throw new Error(teamActionMessage(error.message));
  if (error || typeof data !== "string") {
    throw new Error("Could not confirm registration. Please try again.", { cause: error });
  }
  return data;
}

export async function deleteTeam(teamId: string): Promise<boolean> {
  const supabase = client();
  const { data, error } = await supabase.rpc("delete_team", { p_team_id: teamId });
  if (error) throw new Error(error.message, { cause: error });
  if (typeof data !== "boolean") {
    throw new Error("Could not confirm team deletion. Please try again.");
  }
  return data;
}

export async function fetchPlayerTeamForEvent(
  eventId: string
): Promise<TeamInfo | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data: membership } = await client()
    .from("team_members")
    .select("team_id,teams!inner(status,event_id)")
    .eq("user_id", userId)
    .eq("teams.event_id", eventId)
    .neq("teams.status", "cancelled")
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle()
    .throwOnError();

  if (!membership) return null;
  return fetchTeamDetails(membership.team_id);
}

export async function createTeam(
  eventId: string,
  teamName: string
): Promise<string> {
  const name = teamName.trim();
  if (!name) throw new Error("Enter a team name.");

  const { data, error, status } = await client().rpc("create_team", {
    p_event_id: eventId,
    p_team_name: name,
  });

  if (error?.code === "PGRST202" || error?.code === "42501" && status === 403) {
    throw new Error(teamApiUnavailable, { cause: error });
  }
  if (status === 401) throw new Error("Please sign in again to continue.", { cause: error });
  if (
    error?.code === "23505" &&
    error.message.includes("teams_event_id_team_name_key")
  ) {
    throw new Error("A team with this name already exists for this event.");
  }
  if (error?.code === "P0001") throw new Error(teamActionMessage(error.message));
  if (error || typeof data !== "string") {
    throw new Error(
      "Could not confirm team creation. Reload the event page to check your team status.",
      { cause: error }
    );
  }
  return data;
}

export async function joinTeam(teamCode: string): Promise<string> {
  const normalizedCode = teamCode.trim().toUpperCase();
  if (!normalizedCode) throw new Error("Enter your team invite code.");

  const { data, error, status } = await client().rpc("join_team", {
    p_team_code: normalizedCode,
  });

  if (error?.code === "PGRST202" || error?.code === "42501" && status === 403) {
    throw new Error(teamApiUnavailable, { cause: error });
  }
  if (status === 401) throw new Error("Please sign in again to continue.", { cause: error });
  if (error?.code === "P0001") throw new Error(teamActionMessage(error.message));
  if (error || typeof data !== "string") {
    throw new Error(
      "Could not confirm that you joined the team. Reload the event page to check your team status.",
      { cause: error }
    );
  }
  return data;
}

export async function registerSoloEvent(eventId: string) {
  if (!(await fetchPlayerVerification())) {
    throw new Error("Verify your participant code before registering.");
  }
  const { data, error } = await client().rpc("register_solo_event", { p_event_id: eventId });
  if (
    (error?.code === "23505" || error?.message === "User is already registered for this event") &&
    await hasSoloRegistration(eventId)
  ) {
    return;
  }
  if (error?.code === "P0001") throw new Error(teamActionMessage(error.message));
  if (error || typeof data !== "string") {
    throw new Error("Could not confirm registration. Please try again.", { cause: error });
  }
}

export async function hasSoloRegistration(eventId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { data } = await client()
    .from("registrations")
    .select("id")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .eq("status", "registered")
    .is("team_id", null)
    .maybeSingle()
    .throwOnError();
  return Boolean(data);
}

function teamActionMessage(message: string): string {
  switch (message) {
    case "Authentication required":
      return "Please sign in to continue.";
    case "User is not verified":
      return "Verify your participant code to continue.";
    case "Team is not accepting new members":
      return "This team is closed to new members.";
    default:
      return message;
  }
}

export async function fetchPlayerRegistrations(): Promise<
  RegistrationItem[]
> {
  const db = client();
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Sign in to see your registered events.");

  const [ownResult, membershipResult] = await Promise.all([
    db
      .from("registrations")
      .select("id,event_id,team_id,status")
      .eq("user_id", userId)
      .eq("status", "registered"),
    db
      .from("team_members")
      .select("team_id,teams!inner(id,event_id,status)")
      .eq("user_id", userId)
      .neq("teams.status", "cancelled"),
  ]);

  if (ownResult.error) throw ownResult.error;
  if (membershipResult.error) throw membershipResult.error;
  const ownRows = ownResult.data;
  const memberships = membershipResult.data;

  const teamIds = [
    ...new Set((memberships ?? []).map((row) => row.team_id as string)),
  ];

  let teamRows: {
    id: string;
    event_id: string;
    team_id: string | null;
    status: string;
  }[] = [];

  if (teamIds.length > 0) {
    const { data, error } = await db
      .from("registrations")
      .select("id,event_id,team_id,status")
      .in("team_id", teamIds)
      .eq("status", "registered");

    if (error) throw error;
    teamRows = data ?? [];
  }

  const allRows = [...(ownRows ?? []), ...teamRows].filter(
    (row, index, rows) =>
      rows.findIndex((item) => item.id === row.id) === index
  );

  if (allRows.length === 0) return [];

  const eventIds = [...new Set(allRows.map((row) => row.event_id))];

  const teamIdSet = [
    ...new Set(
      allRows.map((row) => row.team_id).filter(Boolean) as string[]
    ),
  ];

  const [eventsResult, teams] = await Promise.all([
    db.from("events").select("id,name,slug").in("id", eventIds),
    Promise.all(teamIdSet.map((teamId) => fetchTeamDetails(teamId))),
  ]);

  if (eventsResult.error) throw eventsResult.error;

  const teamById = new Map(teams.map((team) => [team.id, team]));
  const eventById = new Map((eventsResult.data ?? []).map((event) => [event.id, event]));

  return allRows.flatMap((row) => {
    const event = eventById.get(row.event_id);
    if (!event) return [];

    return [{
      id: row.id,
      event_id: row.event_id,
      event_name: event.name,
      event_slug: event.slug,
      status: row.status,
      team: row.team_id ? teamById.get(row.team_id) ?? null : null,
    }];
  });
}
