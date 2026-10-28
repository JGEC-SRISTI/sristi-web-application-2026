import sponsor1 from "../assets/images/sponsors/TakeUForward.png";
import sponsor2 from "../assets/images/sponsors/Ambuja_cement.webp";
import sponsor3 from "../assets/images/sponsors/SBI.png";
import sponsor4 from "../assets/images/sponsors/myntra.png";
import sponsor5 from "../assets/images/sponsors/physics_wallah.png";

export interface Sponsor {
  id: number;
  name: string;
  logo: string;
  URI: string;
}

const sponsors: Sponsor[] = [
  {
    id: 1,
    name: "TakeUForward",
    logo: sponsor1,
    URI: "https://takeuforward.org/",
  },
  {
    id: 2,
    name: "Ambuja Cement",
    logo: sponsor2,
    URI: "https://www.ambujacement.com/",
  },
  {
    id: 3,
    name: "SBI",
    logo: sponsor3,
    URI: "https://onlinesbi.sbi.bank.in/",
  },
  {
    id: 4,
    name: "Myntra",
    logo: sponsor4,
    URI: "https://www.myntra.com/",
  },
  {
    id: 5,
    name: "Physics Wallah",
    logo: sponsor5,
    URI: "https://www.pw.live/",
  },
];

export default sponsors;