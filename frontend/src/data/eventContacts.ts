export interface EventCoordinator {
  name: string;
  email: string;
  phone: string;
}

export interface EventContact {
  coordinator1: EventCoordinator;
  coordinator2?: EventCoordinator;
  coordinator3?: EventCoordinator;
}

const eventContacts: Partial<Record<string, EventContact>> = {
  a1: {
    coordinator1: {
      name: "Gaurav Saha",
      email: "gs2819@ce.jgec.ac.in",
      phone: "+91 8513826347",
    },
    coordinator2: {
      name: "Soham Pal ",
      email: "sp2805@ce.jgec.ac.in",
      phone: "+91 9953816042",
    },
  },
  a2: {
    coordinator1: {
      name: "Pralay Pramanick ",
      email: "pp2868@ce.jgec.ac.in",
      phone: "+91 8158812616",
    },
    coordinator2: {
      name: "Arnab Jana",
      email: "aj2802@ce.jgec.ac.in",
      phone: "+91 7074493775",
    },
  },
  a3: {
    coordinator1: {
      name: "Samprity Sarkar ",
      email: "ss2866@gmail.com",
      phone: "+91 7469815848",
    },
    coordinator2: {
      name: "Md Amanulla shah ",
      email: "ma2858@ce.jgec.ac.in",
      phone: "+91 8116727295",
    },
  },
  a4: {
    coordinator1: {
      name: "Tamojit Chaudhuari",
      email: "tc2825@ce.jgec.ac.in",
      phone: "+91 6296490614",
    },
    coordinator2: {
      name: "Arghya Sarkar",
      email: "as2839@ce.jgec.ac.in",
      phone: "+91 9339780039",
    },
  },
  a5: {
    coordinator1: {
      name: "Pushan Mondal",
      email: "pm2875@ce.jgec.ac.in",
      phone: "+91 9433941076",
    },
    coordinator2: {
      name: "Wasir Ahmed",
      email: "wa2810@ce.jgec.ac.in",
      phone: "+91 9748879863",
    },
  },
  a6: {
    coordinator1: {
      name: "ARKA DUTTA ",
      email: "ad2869@ee.jgec.ac.in",
      phone: "+91 9874653604",
    },
    coordinator2: {
      name: "Aishik Dan ",
      email: "ad2813@ee.jgec.ac.in",
      phone: "+91 9064553329",
    },
  },
  a7: {
    coordinator1: {
      name: "Ramyak Chakrabarti",
      email: "rc2806@ee.jgec.ac.in",
      phone: "+91 8695446943",
    },
    coordinator2: {
      name: "Gourav Pal",
      email: "gp2823@ece.jgec.ac.in",
      phone: "+91 7810822630",
    },
  },
  a8: {
    coordinator1: {
      name: "Sourav De",
      email: "sd2807@ee.jgec.ac.in",
      phone: "+91 7872876575",
    },
    coordinator2: {
      name: "Himanshu Biswas ",
      email: "hb2836@ece.jgec.ac.in",
      phone: "+91 6294776561",
    },
  },
  a9: {
    coordinator1: {
      name: "Kazi Nazmul Kabir",
      email: "kn2863@ece.jgec.ac.in",
      phone: "+91 9332430224",
    },
    coordinator2: {
      name: "Payel Saha ",
      email: "ps2816@ee.jgec.ac.in",
      phone: "+91 9382605932",
    },
  },
  a10: {
    coordinator1: {
      name: "Subham Prasad",
      email: "sp2809@ce.jgec.ac.in",
      phone: "+91 9851958191",
    },
    coordinator2: {
      name: "Sagnik Ghosh",
      email: "sg2812@cse.jgec.ac.in",
      phone: "+91 9800244003",
    },
  },
  a11: {
    coordinator1: {
      name: "Debajyoti Ghosh",
      email: "dg2867@ce.jgec.ac.in",
      phone: "+91 8777636407",
    },
    coordinator2: {
      name: "Shakib Ahmed ",
      email: "sa2801@me.jgec.ac.in",
      phone: "+91 9102260284",
    },
  },
  a12: {
    coordinator1: {
      name: "Ramiz Raza",
      email: "rr2856@ece.jgec.ac.in",
    phone: "+91 8918890669",
    },
    coordinator2: {
      name: "Priyangshu Mukherjee",
      email: "pm2804@it.jgec.ac.in",
      phone: "+91 9007313817",
    },
  },
  a13: {
    coordinator1: {
      name: "Sukrit Majumdar",
      email: "sm2809@it.jgec.in",
      phone: "+91 7811808906",
    },
    coordinator2: {
      name: "Shantanu Mandal",
      email: "sm2839@cse.jgec.ac.in",
      phone: "+91 7001012788",
    },
  },
  a14: {
    coordinator1: {
      name: "Biraj Roy",
      email: "br2842@cse.jgec.ac.in",
      phone: "+91 7810941767",
    },
    coordinator2: {
      name: "Priyam Chakraborty",
      email: "pc2805@it.jgec.ac.in",
      phone: "+91 9907304214",
    },
  },
  a15: {
    coordinator1: {
      name: "Mrinmoy Mahato",
      email: "mm2802@cse.jgec.ac.in",
      phone: "+91 9142051776",
    },
    coordinator2: {
      name: "Gautam Maity",
      email: "gm2842@it.jgec.ac.in",
      phone: "+91 7364090654",
    },
  },
  a16: {
    coordinator1: {
      name: "Sayan Majumdar",
      email: "sm2817@ece.jgec.ac.in",
      phone: "+91 7063639654",
    },
    coordinator2: {
      name: "Atal Raj",
      email: "ar2806@ece.jgec.ac.in",
      phone: "+91 8670861828",
    },
  },
  a17: {
    coordinator1: {
      name: "Sagnik Ghosh",
      email: "sg2812@cse.jgec.ac.in",
      phone: "+91 9800244003",
    },
    coordinator2: {
      name: "Sounak Dey ",
      email: "sd2818@it.jgec.ac.in",
      phone: "+91 7318725154",
    },
    coordinator3: {
      name: "Tiyasa Patra",
      email: "tp2867@cse.jgec.ac.in",
      phone: "+91 7908606962",
    },
  },
  a18: {
    coordinator1: {
      name: "Ananya Sinhababu ",
      email: "as2807@cse.jgec.ac.in",
      phone: "+91 9332652175",
    },
    coordinator2: {
      name: "Upayan De",
      email: "ud2802@ece.jgec.ac.in",
      phone: "+91 9748098603",
    },
  },
  a19: {
    coordinator1: {
      name: "Sani Pal",
      email: "sp2865@ce.jgec.ac.in",
      phone: "+91 9883579195",
    },
    coordinator2: {
      name: "DEBAPRIYA MAJI",
      email: "dm2843@ee.jgec.ac.in",
      phone: "+91 7865997544",
    },
  },
  a20: {
    coordinator1: {
      name: "Dipesh Das",
      email: "dd2874@cse.jgec.ac.in",
      phone: "+91 9733717805",
    },
    coordinator2: {
      name: "Rounak Mohata ",
      email: "rm2821@it.jgec.ac.in",
      phone: "+91 9434232157",
    },
  },
  a21: {
    coordinator1: {
      name: "Debajyoti Ghosh",
      email: "dg2867@ce.jgec.ac.in",
      phone: "+91 8777636407",
    },
    coordinator2: {
      name: "Shoeb Akhtar",
      email: "sa2857@ce.jgec.ac.in",
      phone: "+91 9064390871",
    },
  },
  a22: {
    coordinator1: {
      name: "DEBAPRIYA MAJI ",
      email: "dm2843@ee.jgec.ac.in",
      phone: "+91 7865997544",
    },
    coordinator2: {
      name: "Satadal Gain",
      email: "sg2832@ce.jgec.ac.in",
      phone: "+91 9734193989",
    },
  },
  a23: {
    coordinator1: {
      name: "Aniket Mandal ",
      email: "am2870@ee.jgec.ac.in",
      phone: "+91 9064467443",
    },
    coordinator2: {
      name: "Mounya Mishra ",
      email: "mm2868@ee.jgec.ac.in",
      phone: "+91 9641239940",
    },
  },
  a24: {
    coordinator1: {
      name: "Sabyasachi Ghosh",
      email: "sg2806@me.jgec.ac.in",
      phone: "+91 7001523015",
    },
    coordinator2: {
      name: "Debjit Paul",
      email: "dp2809@me.jgec.ac.in",
      phone: "+91 9875528124",
    },
  },

  a25: {
    coordinator1: {
      name: "Tanay Roy",
      email: "tr2840@me.jgec.ac.in",
      phone: "+91 7063842730",
    },
    coordinator2: {
      name: "Sagnik Tripathi",
      email: "st2818@me.jgec.ac.in",
      phone: "+91 7449584512",
    },
  },
  a26: {
    coordinator1: {
      name: "Kunal Nag",
      email: "kn2807@me.jgec.ac.in",
      phone: "+91 8617679669",
    },
    coordinator2: {
      name: "Akriti Pal",
      email: "ap2877@me.jgec.ac.in",
      phone: "+91 81164 28183",
    },
  },
  a27: {
    coordinator1: {
      name: "Rana Dutta",
      email: "rd2869@cse.jgec.ac.in",
      phone: "+91 9832322684",
    },
    coordinator2: {
      name: "Sourav De",
      email: "sd2807@ee.jgec.ac.in",
      phone: "+91 7872876575",
    },
  },
  a28: {
    coordinator1: {
      name: "PUSHAN MONDAL ",
      email: "pm2875@ce.jgec.ac.in",
      phone: "+91 9433941076",
    },
    coordinator2: {
      name: "Reeddhy Chatterjee ",
      email: "rc2803@ece.jgec.ac.in",
      phone: "+91 7003875680",
    },
  },
  a29: {
    coordinator1: {
      name: "Md Meftanul Hoque",
      email: "mm2856@it.jgec.ac.in",
      phone: "+91 8509595325",
    },
    coordinator2: {
      name: "Alaul Anam",
      email: "aa2830@me.jgec.ac.in",
      phone: "+91 7478948689",
    },
  },
};

export function getEventCoordinators(eventId: string): EventCoordinator[] {
  const contacts = eventContacts[eventId];
  if (!contacts) return [];

  const { coordinator1, coordinator2, coordinator3 } = contacts;
  return [coordinator1, coordinator2, coordinator3].filter((coordinator) => coordinator !== undefined);
}
