export type EventCategory =
  | "Civilized"
  | "Gaming"
  | "Management"
  | "Aeronautical"
  | "Robotics"
  | "Technical"
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

const event = (
  id: string,
  name: string,
  category: EventCategory,
  eventType: "solo" | "team",
  shortDescription: string,
  description: string,
  minTeamSize = 3,
  maxTeamSize = 5,
): EventRecord => ({
  id,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  short_description: shortDescription,
  description,
  event_type: eventType,
  category,
  venue: "Old Auditorium",
  min_team_size: eventType === "team" ? minTeamSize : null,
  max_team_size: eventType === "team" ? maxTeamSize : null,
  created_at: "2026-10-30T00:00:00.000Z",
  updated_at: "2026-10-30T00:00:00.000Z",
});

export const mockEventRecords: EventRecord[] = [
  event("a1", "INSTRIDGE", "Civilized", "team", "Build an intelligent bridge from insight to action.", "Instridge asks teams to study a real-world situation, identify the forces shaping it, and propose a clear intervention.",5,5),
  event("a2", "Rotolare", "Civilized", "team", "Roll forward with strategy, speed, and teamwork.", "Rotolare combines planning, coordination, and fast decisions in a lively team challenge. Participants must adapt to changing tasks, keep communication sharp, and use every round to improve their route to the final objective.", 4, 5),
  event("a3", "Rise n Build", "Civilized", "team", "Create something useful from a bold shared idea.", "Rise n Build is a collaborative challenge where teams move from a rough concept to a working model or convincing prototype. Judges will look for originality, feasibility, teamwork, and the clarity of the story behind the build.",5,5),
  event("a4", "Bridge The Gap", "Civilized", "team", "Connect ideas, people, and perspectives.", "Bridge the Gap challenges teams to design a practical solution for a social or community problem. Present your approach, defend your choices, and show how thoughtful collaboration can turn divided perspectives into measurable progress.",5,5),
  event("a5", "Survey Hunt", "Civilized", "team", "Explore, observe, and uncover the right answers.", "Survey Hunt rewards careful observation, collaboration, and the ability to turn field findings into useful conclusions.",5,5),
  event("a6", "Circuitrix", "Robotics", "team", "Trace the signal from problem to working circuit.", "Circuitrix combines electronics knowledge, debugging, and hands-on collaboration."),
  event("a7", "Robowar", "Robotics", "team", "Build a machine that can hold its ground.", "ROBOWARS puts engineered machines into a controlled arena where design, control, and durability meet.",5,5),
  event("a8", "Takeshi's Castle", "Robotics", "team", "Navigate a chaotic challenge with control and teamwork.", "Takeshi's Castle combines fast decisions, coordination, and practical problem-solving under pressure.",5,5),
  event("a9", "RoboSoccer", "Robotics", "team", "Turn teamwork into precise robotic play.", "Robo-Soccer brings autonomous or remotely controlled machines onto the field for a fast, technical match."),
  event("a10", "Chess", "Gaming", "solo", "Think ahead and outplay your opponent.", "CHESS brings together players for focused, strategic matches where patience and calculation decide the result."),
  event("a11", "Free Fire", "Gaming", "team", "Coordinate your squad and survive the final circle.", "FREEFIRE is a team battle built around communication, timing, and adaptable tactics.",4,4),
  event("a12", "Code Chronicles", "Technical", "solo", "Solve a story told through code and logic.", "CODE CHRONICLES is a programming challenge built around layered problems and changing clues."),
  event("a13", "J-ICPC", "Technical", "team", "Solve demanding problems as one programming unit.", "J-ICPC is a team programming contest that rewards communication and algorithmic depth.", 5, 5),
  event("a14", "CSS Battle", "Technical", "solo", "Style, structure, and precision in a front-end showdown.", "CSS BATTLE asks participants to recreate visual targets with elegant, accurate HTML and CSS."),
  event("a15", "Paradigm Shift", "Technical", "team", "Build and present a working solution before time runs out.", "Hackathon challenges teams to turn a problem into a tested prototype through rapid collaboration."),
  event("a16", "J-CTF", "Technical", "solo", "Find the weakness, capture the flag, and learn why it works.", "J-CTF introduces participants to practical security thinking through carefully designed challenges."),
  event("a17", "Techzibition", "Technical", "team", "Showcase a technical idea that deserves attention.", "TECHZIBITION is a focused showcase for an inventive project, prototype, or technical concept.",1,4),
  event("a18", "Seance 7.0", "Miscellaneous", "team", "Follow the clues and uncover the hidden answer.", "SEANCE is a collaborative mystery challenge filled with layered clues and patterns.",1,3),
  event("a19", "CodeHunt", "Miscellaneous", "team", "Hunt through puzzles, hints, and hidden logic.", "CODEHUNT blends puzzles and programming into a team expedition.",5,5),
  event("a20","Capture it","Miscellaneous","solo","One shot, one chance, one winner — capture the moment, survive the game, and let your lens decide your fate!","Capture it is a solo photography competition that challenges participants to capture the essence of a moment, showcasing their creativity, technical skills, and storytelling through the lens."),
  event("a21","VERBATIUM","Miscellaneous","solo","A competitive debating event where participants present, defend, and challenge ideas with clarity, logic, and persuasive reasoning.","VERBATIUM is a solo debating competition that tests participants' ability to present, defend, and challenge ideas with clarity, logic, and persuasive reasoning."),
  event("a22", "MATHEMANIA", "Miscellaneous", "team", "A competitive mathematics event where participants solve challenging problems and puzzles, testing analytical thinking, speed, and problem-solving skills.", "MATHEMANIA is a team-based mathematics competition that challenges participants to solve complex problems and puzzles, testing their analytical thinking, speed, and problem-solving skills."),
  event("a23", "Sputnik", "Aeronautical", "team", "Design, test, and launch your way through the challenge.", "SPUTNIK is a team event about mechanical thinking, experimentation, and reliable execution."),
  event("a24", "AeroTwist", "Aeronautical", "team", "Take engineering ideas from the ground to the skies.", "AEROTWIST invites teams to explore flight, motion, and design through an engineering-focused challenge."),
  event("a25", "SHARK TANK JOLU", "Management", "team", "Turn a promising idea into a convincing business plan.", "B-PLAN gives teams the opportunity to shape a business idea from problem discovery through execution.",2,5),
  event("a26", "Stratedgex", "Management", "team", "Solve a strategic problem before the clock runs out.", "STRATEDGEX places teams in a business scenario with incomplete information and competing priorities.",1,3),
  event("a27", "Case Study Competition", "Management", "team", "Analyze a problem and present a practical solution.", "CASE STUDY tests research, reasoning, and the ability to defend a clear recommendation.",3,3),
];

const categoryIcons: Record<EventCategory, string> = {
  Civilized: "🌉",
  Gaming: "🎮",
  Management: "💼",
  Aeronautical: "✈️",
  Robotics: "🤖",
  Technical: "💻",
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
  team_size:
    record.event_type === "solo"
      ? "Individual"
      : record.min_team_size === record.max_team_size
        ? `${record.min_team_size} members`
        : `${record.min_team_size}–${record.max_team_size} members`,
  registration_open: true,
  icon: categoryIcons[record.category],
}));
