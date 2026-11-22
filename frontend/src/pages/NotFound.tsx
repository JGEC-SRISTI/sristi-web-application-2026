import { useState } from "react";
import { ArrowLeft, Compass, Home } from "lucide-react";
import { Link } from "react-router-dom";
import soldierImage from "../assets/images/pink_soldier.png";
import "./NotFound.css";

export default function NotFound() {
  const [shakeCount, setShakeCount] = useState(0);

  return (
    <main className="not-found-page">
      <div className="not-found-grid" aria-hidden="true" />
      <div className="not-found-glow not-found-glow--top" aria-hidden="true" />
      <div className="not-found-glow not-found-glow--bottom" aria-hidden="true" />

      <header className="not-found-header">
        <Link className="not-found-brand" to="/" aria-label="SRISTI home">
          <img src="/favicon.svg" alt="" />
          <span>SRISTI<span className="not-found-brand-year">2K26</span></span>
        </Link>
        <span className="not-found-header-label">THE TECHFEST OF JGEC</span>
      </header>

      <section className="not-found-content" aria-labelledby="not-found-title">
        <div className="not-found-copy">
          <div className="not-found-eyebrow">
            <span className="not-found-live-dot" /> LOST IN THE ARENA
          </div>
          <button
            className={`not-found-number${shakeCount ? " is-shaking" : ""}`}
            type="button"
            aria-label="Shake the 404 digits"
            onClick={() => setShakeCount((count) => count + 1)}
          >
            <span className="not-found-digit" key={`${shakeCount}-first`}>4</span>
            <span className="not-found-digit" key={`${shakeCount}-middle`}>0</span>
            <span className="not-found-digit" key={`${shakeCount}-last`}>4</span>
          </button>
          <h2 id="not-found-title">This page left the game.</h2>
          <p>
            The link may be wrong, or this page may have moved. Let’s get you
            back to the action.
          </p>
          <div className="not-found-actions">
            <Link className="not-found-home-button" to="/">
              <Home size={17} strokeWidth={2.2} />
              <span>Back to home</span>
              <ArrowLeft className="not-found-button-arrow" size={17} />
            </Link>
            <Link className="not-found-events-link" to="/events">
              <Compass size={17} /> Explore events
            </Link>
          </div>
          <div className="not-found-coordinate">JGEC · SRISTI 2K26</div>
        </div>

        <div className="not-found-visual" aria-hidden="true">
          <div className="not-found-ring not-found-ring--outer" />
          <div className="not-found-ring not-found-ring--inner" />
          <div className="not-found-orbit"><span /></div>
          <img className="not-found-soldier" src={soldierImage} alt="" />
          <div className="not-found-visual-caption">PLAYER NOT FOUND</div>
        </div>
      </section>

      <footer className="not-found-footer">
        <span>SRISTI 2K26</span>
        <span className="not-found-footer-line" />
        <span>THE GAME IS STILL ON</span>
      </footer>
    </main>
  );
}
