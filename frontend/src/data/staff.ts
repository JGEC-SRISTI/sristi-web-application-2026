export type StaffGroup = "faculty" | "students";

export interface StaffMember {
  name: string;
  group: StaffGroup;
  role: string;
  image: string;
  socials?: {
    instagram: string;
    linkedin: string;
  };
}

const staffImages = import.meta.glob(
  "../assets/images/staffs/**/*.webp",
  { eager: true, import: "default", query: "?url" },
) as Record<string, string>;

const getImage = (group: StaffGroup, filename: string) =>
  staffImages[`../assets/images/staffs/${group}/${filename}.webp`];

export const faculty: StaffMember[] = [
  ["Dr. Ayan Pramanick", "ayan_pramanik", "Faculty coordinator"],
  ["Sri Debjyoti Chatterjee", "dc_sir", "Faculty coordinator"],
  ["Smt. Gopa Mondal", "gopa_mondal", "Faculty coordinator"],
  ["Dr. Samir Das", "samir_das", "Faculty coordinator"],
  ["Dr. Sobhraj Halder", "sobhraj_halder", "Faculty coordinator"],
  ["Sri Somnath Dhibar", "somenath_dhibar", "Faculty coordinator"],
  ["Dr. Sudip Mandal", "sudip_mandal", "Faculty coordinator"],
  ["Sri Ujjal Dey", "ujjal_dey", "Faculty coordinator"],
].map(([name, filename, role]) => ({
  name,
  group: "faculty",
  role,
  image: getImage("faculty", filename),
}));

const studentSocials: Record<
  string,
  { instagram: string; linkedin: string }
> = {
  biswa_cc: { instagram: "https://www.instagram.com/bwnny.exe/", linkedin: "https://www.linkedin.com/in/biswanath-das-993938214/" },
  arka_cc: { instagram: "https://www.instagram.com/ap_m__15/", linkedin: "https://www.linkedin.com/in/arkaprava-mukhopadhyay-b13b56340/" },
  mrinmoy: { instagram: "https://www.instagram.com/fern_weh_0/", linkedin: "https://www.linkedin.com/in/mrinmoy-mahato-6a7262324/" },
  sourav: { instagram: "https://www.instagram.com/subha.verse_/", linkedin: "https://www.linkedin.com/in/sourav-de-02b608324/" },
  nirveek: { instagram: "https://www.instagram.com/__nytrix/", linkedin: "https://www.linkedin.com/in/nirveek-ghosh-334033326/" },
  ambika: { instagram: "https://www.instagram.com/ur_fav_ambika/", linkedin: "https://www.linkedin.com/in/ambika-bag-827740325/" },
  Batball: { instagram: "https://www.instagram.com/koustav_batabyal/", linkedin: "https://www.linkedin.com/in/koustav-batabyal-79755921a/" },
  dyutimoy: { instagram: "https://www.instagram.com/dan.dyutimoy14/", linkedin: "https://www.linkedin.com/in/dyutimoy-dan-b272a51b4/" },
  subhomoy: { instagram: "https://www.instagram.com/subhamoy_087/", linkedin: "https://www.linkedin.com/in/subhamoy-phadikar-24a7bb341/" },
  reddhy: { instagram: "https://www.instagram.com/reeddhy_/", linkedin: "https://www.linkedin.com/in/reeddhy-chatterjee-b86700328/" },
  alaul: { instagram: "https://www.instagram.com/anam_alaul10/", linkedin: "https://www.linkedin.com/in/alaul-anam-13b0b0230/" },
  akriti: { instagram: "https://www.instagram.com/akriti_0726/", linkedin: "http://linkedin.com/in/pal-akriti/" },
  ramyak: { instagram: "https://www.instagram.com/bhuter_raja_05/", linkedin: "https://www.linkedin.com/in/ramyak-chakrabarti-804b46324/" },
  richa: { instagram: "https://www.instagram.com/sristi.jgec/", linkedin: "https://www.linkedin.com/in/richa-singh-50124932a/" },
  bishal: { instagram: "https://www.instagram.com/bishalmondal_10/", linkedin: "https://www.linkedin.com/in/bishal-mondal-383b10321/" },
  bani: { instagram: "https://www.instagram.com/banisa_pal/", linkedin: "https://www.linkedin.com/in/banisa-pal-a35277324/" },
  satadal: { instagram: "https://www.instagram.com/arcane_.sata/", linkedin: "https://www.linkedin.com/in/satadal-gain/" },
  deep: { instagram: "https://www.instagram.com/__deep__dey_/", linkedin: "https://www.linkedin.com/in/deep-kumar-dey-aa981030a/" },
  rounak: { instagram: "https://www.instagram.com/rounak.186/", linkedin: "https://www.linkedin.com/in/rounakmohata/" },
  payel: { instagram: "https://www.instagram.com/payel_saha_194/", linkedin: "https://www.linkedin.com/in/payel-saha-91886b313/" },
};

export const students: StaffMember[] = [
  ["Biswanath Das", "biswa_cc", "Chief coordinator"],
  ["Arkaprava Mukhopadhyay", "arka_cc", "Chief coordinator"],
  ["Mrinmoy Mahato", "mrinmoy", "Web lead"],
  ["Sourav De", "sourav", "Cashier"],
  ["Nirveek Ghosh", "nirveek", "Cashier"],
  ["Ambika Bag", "ambika", "Event manager"],
  ["Koustav Batabyal", "Batball", "Event manager"],
  ["Dyutimoy Dan", "dyutimoy", "Event planner"],
  ["Subhamoy Phadikar", "subhomoy", "Event planner"],
  ["Reeddhy Chatterjee", "reddhy", "Sponsor head"],
  ["Alaul Anam", "alaul", "Sponsor head"],
  ["Akriti Pal", "akriti", "Outreach head"],
  ["Ramyak Chakrabarti", "ramyak", "Outreach head"],
  ["Richa Singh", "richa", "Outreach head"],
  ["Bishal Mondal", "bishal", "Logistics head"],
  ["Banisa Pal", "bani", "Logistics head"],
  ["Satadal Gain", "satadal", "Production head"],
  ["Deep Kumar Dey", "deep", "Social media head"],
  ["Rounak Mohata", "rounak", "Design & decoration head"],
  ["Payel Saha", "payel", "Design & decoration head"],
].map(([name, filename, role]) => ({
  name,
  group: "students",
  role,
  image: getImage("students", filename),
  socials: studentSocials[filename],
}));
