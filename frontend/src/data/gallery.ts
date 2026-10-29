export interface GalleryItem {
  image: string;
  description: string;
}

const galleryImages = import.meta.glob(
  "../assets/images/gallery/*",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
) as Record<string, string>;

export const galleryData: GalleryItem[] = [
  {
    image: galleryImages["../assets/images/gallery/1.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 1 goes here.",
  },

  {
    image: galleryImages["../assets/images/gallery/2.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 2 goes here.",
  },

  {
    image: galleryImages["../assets/images/gallery/3.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 3 goes here.",
  },

  {
    image: galleryImages["../assets/images/gallery/4.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 4 goes here.",
  },
  {
    image: galleryImages["../assets/images/gallery/5.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 5 goes here.",
  },
  {
    image: galleryImages["../assets/images/gallery/6.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 6 goes here.",
  },
  {
    image: galleryImages["../assets/images/gallery/7.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 7 goes here.",
  },
  {
    image: galleryImages["../assets/images/gallery/8.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 8 goes here.",
  },
  {
    image: galleryImages["../assets/images/gallery/9.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 9 goes here.",
  },
  {
    image: galleryImages["../assets/images/gallery/10.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 10 goes here.",
  },
  {
    image: galleryImages["../assets/images/gallery/11.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 11 goes here.",
  },
  {
    image: galleryImages["../assets/images/gallery/12.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 12 goes here.",
  },
  {
    image: galleryImages["../assets/images/gallery/13.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 13 goes here.",
  },
  {
    image: galleryImages["../assets/images/gallery/14.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 14 goes here.",
  },
  {
    image: galleryImages["../assets/images/gallery/15.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 15 goes here.",
  },
  {
    image: galleryImages["../assets/images/gallery/16.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 16 goes here.",
  },
  {
    image: galleryImages["../assets/images/gallery/17.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 17 goes here.",
  },
  {
    image: galleryImages["../assets/images/gallery/18.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 18 goes here.",
  },
  {
    image: galleryImages["../assets/images/gallery/19.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 19 goes here.",
  },
  {
    image: galleryImages["../assets/images/gallery/20.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 20 goes here.",
  },
  {
    image: galleryImages["../assets/images/gallery/21.jpg"],
    description:
      "Your dedicated 20–25 word description for photo 21 goes here.",
  },
];
