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
  title: string;
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
  event("a1", "Bridge the Gap", "Civilized", "team", "Connect ideas, people, and perspectives.", "Bridge the Gap challenges teams to design a practical solution for a social or community problem. Present your approach, defend your choices, and show how thoughtful collaboration can turn divided perspectives into measurable progress."),
  event("a2", "Instridge", "Civilized", "team", "Build an intelligent bridge from insight to action.", "Instridge asks teams to study a real-world situation, identify the forces shaping it, and propose a clear intervention. Strong reasoning, useful research, and a confident final presentation will matter as much as the idea itself."),
  event("a3", "Rise n Build", "Civilized", "team", "Create something useful from a bold shared idea.", "Rise n Build is a collaborative challenge where teams move from a rough concept to a working model or convincing prototype. Judges will look for originality, feasibility, teamwork, and the clarity of the story behind the build."),
  event("a4", "Rotolare", "Civilized", "team", "Roll forward with strategy, speed, and teamwork.", "Rotolare combines planning, coordination, and fast decisions in a lively team challenge. Participants must adapt to changing tasks, keep communication sharp, and use every round to improve their route to the final objective."),
  event("a5", "Chess", "Gaming", "solo", "Think ahead and outplay your opponent.", "Chess brings together players for focused, strategic matches where patience and calculation decide the result. Participants will compete through a structured tournament format, with every move carrying the possibility of a brilliant turnaround."),
  event("a6", "PES", "Gaming", "solo", "Control the pitch and compete for the win.", "PES puts individual players into a competitive football bracket. Build your lineup, read the opponent, and manage every attack and counterattack in matches designed to reward both technical control and smart game management."),
  event("a7", "Free Fire", "Gaming", "team", "Coordinate your squad and survive the final circle.", "Free Fire is a team battle built around communication, timing, and adaptable tactics. Squads must make smart rotations, support one another under pressure, and turn limited resources into a decisive finish."),
  event("a8", "BGMI", "Gaming", "team", "Drop in, coordinate, and claim the battleground.", "BGMI challenges squads to combine map knowledge, disciplined communication, and quick tactical decisions. Teams will compete through intense rounds where positioning, recovery, and a calm final push can change everything."),
  event("a9", "B-Plan", "Management", "team", "Turn a promising idea into a convincing business plan.", "B-Plan gives teams the opportunity to shape a business idea from problem discovery through execution. Explain the customer, the value proposition, the operating model, and the numbers, then defend the plan before the judging panel."),
  event("a10", "Debate", "Management", "solo", "Make a case, challenge assumptions, and persuade the room.", "Debate tests research, structure, listening, and the ability to respond under pressure. Participants will argue assigned positions through timed rounds, balancing strong evidence with clear delivery and respectful rebuttal."),
  event("a11", "Stratedgex", "Management", "team", "Solve a strategic problem before the clock runs out.", "Stratedgex places teams in a business scenario with incomplete information and competing priorities. Analyze the situation, choose a direction, and present a practical strategy that shows both ambition and control of the details."),
  event("a12", "Trade Rush", "Management", "solo", "Read the market and make the right move at speed.", "Trade Rush is a fast decision-making simulation where every choice affects the next opportunity. Participants must interpret changing signals, manage risk, and build the strongest outcome without losing sight of the bigger picture."),
  event("a13", "Aeronuatical", "Mechanized", "team", "Take engineering ideas from the ground to the skies.", "Aeronuatical invites teams to explore flight, motion, and design through an engineering-focused challenge. Build a clear concept, explain the principles behind it, and demonstrate how your design handles constraints in the real world."),
  event("a14", "Sputnik", "Mechanized", "team", "Design, test, and launch your way through the challenge.", "Sputnik is a team event about mechanical thinking, experimentation, and reliable execution. Participants will develop a solution under defined constraints, refine it through testing, and communicate the decisions that made the final design work."),
  event("a15", "Robo-War", "Robotics", "team", "Build a machine that can hold its ground.", "Robo-War puts engineered machines into a controlled arena where design, control, and durability meet. Teams must prepare their robot, develop a battle strategy, and adapt quickly when the competition does not follow the expected plan."),
  event("a16", "Robosoccer", "Robotics", "team", "Turn teamwork into precise robotic play.", "Robosoccer brings autonomous or remotely controlled machines onto the field for a fast, technical match. Successful teams will combine robust construction with responsive control and a game plan that keeps the whole formation moving."),
  event("a17", "Mazemarize", "Robotics", "team", "Navigate the maze with precision and patience.", "Mazemarize challenges teams to guide a robot through a complex route while handling turns, obstacles, and unexpected corrections. Efficient sensing, clean control logic, and careful calibration will separate a quick run from a great one."),
  event("a18", "Code Chronicles", "Tech", "solo", "Solve a story told through code and logic.", "Code Chronicles is a solo programming challenge built around layered problems and changing clues. Participants will need to read carefully, choose effective algorithms, and produce reliable solutions as the difficulty rises from one chapter to the next."),
  event("a19", "J-CTF", "Tech", "solo", "Find the weakness, capture the flag, and learn why it works.", "J-CTF introduces participants to practical security thinking through a sequence of carefully designed challenges. Investigate clues, inspect behavior, and document the reasoning behind each solution rather than relying on guesswork alone."),
  event("a20", "J-ICPC", "Tech", "team", "Solve demanding problems as one programming unit.", "J-ICPC is a team programming contest that rewards communication, algorithmic depth, and disciplined time management. Teams must divide problems intelligently, verify solutions quickly, and keep momentum through a varied set of challenges."),
  event("a21", "CSS Battles", "Tech", "solo", "Style, structure, and precision in a front-end showdown.", "CSS Battles asks participants to recreate visual targets with elegant, accurate HTML and CSS. The event rewards close observation, clean layout thinking, and the ability to turn a visual idea into a precise browser-rendered result."),
  event("a22", "Paradigm Shift", "Tech", "team", "Question the usual approach and build a better one.", "Paradigm Shift challenges teams to rethink a familiar technical problem. Explain the limitation in the conventional approach, propose a stronger model, and demonstrate how your solution performs when the assumptions change."),
  event("a23", "Circuitrix", "Tech", "team", "Trace the signal from problem to working circuit.", "Circuitrix combines electronics knowledge, debugging, and hands-on collaboration. Teams will interpret a circuit challenge, identify faults or design constraints, and produce a working solution that can be clearly explained and tested."),
  event("a24", "Seance", "Miscellaneous", "team", "Follow the clues and uncover the hidden answer.", "Seance is a collaborative mystery challenge filled with layered clues, patterns, and moments that reward careful observation. Teams must connect information, manage different theories, and reach a solution before the final reveal."),
  event("a25", "Codehunt", "Miscellaneous", "team", "Hunt through puzzles, hints, and hidden logic.", "Codehunt blends puzzles and programming into a team expedition. Participants will follow a chain of tasks, unlock the next stage through reasoning, and use complementary strengths to keep the investigation moving."),
  event("a26", "Mathemania", "Miscellaneous", "solo", "Bring speed, structure, and creativity to mathematics.", "Mathemania takes participants through a varied set of mathematical problems that reward more than memorized formulas. Look for patterns, test elegant approaches, and explain the reasoning that turns a difficult question into a manageable one."),
  event("a27", "Photography", "Miscellaneous", "solo", "Frame an original view of the world around you.", "Photography invites participants to tell a complete visual story through a carefully chosen image. Consider composition, light, timing, and context, then submit work that communicates a distinct point of view rather than just a technically clean shot."),
  event("a28", "Techzibition", "Miscellaneous", "solo", "Showcase a technical idea that deserves attention.", "Techzibition is a focused showcase for an inventive project, prototype, or technical concept. Participants should make the idea understandable, demonstrate what makes it useful, and explain the next step that could take it further."),
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
  title: record.name,
  category: record.category,
  participation: record.event_type.toUpperCase() as ParticipationType,
  description: record.description,
  date: "2026-11-15",
  venue: record.venue,
  prize_pool: "₹1,000",
  team_size: record.event_type === "team" ? "3–5 members" : "Individual",
  registration_open: true,
  icon: categoryIcons[record.category],
}));
