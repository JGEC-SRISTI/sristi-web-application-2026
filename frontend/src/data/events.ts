export type EventCategory =
  | "Civilized"
  | "Gaming"
  | "Management"
  | "Mechanized"
  | "Robotics"
  | "Tech"
  | "Miscellaneous";

export type ParticipationType = "SOLO" | "TEAM";

export interface EventRecord {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  event_type: "solo" | "team";
  category: EventCategory;
  venue: string;
  min_team_size: number | null;
  max_team_size: number | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  image: string;
  category: EventCategory;
  participation: ParticipationType;
  description: string;
  date: string;
  venue: string;
  prize_pool: string;
  team_size: string;
  registration_open: boolean;
  icon: string;
}

const postImageModules = import.meta.glob(
  "../assets/images/posts/event_image-*",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
) as Record<string, string>;

const normalizeImageName = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const postImages = Object.entries(postImageModules).reduce<
  Record<string, string>
>((images, [path, image]) => {
  const filename = path.split("/").pop() ?? "";
  const name = filename
    .replace(/^event_image-/, "")
    .replace(/\.[^.]+$/, "");
  images[normalizeImageName(name)] = image;
  return images;
}, {});

const eventImageAliases: Record<string, string> = {
  circuitrix: "not-found",
  hackathon: "Paradigm_Shift",
  mazemerize: "Mazemarize",
  robowars: "Robowar",
  seance: "Seance_60",
};

const getEventImage = (title: string) =>
  postImages[
    normalizeImageName(
      eventImageAliases[normalizeImageName(title)] ?? title,
    )
  ] ?? postImages[normalizeImageName("not-found")];

export { getEventImage };

const event = (
  id: string,
  name: string,
  category: EventCategory,
  eventType: "solo" | "team",
  shortDescription: string,
  description: string,
): EventRecord => ({
  id,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  short_description: shortDescription,
  description,
  event_type: eventType,
  category,
  venue: "Old Auditorium",
  min_team_size: eventType === "team" ? 3 : null,
  max_team_size: eventType === "team" ? 5 : null,
  created_at: "2026-10-30T00:00:00.000Z",
  updated_at: "2026-10-30T00:00:00.000Z",
});

export const mockEventRecords: EventRecord[] = [
  event("a4", "Instridge", "Civilized", "team", "Build an intelligent bridge from insight to action.", "Instridge asks teams to study a real-world situation, identify the forces shaping it, and propose a clear intervention."),
  event("a2", "Rotolare", "Civilized", "team", "Roll forward with strategy, speed, and teamwork.", "Rotolare combines planning, coordination, and fast decisions in a lively team challenge. Participants must adapt to changing tasks, keep communication sharp, and use every round to improve their route to the final objective."),
  event("a3", "Rise n Build", "Civilized", "team", "Create something useful from a bold shared idea.", "Rise n Build is a collaborative challenge where teams move from a rough concept to a working model or convincing prototype. Judges will look for originality, feasibility, teamwork, and the clarity of the story behind the build."),
  event("a1", "Bridge the Gap", "Civilized", "team", "Connect ideas, people, and perspectives.", "Bridge the Gap challenges teams to design a practical solution for a social or community problem. Present your approach, defend your choices, and show how thoughtful collaboration can turn divided perspectives into measurable progress."),
  event("a5", "CAD", "Civilized", "solo", "Turn an idea into a precise digital design.", "CAD challenges participants to create accurate, practical designs while balancing creativity with engineering constraints."),
  event("a6", "Survey Hunt", "Civilized", "team", "Explore, observe, and uncover the right answers.", "Survey Hunt rewards careful observation, collaboration, and the ability to turn field findings into useful conclusions."),
  event("a7", "Circuitrix", "Robotics", "team", "Trace the signal from problem to working circuit.", "Circuitrix combines electronics knowledge, debugging, and hands-on collaboration."),
  event("a8", "ROBOWARS", "Robotics", "team", "Build a machine that can hold its ground.", "ROBOWARS puts engineered machines into a controlled arena where design, control, and durability meet."),
  event("a9", "Takeshi's Castle", "Robotics", "team", "Navigate a chaotic challenge with control and teamwork.", "Takeshi's Castle combines fast decisions, coordination, and practical problem-solving under pressure."),
  event("a10", "Mazemerize", "Robotics", "team", "Navigate the maze with precision and patience.", "Mazemerize challenges teams to guide a robot through a complex route while handling turns and obstacles."),
  event("a11", "Robo-Soccer", "Robotics", "team", "Turn teamwork into precise robotic play.", "Robo-Soccer brings autonomous or remotely controlled machines onto the field for a fast, technical match."),
  event("a12", "Hackathon", "Robotics", "team", "Build and present a working solution before time runs out.", "Hackathon challenges teams to turn a problem into a tested prototype through rapid collaboration."),
  event("a13", "TECHZIBITION", "Robotics", "team", "Showcase a technical idea that deserves attention.", "TECHZIBITION is a focused showcase for an inventive project, prototype, or technical concept."),
  event("a14", "E-FOOTBALL", "Gaming", "solo", "Control the pitch and compete for the win.", "E-FOOTBALL puts individual players into a competitive football bracket."),
  event("a15", "VALORANT", "Gaming", "team", "Coordinate your squad and outplay the opposition.", "VALORANT rewards communication, timing, and adaptable tactics in a competitive team battle."),
  event("a16", "FREEFIRE", "Gaming", "team", "Coordinate your squad and survive the final circle.", "FREEFIRE is a team battle built around communication, timing, and adaptable tactics."),
  event("a17", "CHESS", "Gaming", "solo", "Think ahead and outplay your opponent.", "CHESS brings together players for focused, strategic matches where patience and calculation decide the result."),
  event("a18", "BUG BOUNTY", "Tech", "solo", "Find the flaw and explain how to fix it.", "BUG BOUNTY tests careful investigation, debugging, and practical security thinking."),
  event("a19", "CODE CHRONICLES", "Tech", "solo", "Solve a story told through code and logic.", "CODE CHRONICLES is a programming challenge built around layered problems and changing clues."),
  event("a20", "CSS BATTLE", "Tech", "solo", "Style, structure, and precision in a front-end showdown.", "CSS BATTLE asks participants to recreate visual targets with elegant, accurate HTML and CSS."),
  event("a21", "J-CTF", "Tech", "solo", "Find the weakness, capture the flag, and learn why it works.", "J-CTF introduces participants to practical security thinking through carefully designed challenges."),
  event("a22", "J-ICPC", "Tech", "team", "Solve demanding problems as one programming unit.", "J-ICPC is a team programming contest that rewards communication and algorithmic depth."),
  event("a23", "SEANCE", "Miscellaneous", "team", "Follow the clues and uncover the hidden answer.", "SEANCE is a collaborative mystery challenge filled with layered clues and patterns."),
  event("a24", "CODEHUNT", "Miscellaneous", "team", "Hunt through puzzles, hints, and hidden logic.", "CODEHUNT blends puzzles and programming into a team expedition."),
  event("a25", "MARATHON", "Miscellaneous", "team", "Stay focused and finish the challenge together.", "MARATHON rewards endurance, planning, and consistent teamwork from start to finish."),
  event("a26", "SPUTNIK", "Mechanized", "team", "Design, test, and launch your way through the challenge.", "SPUTNIK is a team event about mechanical thinking, experimentation, and reliable execution."),
  event("a27", "AEROTWIST", "Mechanized", "team", "Take engineering ideas from the ground to the skies.", "AEROTWIST invites teams to explore flight, motion, and design through an engineering-focused challenge."),
  event("a28", "IC ENGINE", "Mechanized", "team", "Understand motion through mechanical design.", "IC ENGINE challenges teams to apply engineering principles to a practical mechanical problem."),
  event("a29", "B-PLAN", "Management", "team", "Turn a promising idea into a convincing business plan.", "B-PLAN gives teams the opportunity to shape a business idea from problem discovery through execution."),
  event("a30", "TRADERUSH", "Management", "solo", "Read the market and make the right move at speed.", "TRADERUSH is a fast decision-making simulation where every choice affects the next opportunity."),
  event("a31", "STRATEDGEX", "Management", "team", "Solve a strategic problem before the clock runs out.", "STRATEDGEX places teams in a business scenario with incomplete information and competing priorities."),
  event("a32", "CASE STUDY", "Management", "team", "Analyze a problem and present a practical solution.", "CASE STUDY tests research, reasoning, and the ability to defend a clear recommendation."),
];

const categoryIcons: Record<EventCategory, string> = {
  Civilized: "🌉",
  Gaming: "🎮",
  Management: "💼",
  Mechanized: "⚙️",
  Robotics: "🤖",
  Tech: "💻",
  Miscellaneous: "✨",
};

export const mockEvents: Event[] = mockEventRecords.map((record) => ({
  id: record.id,
  slug: record.slug,
  title: record.name,
  image: getEventImage(record.name),
  category: record.category,
  participation: record.event_type.toUpperCase() as ParticipationType,
  description: record.description,
  date: "2026-11-15",
  venue: record.venue,
  prize_pool: {
    "Bridge the Gap": "₹10K",
    Rotolare: "₹10K",
    "Rise n Build": "₹5K",
    Instridge: "₹7.5K",
    CAD: "₹4.5K",
    "Survey Hunt": "₹7.5K",
    Circuitrix: "₹8K",
    ROBOWARS: "₹30K",
    "Takeshi's Castle": "₹8K",
    Mazemerize: "₹7.5K",
    "Robo-Soccer": "₹10K",
    Hackathon: "₹18K",
    TECHZIBITION: "₹12K",
    "E-FOOTBALL": "₹4.5K",
    VALORANT: "₹3K",
    FREEFIRE: "₹5K",
    CHESS: "₹4.5K",
    "BUG BOUNTY": "₹4.5K",
    "CODE CHRONICLES": "₹7.5K",
    "CSS BATTLE": "₹4.5K",
    "J-CTF": "₹6K",
    "J-ICPC": "₹10K",
    SEANCE: "₹4.5K",
    CODEHUNT: "₹4.5K",
    MARATHON: "₹6K",
    SPUTNIK: "₹8K",
    AEROTWIST: "₹4.5K",
    "IC ENGINE": "₹4.5K",
    "B-PLAN": "₹10K",
    TRADERUSH: "₹4.5K",
    STRATEDGEX: "₹4.5K",
    "CASE STUDY": "₹4.5K",
  }[record.name] ?? "₹0",
  team_size: record.event_type === "team" ? "3–5 members" : "Individual",
  registration_open: true,
  icon: categoryIcons[record.category],
}));
