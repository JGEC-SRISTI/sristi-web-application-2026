import sponsor1 from "../assets/images/sponsors/TakeUForward.png";
import sponsor2 from "../assets/images/sponsors/Belmaxx.png";
import sponsor3 from "../assets/images/sponsors/SBI.png";
import sponsor4 from "../assets/images/sponsors/Braand_school.png";
import sponsor5 from "../assets/images/sponsors/chess.png";
import sponsor6 from "../assets/images/sponsors/codechef.png";
import sponsor7 from "../assets/images/sponsors/gdg_siliguri.png";
import sponsor8 from "../assets/images/sponsors/images.png";
import sponsor9 from "../assets/images/sponsors/India_post.png";
import sponsor10 from "../assets/images/sponsors/star_cement.png";
import sponsor11 from "../assets/images/sponsors/stpi.png";
import sponsor12 from "../assets/images/sponsors/xyz.png";
import sponsor13 from "../assets/images/sponsors/bim_mantra.png";    
import sponsor14 from "../assets/images/sponsors/blackboard.png";
import sponsor15 from "../assets/images/sponsors/caffeinosine.png";
import sponsor16 from "../assets/images/sponsors/global_reach.png";
import sponsor17 from "../assets/images/sponsors/kokoro.jpg";
import sponsor18 from "../assets/images/sponsors/sajavaat.png";
import sponsor19 from "../assets/images/sponsors/sugoidrop.png";
import sponsor20 from "../assets/images/sponsors/triumph.png";
import sponsor21 from "../assets/images/sponsors/zen_verse.png";



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
    name: "Belmaxx",
    logo: sponsor2,
    URI: "https://www.belmaxx.in",
  },
  {
    id: 3,
    name: "SBI",
    logo: sponsor3,
    URI: "https://onlinesbi.sbi.bank.in/",
  },
  {
    id: 4,
    name: "Braand School",
    logo: sponsor4,
    URI: "https://braandschool.com",
  },
  {
    id: 5,
    name: "Chess.com",
    logo: sponsor5,
    URI: "https://www.chess.com/",
  },
  {
    id: 6,
    name: "CodeChef",
    logo: sponsor6,
    URI: "https://www.codechef.com/",
  },
  {
    id: 7,
    name: "GDG Siliguri",
    logo: sponsor7,
    URI: "https://gdgsiliguri.com/",
  },
  {
    id: 8,
    name: "Ambition Edu Center",
    logo: sponsor8,
    URI: "https://ambition.edu.in",
  },
  {
    id: 9,
    name: "India Post",
    logo: sponsor9,
    URI: "https://www.indiapost.gov.in/",
  },
  {
    id: 10,
    name: "Star Cement",
    logo: sponsor10,
    URI: "https://www.starcement.co.in",
  },
  {
    id: 11,
    name: "STPI",
    logo: sponsor11,
    URI: "https://www.stpi.in/",
  },
  {
    id: 12,
    name: ".XYZ",
    logo: sponsor12,
    URI: "https://gen.xyz/",
  },
  {
    id: 13,
    name: "Bim Mantra",
    logo: sponsor13,
    URI: "https://www.instagram.com/bim_mantra/",
  },
  {
    id: 14,
    name: "Blackboard",
    logo: sponsor14,
    URI: "https://www.instagram.com/sristi.jgec/",
  },
  {
    id: 15,
    name: "Caffeinosine Coffee",
    logo: sponsor15,
    URI: "https://www.instagram.com/caffeinosine.coffee/",
  },
  {
    id: 16,
    name: "Global Reach",
    logo: sponsor16,
    URI: "https://www.instagram.com/globalreachsiliguri/",
  },
  {
    id: 17,
    name: "Kokoro",
    logo: sponsor17,
    URI: "https://www.instagram.com/kokoro.store___/",
  },
  {
    id: 18,
    name: "Sajavaat",
    logo: sponsor18,
    URI: "https://sajavaat.in/",
  },
  {
    id: 19,
    name: "Sugoi Drop",
    logo: sponsor19,
    URI: "https://www.sugoidrop.com/",
  },
  {
    id: 20,
    name: "Triumph",
    logo: sponsor20,
    URI: "https://www.triumph.com/",
  },
  {
    id: 21,
    name: "Zen Verse",
    logo: sponsor21,
    URI: "https://www.instagram.com/ft.zenverse/",
  },
];

export default sponsors;