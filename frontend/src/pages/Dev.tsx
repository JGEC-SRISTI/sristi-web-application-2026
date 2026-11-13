
import { useState } from "react";
import DevCard from "../components/dev/DevCard.tsx";
import "../styles/dev.css";

import entryVideo from "../assets/videos/dev.entry.mp4";

import mrinmoy from "../assets/images/dev/mrinmoy.png";
import shibaji from "../assets/images/dev/shibaji.png";
import priyatosh from "../assets/images/dev/priyatosh.png";
import dipesh from "../assets/images/dev/dipesh.png";

const developers = [
  {
    name: "Mrinmoy Mahato",
    number: "01",
    image: mrinmoy,
    roles: [
      "Web Lead",
      "Database Manager",
      "Backend Developer",
    ],
    email: "mm2802@cse.jgec.ac.in",
    linkedin: "https://www.linkedin.com/in/mrinmoy-mahato-6a7262324/",
    github: "https://github.com/sh33r0",
  },
  {
    name: "Shibaji Pal",
    number: "02",
    image: shibaji,
    roles: [
      "Frontend Developer",
      "Animator",
      "UI/UX Designer",
    ],
    email: "sp2811@cse.jgec.ac.in",
    linkedin: "https://www.linkedin.com/in/shibaji-pal-a09a682b1/",
    github: "https://github.com/shibajipal",
  },
  {
    name: "Priyatosh Pal",
    number: "03",
    image: priyatosh,
    roles: [
      "Backend Developer",
      "Database Admin",
      "Authenticator",
    ],
    email: "pp2870@cse.jgec.ac.in",
    linkedin: "https://www.linkedin.com/in/priyatosh-pal/",
    github: "https://github.com/DCoder27",
  },
  {
    name: "Dipesh Das",
    number: "04",
    image: dipesh,
    roles: [
      "Frontend Developer",
      "UI/UX Designer",
      "Authenticator",
    ],
    email: "dd2874@cse.jgec.ac.in",
    linkedin: "https://www.linkedin.com/in/d1p3sh-d4s-4b1dd3n/",
    github: "https://github.com/dipesh-2874",
  },
];

function Dev() {
  const [introLeaving, setIntroLeaving] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  const finishIntro = () => {
    if (introLeaving || introDone) return;

    setIntroLeaving(true);

    window.setTimeout(() => {
      setIntroDone(true);
    }, 900);
  };

  return (
    <main className="dev-page">

      {/* ENTRY ANIMATION */}
      {!introDone && (
        <div
          className={`dev-intro ${
            introLeaving ? "dev-intro-leaving" : ""
          }`}
        >
          <video
            className="dev-intro-video"
            src={entryVideo}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={finishIntro}
            onError={finishIntro}
          />

          <div className="dev-intro-overlay" />

          <div className="dev-intro-label">
            <span>SRISTI 2K26</span>
            <span>THE DEVELOPMENT TEAM</span>
          </div>
        </div>
      )}

      {/* DEVELOPERS SECTION */}
      <section
        className={`dev-content ${
          introDone ? "dev-content-visible" : ""
        }`}
      >
        <div className="dev-background-shapes">
          <span className="dev-shape circle" />
          <span className="dev-shape triangle" />
          <span className="dev-shape square" />
        </div>

        <header className="dev-header">
          <div className="dev-eyebrow">
            <span className="dev-eyebrow-line" />
            BEHIND THE EXPERIENCE
            <span className="dev-eyebrow-line" />
          </div>

          <h1 className="dev-title">
            the <span>devers</span>
          </h1>

          <p>
            The minds behind the code, the creativity
            and the experience of SRISTI 2K26.
          </p>
        </header>

        <div className="dev-grid">
          {developers.map((developer, index) => (
            <DevCard
              key={developer.number}
              developer={developer}
              index={index}
            />
          ))}
        </div>

        <footer className="dev-footer">
          <div className="dev-footer-line" />

          <p>
            BUILT WITH PRECISION. POWERED BY CREATIVITY.
          </p>

          <span>SRISTI 2K26 ©</span>
        </footer>
      </section>
    </main>
  );
}

export default Dev;
