import sponsors from "../data/sponsors";

const SponsorSlider = () => {
  /*
    Duplicate the sponsors so the animation
    can loop continuously without a visible jump.
  */
  const sponsorTrack = [...sponsors, ...sponsors];

  return (
    <section
      className="
        relative
        z-10
        w-full
        py-20
        overflow-hidden
      "
    >

      {/* =========================================
          SECTION TITLE
      ========================================= */}

      <div className="text-center mb-12 px-6">

        <p
          className="
            font-mono
            text-xs
            md:text-sm
            tracking-[0.5em]
            uppercase
            text-pink-500
            mb-3
          "
        >
          Our Partners
        </p>

        <h2
          className="
            font-display
            text-4xl
            sm:text-5xl
            md:text-6xl
            tracking-wider
            text-white
          "
        >
          SPONSORS
        </h2>

      </div>


      {/* =========================================
          SLIDER WINDOW
      ========================================= */}

      <div className="relative w-full">

        {/* LEFT FADE */}

        <div
          className="
            absolute
            left-0
            top-0
            bottom-0
            w-24
            md:w-40
            z-10
            pointer-events-none
            bg-linear-to-r
            from-[#080808]
            to-transparent
          "
        />


        {/* RIGHT FADE */}

        <div
          className="
            absolute
            right-0
            top-0
            bottom-0
            w-24
            md:w-40
            z-10
            pointer-events-none
            bg-linear-to-l
            from-[#080808]
            to-transparent
          "
        />


        {/* =========================================
            MOVING TRACK
        ========================================= */}

        <div className="sponsor-slider-track">

          {sponsorTrack.map((sponsor, index) => (
            <a href={sponsor.URI} target="_blank" rel="noopener noreferrer"
              key={`${sponsor.id}-${index}`}
              className="
                sponsor-card
                group
                flex
                items-center
                justify-center
                shrink-0
                w-40
                h-24
                sm:w-48
                sm:h-28
                md:w-56
                md:h-32
                mx-3
                sm:mx-4
                md:mx-5
                rounded-xl
                border
                border-white/10
                bg-black/30
                backdrop-blur-md
                transition-all
                duration-500
              "
            >
            
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className="
                  max-w-[70%]
                  max-h-[65%]
                  object-contain
                  opacity-60
                  grayscale
                  transition-all
                  duration-500
                  group-hover:opacity-100
                  group-hover:grayscale-0
                  group-hover:scale-110
                "
              />

            </a>
          ))}

        </div>

      </div>

    </section>
  );
};

export default SponsorSlider;