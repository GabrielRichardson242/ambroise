export default function GrainInfoDrawer({ open, onOpen, onClose }) {
  const handleJoinSubmit = (e) => {
    e.preventDefault();

    // Temporary exhibition behaviour:
    // reloads back to fresh room state after someone submits.
    window.location.reload();
  };

  return (
    <>
      <div
        onClick={onOpen}
        style={{
          position: "fixed",
          left: "12px",
          right: "12px",
          bottom: "32px",
          height: "38px",
          zIndex: 999990,
          background: "#202020",
          border: "0.5px solid #AFAFAF",
          color: "#AFAFAF",
          transform: open ? "translateY(120%)" : "translateY(0)",
          transition: "transform 420ms ease",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: open ? "none" : "auto",
          boxSizing: "border-box",
        }}
      >
        <div
          className="font-disket uppercase"
          style={{
            fontSize: "clamp(14px, 4vw, 22px)",
            letterSpacing: "0.04em",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <span>GABRIEL RICHARDSON</span>
          <span style={{ color: "#F4C403", fontSize: "22px" }}>⌃</span>
        </div>
      </div>

      <aside
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999991,
          background: "#202020",
          color: "#ffffff",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 520ms cubic-bezier(.2,.8,.2,1)",
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          boxSizing: "border-box",
          padding: "10px 6px 40px",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="font-disket uppercase"
          style={{
            width: "100%",
            minHeight: "38px",
            border: "0.5px solid #AFAFAF",
            background: "#202020",
            color: "#AFAFAF",
            borderRadius: 0,
            padding: "0 14px",
            margin: 0,
            textAlign: "left",
            fontSize: "clamp(15px, 4vw, 22px)",
            letterSpacing: "0.04em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            cursor: "pointer",
            boxSizing: "border-box",
          }}
        >
          <span>GABRIEL RICHARDSON</span>
          <span style={{ color: "#F4C403", fontSize: "22px" }}>⌄</span>
        </button>

        <section
          style={{
            padding: "18px 20px 28px",
            boxSizing: "border-box",
          }}
        >
           <ProfileIntro />

            <ContactBlock />
        </section>

        <WhatIsGrain />

        <section
            style={{
                padding: "0 20px",
                display: "flex",
                justifyContent: "center",
            }}
            >
            <div
                style={{
                width: "100%",
                maxWidth: "720px",
                }}
            >
                <div
                className="font-disket uppercase"
                style={{
                    color: "#fafafa",
                    fontSize: "clamp(12px, 3.2vw, 18px)",
                    lineHeight: 1.55,
                    letterSpacing: "0.02em",
                    marginBottom: "24px",
                }}
                >
                I’M STILL BUILDING. IF YOU WANT A ROOM WHEN IT’S READY, SIGN UP
                BELOW.
                <br />
                I’LL SWING YOU A MESSAGE WHEN IT’S GOOD ENOUGH.
                </div>

                <JoinEarlyForm onSubmit={handleJoinSubmit} />
            </div>
            </section>
      </aside>
    </>
  );
}

function ProfileIntro() {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        className="font-disket uppercase"
        style={{
          fontSize: "clamp(12px, 4vw, 18px)",
          lineHeight: 1.4,
          letterSpacing: "0.04em",
          marginBottom: "42px",
        }}
      >
        CREATIVE TECHNOLOGIST
        <br />
        BRIGHTON
        <br />
        22
      </div>

      <div className="font-newrail">
        <div
          style={{
            color: "#AFAFAF",
            fontSize: "clamp(12px, 3vw, 18px)",
            borderBottom: "0.5px solid #AFAFAF",
            marginBottom: "12px",
          }}
        >
          Availability
        </div>

        <p
          className="font-britrln"
          style={{
            margin: 0,
            color: "#ffffff",
            fontSize: "clamp(14px, 3.8vw, 24px)",
            lineHeight: 1.36,
            fontWeight: 400,
          }}
        >
          Looking for full time junior roles. 
          <br/>
          <br/>
          Grain was built with no prior dev or tech
          experience or practical know-how. Always down for the challenge. 
          <br/>
          <br/>
          Portfolio is still under construction, feel free to bookmark and check back 
          every other day.
          <br/>
        </p>
      </div>
    </div>
  );
}

function ContactBlock() {
  return (
    <div className="font-newrail" style={{ marginBottom: "42px" }}>
      <div
        style={{
          color: "#AFAFAF",
          fontSize: "clamp(12px, 3vw, 18px)",
          borderBottom: "0.5px solid #AFAFAF",
        }}
      >
        Contacts
      </div>

      <ContactRow label="Instagram" href="https://www.instagram.com/gabrielrichardson_">
        @GabrielRichardson_
      </ContactRow>

      <ContactRow label="LinkedIn" href="#">
        LinkedIn
      </ContactRow>

      <ContactRow label="Email" href="mailto:GabrielRichardson242@gmail.com">
        GabrielRichardson242@gmail.com
      </ContactRow>

      <div
        style={{
          borderTop: "0.5px solid #AFAFAF",
          marginTop: "12px",
          paddingTop: "0px",
        }}
      >
        <ContactRow label="Portfolio" href="https://gabriel-folio.vercel.app/">
          Gabriel-folio.vercel.app
        </ContactRow>
      </div>
    </div>
  );
}

function ContactRow({ label, href, children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "100px minmax(0, 1fr)",
        columnGap: "10px",
        fontSize: "clamp(12px, 3vw, 18px)",
        fontWeight: 400,
        lineHeight: 2.4,
      }}
    >
      <div style={{ color: "#AFAFAF" }}>{label}</div>

      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
        style={{
          color: "#ffffff",
          textDecoration: "underline",
          textUnderlineOffset: "1px",
          overflowWrap: "break-word",
        }}
      >
        {children}
      </a>
    </div>
  );
}

function WhatIsGrain() {
  return (
    <>
      <section
        className="font-disket uppercase"
        style={{
          background: "#202020",
          padding: "30px 20px 34px",
          margin: "0 clamp(12px, 4vw, 72px) 42px",
          boxSizing: "border-box",
          boxShadow: `
            inset 0 0 24px rgba(0,0,0,0.55),
            inset 0 0 2px rgba(255,255,255,0.06)
        `,
        }}
      >
        <div
          style={{
            color: "#F4C403",
            fontSize: "clamp(12px, 3.2vw, 18px)",
            lineHeight: 1.55,
            marginBottom: "20px",
            letterSpacing: "0.02em",
          }}
        >
          WHAT IS GRAIN?
        </div>

        <div
          style={{
            color: "#FAFAFA",
            fontSize: "clamp(12px, 3.2vw, 18px)",
            lineHeight: 1.55,
            marginBottom: "60px",
            letterSpacing: "0.02em",
          }}
        >
          INSTAGRAM IS GREAT TO PRESENT YOUR PERSONALITY,
          <br />
          <br />
          PORTFOLIOS ARE GREAT TO SHOW YOUR WORK,
          <br />
          <br />
          BUT NEITHER ARE GREAT FOR CREATIVE IDENTITY.
        </div>

        <div
          style={{
            color: "#F4C403",
            fontSize: "clamp(12px, 3.2vw, 18px)",
            lineHeight: 1.55,
            marginBottom: "60px",
            letterSpacing: "0.02em",
          }}
        >
          GRAIN ALLOWS ARTISTS TO SHOW US HOW THEY GOT HERE.
        </div>

        <p style={paragraphStyle}>
          IT'S DESIGNED TO BE AN INTERACTIVE LAYER ADDED TO AN INSTAGRAM BIO.
          USING LIDAR SCANS, ARTISTS CAN TAKE A REAL PLACE IN THE WORLD, ADD
          THEIR WORK AND MAKE IT THEIRS.
        </p>

        <p style={paragraphStyle}>
          I DIDN’T WANT TO COMPETE WITH INSTAGRAM, I WANTED TO USE WHAT THEY DO
          WELL, BUILDING PERSONAL NETWORKS + OUTREACH, AND ADD A LAYER TO OFFER
          WHAT THEY DON’T, DEDICATED CREATIVE IDENTITY EXPRESSION.
        </p>

        <p style={paragraphStyle}>
          THE NEW CREATIVE ECONOMY IS FREELANCE, AND AFTER TALKING TO SOME YOUNG
          ONES, INSTAGRAM IS HOW THEY CONNECT. HOWEVER, IT’S TOO NOISY TO USE
          CONVENIENTLY FOR CREATIVE PROFESSIONALS.
        </p>

        <p style={paragraphStyle}>
          THE NEXT GOAL IS TO USE THAT INSTAGRAM NETWORK YOU ALREADY HAVE, AND
          CONNECT GRAIN USERS THROUGH IT, TO CREATE A USEFUL PERSONAL CREATIVE
          NETWORK.
        </p>

        <p style={paragraphStyle}>
          INSTAGRAM IS THE HABIT FOR YOUNG PROFESSIONALS, THE END GOAL IS TO PUT
          IT TO WORK.
        </p>

        <p style={paragraphStyle}>
          THANK YOU.
          <br />
          GABRIEL
        </p>
      </section>
    </>
  );
}

const paragraphStyle = {
  margin: "0 0 28px",
  color: "#ffffff",
  fontSize: "clamp(12px, 3vw, 16px)",
  lineHeight: 1.65,
  letterSpacing: "0.02em",
};

function JoinEarlyForm({ onSubmit }) {
  return (
    <form
      onSubmit={onSubmit}
      className="font-disket uppercase"
      style={{
        border: "0.5px solid #AFAFAF",
        marginTop: "30px",
      }}
    >
      <DrawerInput label="Name:" name="name" />
      <DrawerInput label="Email:" name="email" type="email" />
      <DrawerInput label="Instagram:" name="instagram" />

      <div
        style={{
          borderTop: "0.5px solid #AFAFAF",
          padding: "10px",
          textAlign: "center",
          fontSize: "clamp(10px, 2.8vw, 14px)",
        }}
      >
        THANK YOU MORE
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "0 0 14px" }}>
        <button
          type="submit"
          className="font-disket uppercase"
          style={{
            width: "130px",
            height: "28px",
            border: 0,
            borderRadius: 0,
            background: "#ffffff",
            color: "#1b1b1b",
            fontSize: "12px",
            padding: 0,
            margin: 0,
            cursor: "pointer",
          }}
        >
          DONE
        </button>
      </div>
    </form>
  );
}

function DrawerInput({ label, name, type = "text" }) {
  return (
    <label
      style={{
        display: "grid",
        gridTemplateColumns: "100px minmax(0, 1fr)",
        borderTop: "0.5px solid #AFAFAF",
        minHeight: "30px",
        alignItems: "center",
        fontSize: "clamp(10px, 2.8vw, 14px)",
      }}
    >
      <span style={{ paddingLeft: "22px" }}>{label}</span>

      <input
        name={name}
        type={type}
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
          color: "#ffffff",
          border: 0,
          outline: "none",
          fontFamily: "NewRail, sans-serif",
          fontSize: "16px",
          boxSizing: "border-box",
        }}
      />
    </label>
  );
}