export type StaffGroup = "faculty" | "students";

export interface StaffMember {
  name: string;
  group: StaffGroup;
  role: string;
  image: string;
}

const staffImages = import.meta.glob(
  "../assets/images/staffs/**/*.jpeg",
  { eager: true, import: "default", query: "?url" },
) as Record<string, string>;

const getImage = (group: StaffGroup, filename: string) =>
  staffImages[`../assets/images/staffs/${group}/${filename}.jpeg`];

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

export const students: StaffMember[] = [
  ["Biswanath Das", "biswanath_cc", "Chief coordinator"],
  ["Arkaprava Mukhopadhyay", "arka_cc", "Chief coordinator"],
  ["Sourav De", "sourav", "Cashier"],
  ["Nirveek Ghosh", "nirveek", "Cashier"],
  ["Ambika Bag", "ambika", "Event manager"],
  ["Koustav Batabyal", "koustav", "Event manager"],
  ["Dyutimoy Dan", "dyutimoy", "Event planner"],
  ["Subhamoy Phadikar", "subhomoy", "Event planner"],
  ["Reeddhy Chatterjee", "reddhy", "Sponsor head"],
  ["Alaul Anam", "alaul", "Sponsor head"],
  ["Akriti Pal", "akriti", "Outreach head"],
  ["Ramyak Chakrabarti", "ramyak", "Outreach head"],
  ["Richa Singh", "richa", "Outreach head"],
  ["Bishal Mondal", "bishal", "Logistics head"],
  ["Banisa Pal", "banisa", "Logistics head"],
  ["Satadal Gain", "satadal", "Production head"],
  ["Deep Kumar Dey", "deep", "Social media head"],
  ["Rounak Mohata", "rounak", "Design & decoration head"],
  ["Payel Saha", "payel", "Design & decoration head"],
  ["Mrinmoy Mahato", "mrinmoy", "Web lead"],
].map(([name, filename, role]) => ({
  name,
  group: "students",
  role,
  image: getImage("students", filename),
}));
