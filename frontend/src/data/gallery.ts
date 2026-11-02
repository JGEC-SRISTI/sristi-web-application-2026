export interface GalleryItem {
  image: string;
  description: string;
}

const galleryModules = import.meta.glob(
  "../assets/images/gallery/*.{jpg,jpeg,png,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
) as Record<string, string>;

const galleryImages = Object.entries(galleryModules)
  .sort(([pathA], [pathB]) => {
    const numberA = Number(
      pathA.match(/(\d+)(?=\.[^.]+$)/)?.[1] ?? 0
    );

    const numberB = Number(
      pathB.match(/(\d+)(?=\.[^.]+$)/)?.[1] ?? 0
    );

    return numberA - numberB;
  });

const descriptions = [
  "Welcome you all to SRISTI - the largest techno-management fest of north bengal.",
  "Sristi is the Glory of JGEC.",
  "Create your team and participate to increase it.",
  "Explore the world of innovation and creativity.",
  "Make your bots play in your way.",
  "Even your bot can literally slay others.",
  "Make your ideas fly across the world.",
  "Good at games, let's see.",
  "Lets think of that move, we all dream of.",
  "Slayers on the move, will you battle or run.",
  "Team play, Dream play.",
  "Sristi is not just about tech, it's also the beauty.",
  "Be part of many insightful seminars.",
  "Make it, Break it, Sristi - all about creation.",
  "Win or Loose having fun is the most important, isn't it?",
  "Make your bots take their own path.",
  "Let's see how far can you go!",
  "Some essence of fest is also needed. no?",
  "It's not about creating only, first you learn how to create.",
  "Selfie zones are also their to enlighten your social media.",
  "Not only you the organizer also create the whole fest.",
  "Can you cross the hardles?",
  "Learn, Create, Compete.",
];

export const galleryData: GalleryItem[] = galleryImages.map(
  ([, image], index) => ({
    image,
    description:
      descriptions[index] ??
      "A captured moment from SRISTI 2K25.",
  })
);