import { useState, useEffect } from "react";

// ─── ASTRONOMICAL ENGINE ──────────────────────────────────────────────────────
function julianDay(date) {
  const y = date.getUTCFullYear(), m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() + (date.getUTCHours() + date.getUTCMinutes()/60)/24;
  const A = Math.floor(y/100), B = 2 - A + Math.floor(A/4);
  return Math.floor(365.25*(y+4716)) + Math.floor(30.6001*(m+1)) + d + B - 1524.5;
}
const rad = d => d * Math.PI / 180;
const norm = x => ((x % 360) + 360) % 360;
const degInSign = lon => (lon % 30).toFixed(0);
const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const signOf = lon => SIGNS[Math.floor(lon/30)];

function calcPlanets(date) {
  const T = (julianDay(date) - 2451545.0) / 36525;
  const M_sun = norm(357.52911 + 35999.05029*T);
  const L0 = norm(280.46646 + 36000.76983*T);
  const C = (1.914602 - 0.004817*T)*Math.sin(rad(M_sun)) + 0.019993*Math.sin(rad(2*M_sun));
  const sun = norm(L0 + C);

  const L_moon = norm(218.3165 + 481267.8813*T);
  const M_moon = norm(134.9634 + 477198.8676*T);
  const D = norm(297.8502 + 445267.1115*T);
  const F = norm(93.2721 + 483202.0175*T);
  const moon = norm(L_moon + 6.2888*Math.sin(rad(M_moon)) + 1.274*Math.sin(rad(2*D-M_moon))
    + 0.6583*Math.sin(rad(2*D)) + 0.2136*Math.sin(rad(2*M_moon)) - 0.1851*Math.sin(rad(M_sun)));

  const M_mer = norm(168.6562 + 149472.5153*T);
  const mercury = norm(252.2509 + 149472.6746*T + 23.44*Math.sin(rad(M_mer)) + 2.98*Math.sin(rad(2*M_mer)));

  const M_ven = norm(212.9788 + 58517.8156*T);
  const venus = norm(181.9798 + 58517.8156*T + 0.776*Math.sin(rad(M_ven)));

  const M_mar = norm(19.3730 + 19140.2993*T);
  const mars = norm(355.4330 + 19140.2993*T + 10.691*Math.sin(rad(M_mar)) + 0.623*Math.sin(rad(2*M_mar)));

  const M_jup = norm(20.9204 + 3034.9057*T);
  const jupiter = norm(34.3515 + 3034.9057*T + 5.555*Math.sin(rad(M_jup)) + 0.168*Math.sin(rad(2*M_jup)));

  const M_sat = norm(317.0207 + 1222.1138*T);
  const saturn = norm(50.0775 + 1222.1138*T + 6.359*Math.sin(rad(M_sat)) + 0.220*Math.sin(rad(2*M_sat)));

  const uranus  = norm(313.2808 + 428.5724*T);
  const neptune = norm(304.3489 + 218.4670*T);
  const pluto   = norm(238.0 + 144.9600*T);
  const node    = norm(125.0445 - 1934.1363*T);

  return { sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto, node };
}

// ─── EXACT HOUSE CUSPS from Astro.com / Placidus ─────────────────────────────
// Cuddalore, July 23 1969, 9:30 PM
// H1:Pis19 H2:Ari24 H3:Tau24 H4:Gem21(IC) H5:Can24 H6:Leo17
// H7:Vir19 H8:Lib24 H9:Sco17 H10:Sag21(MC) H11:Cap17 H12:Aqu14
const CUSPS = [349, 24, 54, 81, 114, 137, 169, 204, 227, 261, 287, 314];
// (Pisces 19 = 360-12+19 = 349; Aries 24 = 24; Taurus 24 = 54; Gemini 21 = 81; etc.)

function houseOf(lon) {
  for (let i = 0; i < 12; i++) {
    const cur = CUSPS[i], nxt = CUSPS[(i+1)%12];
    const end = nxt > cur ? nxt : nxt + 360;
    const l = lon < cur ? lon + 360 : lon;
    if (l >= cur && l < end) return i + 1;
  }
  return 1;
}

function orbBetween(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// ─── NATAL POSITIONS (Astro.com verified) ────────────────────────────────────
const NATAL_PTS = {
  "Ascendant":      349,  // Pisces 19°
  "natal Moon":     225,  // Scorpio 15°
  "natal Sun":      120,  // Leo 0°
  "natal Mercury":  121,  // Leo 1°
  "natal Venus":     78,  // Gemini 18°
  "natal Mars/MC":  243,  // Sag 3° / MC
  "natal Jupiter":  181,  // Libra 1°
  "natal Saturn":    38,  // Taurus 8°
  "natal Uranus":   180,  // Libra 0°
  "natal Neptune":  265,  // Sag 25°
  "natal Pluto":    173,  // Virgo 23°
  "natal N.Node":   352,  // Pisces 22°
  "natal Chiron":     6,  // Aries 6°
  "MC":             261,  // Sag 21°
};

function getAspects(transits) {
  const tPlanets = { Sun: transits.sun, Moon: transits.moon, Mercury: transits.mercury,
    Venus: transits.venus, Mars: transits.mars, Jupiter: transits.jupiter,
    Saturn: transits.saturn, Uranus: transits.uranus, Neptune: transits.neptune,
    "N.Node": transits.node };
  const aspTypes = [
    { name:"conjunct", angle:0, orb:8 },
    { name:"opposite", angle:180, orb:7 },
    { name:"trine",    angle:120, orb:6 },
    { name:"square",   angle:90,  orb:6 },
    { name:"sextile",  angle:60,  orb:4 },
  ];
  const found = [];
  for (const [tName, tLon] of Object.entries(tPlanets)) {
    for (const [nName, nLon] of Object.entries(NATAL_PTS)) {
      for (const asp of aspTypes) {
        const orb = orbBetween(tLon, (nLon + asp.angle) % 360);
        if (orb <= asp.orb) found.push({ transit: tName, natal: nName, aspect: asp.name, orb });
      }
    }
  }
  return found.sort((a,b) => a.orb - b.orb).slice(0, 10);
}

function buildTransitText(transits, date) {
  const labels = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto","N.Node"];
  const keys   = ["sun","moon","mercury","venus","mars","jupiter","saturn","uranus","neptune","pluto","node"];
  const positions = keys.map((k,i) =>
    `${labels[i]}: ${degInSign(transits[k])}° ${signOf(transits[k])} — house ${houseOf(transits[k])}`
  ).join("\n");
  const aspects = getAspects(transits).map(a =>
    `Transit ${a.transit} ${a.aspect} ${a.natal} (orb ${a.orb.toFixed(1)}°)`
  ).join("\n");
  return `DATE: ${date.toDateString()}\n\nTRANSIT POSITIONS:\n${positions}\n\nACTIVE ASPECTS TO NATAL CHART:\n${aspects}`;
}

// ─── PROMPTS ──────────────────────────────────────────────────────────────────
const NATAL_DESC = `NATAL CHART — Astro.com verified, Placidus, Cuddalore India, July 23 1969 9:30 PM:
Ascendant: Pisces 19° | MC: Sagittarius 21°
Moon: Scorpio 15° (house 8) | Sun: Leo 0° (house 6) | Mercury: Leo 1° (house 6)
Venus: Gemini 18° (house 4) | Mars: Sagittarius 3° (house 9, near MC)
Jupiter: Libra 1° (house 8) | Saturn: Taurus 8° Rx (house 3)
Uranus: Libra 0° (house 8) | Neptune: Sagittarius 25° (house 10, conjunct MC)
Pluto: Virgo 23° (house 7) | True Node: Pisces 22° (house 1) | Chiron: Aries 6° (house 2)`;

const SYSTEM_PROMPT = `You are an experienced astrologer — direct, plain-spoken, 25 years of practice. You know this person's natal chart and today's transits. That is the entirety of what you know about them.

Rules:
- No sign names, degree numbers, or house numbers in the reading text
- Second person ("you"), present tense
- Describe what the transit is doing energetically — not what it implies about the person's specific life circumstances
- Do not infer biography from house meanings. House 2 means resources and self-sufficiency — say that, not "financial vulnerability" or "money anxiety"
- 3–4 short paragraphs. End with one plain, specific observation for today.
- Name difficulty plainly when it's there. Don't soften it.
- No life-coach register. No affirmations. No telling the person what they deserve or need to hear.
- Never use: "it's real," "don't talk yourself out of it," "that clarity is waiting," "you've done good work," "not random noise," "the transit speaking," "a wound or sensitivity," "this isn't subtle"
- If today is genuinely quiet astrologically, say so.
- End with a single plain sentence of advice for the day — something specific and actionable that follows from what's been said. Not a motivational close. Just one useful thing to do or keep in mind.

TONE EXAMPLE — this is what plain sounds like:
Bad: "A wound or sensitivity that lives in the domain of self-sufficiency is under direct pressure today. That convergence isn't random noise."
Good: "There's pressure today on the part of your chart that governs resources and self-reliance. Three things are hitting the same point at once, which is unusual. It's worth paying attention to whatever comes up in that area rather than pushing through it."

Bad: "The expansiveness hitting your Sun and Mercury sits in tension with this erosion."
Good: "Your thinking feels bigger than usual today — ideas are coming easily and you feel more confident than yesterday. That's real, but it may be running slightly ahead of what you've actually resolved. Don't make permanent decisions based on today's sense of certainty."

${NATAL_DESC}`;

const TOPIC_PROMPTS = {
  general: "Based on today's transits and how they hit this chart, give a reading for the overall energy of the day. What's active, what's being asked, what should this person pay attention to today specifically.",
  love:    "Based on today's transits hitting this chart, read the energy around love, intimacy, and connection today specifically.",
  career:  "Based on today's transits hitting this chart, read the energy around work, purpose, and ambition today specifically.",
  body:    "Based on today's transits hitting this chart, read the energy around the physical body, health, and wellbeing today specifically.",
  spirit:  "Based on today's transits hitting this chart, read the energy around inner life, intuition, and spiritual direction today specifically.",
};

const TOPICS = [
  { id:"general", label:"Today",            icon:"✦" },
  { id:"love",    label:"Love",             icon:"♀" },
  { id:"career",  label:"Work & Purpose",   icon:"♂" },
  { id:"body",    label:"Body & Health",    icon:"◯" },
  { id:"spirit",  label:"Inner Life",       icon:"☽" },
];

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const now = new Date();
  const transits = calcPlanets(now);
  const transitText = buildTransitText(transits, now);
  const dateStr = now.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  const [activeTopic, setActiveTopic]  = useState("general");
  const [readings, setReadings]        = useState({});
  const [loading, setLoading]          = useState(false);
  const [error, setError]              = useState(null);
  const [loaded, setLoaded]            = useState(false);
  const [visible, setVisible]          = useState(true);
  const [panel, setPanel]              = useState(null);

  useEffect(() => { setTimeout(() => setLoaded(true), 120); doFetch("general"); }, []);

  async function doFetch(topic) {
    setLoading(true); setError(null);
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type":"application/json", "anthropic-version":"2023-06-01",
          "anthropic-dangerous-direct-browser-access":"true",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 700,
          system: SYSTEM_PROMPT + "\n\n" + transitText,
          messages: [{ role:"user", content: TOPIC_PROMPTS[topic] }],
        }),
      });
      const data = JSON.parse(await res.text());
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.find(b => b.type === "text")?.text || "";
      setReadings(p => ({ ...p, [topic]: text }));
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  function switchTopic(id) {
    setVisible(false);
    setTimeout(() => { setActiveTopic(id); setVisible(true); if (!readings[id]) doFetch(id); }, 200);
  }
  function refresh() { setReadings(p => { const n={...p}; delete n[activeTopic]; return n; }); doFetch(activeTopic); }

  const current = readings[activeTopic];
  const labels  = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Neptune","N.Node"];
  const keys2   = ["sun","moon","mercury","venus","mars","jupiter","saturn","neptune","node"];
  const liveTransits = keys2.map((k,i) => [`${labels[i]}`, `${degInSign(transits[k])}° ${signOf(transits[k])}`]);

  return (
    <div style={s.root}>
      <Petals />
      <div style={{ ...s.wrap, opacity: loaded?1:0, transition:"opacity 1.2s ease" }}>

        {/* Header */}
        <header style={s.header}>
          <div style={s.eyebrow}>Your Chart · Today</div>
          <h1 style={s.title}>The Chart</h1>
          <div style={s.subtitle}>{dateStr}</div>
          <div style={s.pills}>
            {[["☉","Leo","Sun"],["☽","Scorpio","Moon"],["↑","Pisces","Rising"]].map(([sym,sign,label]) => (
              <div key={label} style={s.pill}>
                <span style={s.pillSym}>{sym}</span>
                <span style={s.pillSign}>{sign}</span>
                <span style={s.pillLabel}>{label}</span>
              </div>
            ))}
          </div>
        </header>

        {/* Nav */}
        <nav style={s.nav}>
          {TOPICS.map(t => (
            <button key={t.id} onClick={() => switchTopic(t.id)}
              style={{ ...s.navBtn, ...(activeTopic===t.id ? s.navOn : {}) }}>
              <span style={s.navIcon}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Reading */}
        <main style={s.main}>
          <div style={{ opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(6px)",
            transition:"opacity 0.3s ease, transform 0.3s ease" }}>

            <div style={s.readingHeader}>
              <div style={s.readingTitle}>
                <span style={s.readingIcon}>{TOPICS.find(t=>t.id===activeTopic)?.icon}</span>
                <span>{TOPICS.find(t=>t.id===activeTopic)?.label}</span>
              </div>
              {current && <button onClick={refresh} style={s.refreshBtn} title="New reading">↻</button>}
            </div>

            {loading && !current && (
              <div style={s.loadWrap}>
                <div style={s.orbs}>{[0,1,2].map(i=>(
                  <div key={i} style={{ ...s.orb, animationDelay:`${i*0.22}s` }}/>
                ))}</div>
                <div style={s.loadText}>Reading the sky…</div>
              </div>
            )}

            {error && !loading && (
              <div style={s.errWrap}>
                <p style={s.errMsg}>{error}</p>
                <button onClick={()=>{setError(null);doFetch(activeTopic);}} style={s.retryBtn}>Try again</button>
              </div>
            )}

            {current && (
              <div style={s.reading}>
                {current.split("\n\n").filter(p=>p.trim()).map((p,i)=>(
                  <p key={i} style={{ ...s.para, animationDelay:`${i*0.1}s` }}>{p}</p>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer style={s.footer}>
          <div style={s.toggleRow}>
            <button style={s.toggle} onClick={()=>setPanel(panel==='sky'?null:'sky')}>
              {panel==='sky'?"Hide":"Today's"} sky
            </button>
            <span style={s.sep}>·</span>
            <button style={s.toggle} onClick={()=>setPanel(panel==='natal'?null:'natal')}>
              {panel==='natal'?"Hide":"Birth"} chart
            </button>
          </div>

          {panel==='sky' && (
            <div style={s.dataGrid}>
              {liveTransits.map(([k,v])=>(
                <div key={k} style={s.dataRow}><span style={s.dataKey}>{k}</span><span style={s.dataVal}>{v}</span></div>
              ))}
            </div>
          )}

          {panel==='natal' && (
            <div style={s.dataGrid}>
              {[["Rising","Pisces 19°"],["Moon","Scorpio 15°"],["Sun","Leo 0°"],
                ["Mercury","Leo 1°"],["Venus","Gemini 18°"],["Mars","Sagittarius 3°"],
                ["Jupiter","Libra 1°"],["Saturn","Taurus 8° Rx"],["Uranus","Libra 0°"],
                ["Neptune","Sagittarius 25°"],["Pluto","Virgo 23°"],["N.Node","Pisces 22°"],
                ["Chiron","Aries 6° Rx"],["MC","Sagittarius 21°"]
              ].map(([k,v])=>(
                <div key={k} style={s.dataRow}><span style={s.dataKey}>{k}</span><span style={s.dataVal}>{v}</span></div>
              ))}
            </div>
          )}

          <div style={s.footnote}>Cuddalore, India · 9:30 PM · July 23, 1969</div>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Cinzel:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background: #fdf6f0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg) scale(1)}
          33%{transform:translateY(-18px) rotate(8deg) scale(1.05)}
          66%{transform:translateY(-8px) rotate(-5deg) scale(0.97)} }
        @keyframes pulse { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }
        @keyframes shimmer { 0%,100%{opacity:.6} 50%{opacity:1} }
      `}</style>
    </div>
  );
}

function Petals() {
  const petals = [
    { size:340, x:-80, y:-60,  color:"rgba(255,182,193,0.18)", dur:18, delay:0 },
    { size:280, x:"60%", y:-40, color:"rgba(219,112,147,0.10)", dur:22, delay:3 },
    { size:200, x:"75%", y:"55%", color:"rgba(255,105,180,0.08)", dur:16, delay:1 },
    { size:320, x:-40, y:"60%", color:"rgba(255,182,193,0.12)", dur:20, delay:5 },
    { size:160, x:"40%", y:"80%", color:"rgba(219,112,147,0.07)", dur:25, delay:2 },
  ];
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      {petals.map((p, i) => (
        <div key={i} style={{
          position:"absolute", left:p.x, top:p.y,
          width:p.size, height:p.size, borderRadius:"50%",
          background:`radial-gradient(circle, ${p.color} 0%, transparent 70%)`,
          animation:`float ${p.dur}s ${p.delay}s infinite ease-in-out`,
        }}/>
      ))}
      {/* Fine grain texture */}
      <div style={{ position:"absolute", inset:0, opacity:0.4,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")` }}/>
    </div>
  );
}

const s = {
  root: { minHeight:"100vh", background:"linear-gradient(145deg, #fdf8f5 0%, #fceef0 40%, #fdf4f8 70%, #faf0f4 100%)",
    fontFamily:"'Cormorant Garamond',Georgia,serif", position:"relative", color:"#1e1020" },
  wrap: { position:"relative", zIndex:2, maxWidth:620, margin:"0 auto", padding:"48px 24px 64px" },

  header: { textAlign:"center", marginBottom:44 },
  eyebrow: { fontFamily:"'Cinzel',serif", fontSize:9, letterSpacing:"0.38em", color:"#a03860",
    textTransform:"uppercase", marginBottom:16, opacity:0.9 },
  title: { fontFamily:"'Cinzel',serif", fontSize:"clamp(42px,8vw,76px)", fontWeight:400,
    letterSpacing:"0.04em", lineHeight:1,
    background:"linear-gradient(135deg, #a03860 0%, #c4607a 40%, #b03868 70%, #a03860 100%)",
    WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:10 },
  subtitle: { fontSize:13, color:"#b07090", letterSpacing:".12em", fontStyle:"italic", marginBottom:28 },
  pills: { display:"flex", justifyContent:"center", gap:12, flexWrap:"wrap" },
  pill: { display:"flex", flexDirection:"column", alignItems:"center", padding:"10px 18px",
    background:"rgba(255,255,255,0.65)", borderRadius:12,
    border:"1px solid rgba(192,96,128,0.18)",
    boxShadow:"0 2px 12px rgba(192,96,128,0.08)" },
  pillSym:   { fontSize:18, color:"#a03860", lineHeight:1, marginBottom:2 },
  pillSign:  { fontFamily:"'Cinzel',serif", fontSize:11, color:"#a03860", letterSpacing:".08em" },
  pillLabel: { fontSize:9, color:"#a06880", letterSpacing:".16em", textTransform:"uppercase", marginTop:2 },

  nav: { display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center", marginBottom:44 },
  navBtn: { display:"flex", alignItems:"center", gap:6, padding:"8px 14px",
    background:"rgba(255,255,255,0.5)", border:"1px solid rgba(160,56,96,0.2)", borderRadius:24,
    color:"#a03860", fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:14,
    cursor:"pointer", transition:"all .2s ease", letterSpacing:".04em",
    boxShadow:"0 1px 6px rgba(160,56,96,0.08)" },
  navOn: { background:"linear-gradient(135deg, rgba(160,56,96,0.15), rgba(196,96,122,0.2))",
    border:"1px solid rgba(160,56,96,0.4)", color:"#8a2848",
    boxShadow:"0 2px 12px rgba(160,56,96,0.14)" },
  navIcon: { fontSize:15 },

  main: { minHeight:300, marginBottom:44 },
  readingHeader: { display:"flex", alignItems:"center", justifyContent:"space-between",
    marginBottom:26, paddingBottom:16,
    borderBottom:"1px solid rgba(192,96,128,0.15)" },
  readingTitle: { display:"flex", alignItems:"center", gap:10,
    fontFamily:"'Cinzel',serif", fontSize:10, letterSpacing:".22em",
    color:"#a03860", textTransform:"uppercase" },
  readingIcon: { fontSize:16, color:"#a03860" },
  refreshBtn: { background:"transparent", border:"none", color:"#c090a8", fontSize:18,
    cursor:"pointer", opacity:0.6, padding:"0 4px", lineHeight:1,
    transition:"opacity .2s" },

  loadWrap: { display:"flex", flexDirection:"column", alignItems:"center", paddingTop:70 },
  orbs: { display:"flex", gap:10, marginBottom:16 },
  orb: { width:8, height:8, borderRadius:"50%",
    background:"linear-gradient(135deg, #d4608a, #e8a0b0)",
    animation:"pulse 1.4s infinite",
    boxShadow:"0 0 8px rgba(212,96,138,0.4)" },
  loadText: { fontSize:13, color:"#c090a8", fontStyle:"italic", letterSpacing:".12em" },

  errWrap: { paddingTop:48, textAlign:"center" },
  errMsg: { color:"#c08080", fontSize:14, marginBottom:16, fontStyle:"italic" },
  retryBtn: { background:"rgba(255,255,255,0.7)", border:"1px solid rgba(192,96,128,0.3)",
    color:"#c06080", fontFamily:"'Cormorant Garamond',Georgia,serif",
    fontSize:14, padding:"8px 20px", cursor:"pointer", borderRadius:20 },

  reading: { display:"flex", flexDirection:"column", gap:20 },
  para: { fontSize:"clamp(16.5px,2.2vw,19px)", lineHeight:1.88, color:"#2a1820",
    fontWeight:400, animation:"fadeUp .5s ease both", textAlign:"left" },

  footer: { borderTop:"1px solid rgba(192,96,128,0.12)", paddingTop:24 },
  toggleRow: { display:"flex", alignItems:"center", gap:10, marginBottom:16 },
  toggle: { background:"transparent", border:"none", color:"#a03860",
    fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:13, cursor:"pointer",
    letterSpacing:".08em", fontStyle:"italic",
    textDecoration:"underline", textDecorationColor:"rgba(160,56,96,0.35)", padding:0 },
  sep: { color:"#dbb0c0", fontSize:14 },
  dataGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",
    gap:"6px 14px", marginBottom:20, padding:"16px",
    background:"rgba(255,255,255,0.55)", borderRadius:10,
    border:"1px solid rgba(192,96,128,0.12)",
    boxShadow:"0 2px 12px rgba(192,96,128,0.05)" },
  dataRow: { display:"flex", gap:8, fontSize:12 },
  dataKey: { color:"#a06888", fontStyle:"italic", minWidth:70 },
  dataVal: { color:"#5a3055" },
  footnote: { fontSize:11, color:"#b888a0", letterSpacing:".12em", textAlign:"center", fontStyle:"italic" },
};
