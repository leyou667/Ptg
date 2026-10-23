import type { CSSProperties } from "react";

/**
 * Quatre scènes en SVG pur, style emoji : formes très arrondies, traits épais et doux, couleurs plates
 * (blanc, cyan, bleu nuit : jetons de la palette), étincelles à 4 branches comme le logo.
 * Les animations sont en CSS (voir .ill dans globals.css) : l'état final est l'état de base, donc la
 * version statique (reduced-motion) montre la scène complète.
 */

const STAR = "M12 0c.9 6.6 4.5 10.9 12 12-7.5 1.1-11.1 5.4-12 12-.9-6.6-4.5-10.9-12-12C7.5 10.9 11.1 6.6 12 0Z";

type Sp = { x: number; y: number; s?: number; fill?: string; delay?: string; burst?: { tx: number; ty: number; d: string } };

/** Étincelle : le <g> extérieur place, la <path> intérieure scintille. */
function Sparkle({ x, y, s = 1, fill = "fill-primary", delay = "0s", burst }: Sp) {
  const star = (
    <g transform={`translate(${x - 12 * s} ${y - 12 * s}) scale(${s})`}>
      <path d={STAR} className={`twinkle ${fill}`} style={{ animationDelay: delay }} />
    </g>
  );
  if (!burst) return star;
  return (
    <g className="a-burst" style={{ "--tx": `${burst.tx}px`, "--ty": `${burst.ty}px`, "--d": burst.d } as CSSProperties}>
      {star}
    </g>
  );
}

const Eyes = ({ x1, x2, y, r = 4.5 }: { x1: number; x2: number; y: number; r?: number }) => (
  <>
    <circle cx={x1} cy={y} r={r} className="blink fill-glow-deep" />
    <circle cx={x2} cy={y} r={r} className="blink fill-glow-deep" />
  </>
);
const Smile = ({ d, w = 4.5 }: { d: string; w?: number }) => <path d={d} fill="none" strokeWidth={w} strokeLinecap="round" className="stroke-glow-deep" />;
const Check = ({ d, w = 5, cls = "stroke-glow-deep" }: { d: string; w?: number; cls?: string }) => (
  <path d={d} fill="none" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" className={cls} />
);

const svgProps = { viewBox: "0 0 200 200", "aria-hidden": true, focusable: "false", className: "h-full w-full overflow-visible" } as const;

/** 1. Une pièce arrondie en 3D, deux flèches (largeur, hauteur) qui se dessinent, une épingle qui tombe et rebondit. */
export function SceneRoom() {
  return (
    <svg {...svgProps}>
      <g className="float">
        <g strokeWidth="10" strokeLinejoin="round">
          <path d="M40 125 L100 95 V45 L40 75Z" className="fill-primary stroke-primary" />
          <path d="M100 95 L160 125 V75 L100 45Z" className="fill-glow-deep stroke-glow-deep" />
          <path d="M40 125 L100 95 L160 125 L100 155Z" className="fill-foreground stroke-foreground" />
        </g>
        <g fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary">
          <path pathLength="1" className="a-draw" style={{ "--d": "0.4s" } as CSSProperties} d="M32 141 L92 171 M87 163.5 L92 171 L83 171.5 M37 148.5 L32 141 L41 140.5" />
          <path pathLength="1" className="a-draw" style={{ "--d": "0.8s" } as CSSProperties} d="M24 125 V75 M19 84 L24 75 L29 84 M19 116 L24 125 L29 116" />
        </g>
        <ellipse cx="100" cy="128" rx="13" ry="4.5" className="fill-glow-deep" opacity="0.55" />
        <g transform="translate(100 128)">
          <g className="a-drop" style={{ "--d": "1.1s" } as CSSProperties}>
            <path d="M0 0 C-5 -10 -15 -17 -15 -29 a15 15 0 0 1 30 0 C15 -17 5 -10 0 0Z" className="fill-primary stroke-primary" strokeWidth="4" strokeLinejoin="round" />
            <Eyes x1={-5.5} x2={5.5} y={-31} r={2.6} />
            <Smile d="M-4.5 -24 Q0 -19.5 4.5 -24" w={2.6} />
          </g>
        </g>
      </g>
      <Sparkle x={166} y={48} s={0.9} />
      <Sparkle x={26} y={36} s={0.6} fill="fill-foreground" delay="0.8s" />
      <Sparkle x={176} y={150} s={0.7} fill="fill-foreground" delay="1.6s" />
    </svg>
  );
}

/** 2. Trois cartes de formules : celle du milieu se soulève avec un rebond, se coche, étincelles autour. */
export function SceneCards() {
  const bars = (x: number) => (
    <>
      <rect x={x + 10} y="86" width="32" height="8" rx="4" className="fill-glow-deep" opacity="0.35" />
      <rect x={x + 10} y="102" width="22" height="8" rx="4" className="fill-glow-deep" opacity="0.25" />
      <rect x={x + 10} y="132" width="32" height="10" rx="5" className="fill-primary" />
    </>
  );
  return (
    <svg {...svgProps}>
      <g className="float">
        <rect x="14" y="70" width="52" height="86" rx="16" className="fill-foreground" opacity="0.92" />
        {bars(14)}
        <rect x="134" y="70" width="52" height="86" rx="16" className="fill-foreground" opacity="0.92" />
        {bars(134)}
        <g className="a-lift" style={{ "--d": "0.5s" } as CSSProperties}>
          <rect x="68" y="52" width="64" height="106" rx="20" className="fill-primary" />
          <Eyes x1={87} x2={113} y={86} />
          <Smile d="M88 100 Q100 112 112 100" />
          <rect x="82" y="124" width="36" height="9" rx="4.5" className="fill-foreground" opacity="0.85" />
          <rect x="88" y="140" width="24" height="8" rx="4" className="fill-foreground" opacity="0.55" />
          <g transform="translate(132 56)">
            <g className="a-pop" style={{ "--d": "1s" } as CSSProperties}>
              <circle r="16" className="fill-foreground" />
              <Check d="M-7 0 L-2 6 L8 -6" w={5.5} />
            </g>
          </g>
        </g>
      </g>
      <g transform="translate(100 96)">
        <Sparkle x={0} y={0} s={0.8} burst={{ tx: -72, ty: -44, d: "1.1s" }} />
        <Sparkle x={0} y={0} s={0.7} fill="fill-foreground" delay="0.5s" burst={{ tx: -6, ty: -88, d: "1.2s" }} />
        <Sparkle x={0} y={0} s={1} delay="0.3s" burst={{ tx: 76, ty: -66, d: "1.15s" }} />
        <Sparkle x={0} y={0} s={0.6} fill="fill-foreground" delay="1s" burst={{ tx: 88, ty: 8, d: "1.3s" }} />
        <Sparkle x={0} y={0} s={0.65} delay="1.4s" burst={{ tx: -86, ty: 24, d: "1.25s" }} />
      </g>
    </svg>
  );
}

/** 3. Une enveloppe qui s'ouvre, un devis qui en sort avec un petit saut, un tampon coche qui claque. */
export function SceneQuote() {
  return (
    <svg {...svgProps}>
      <g className="float">
        <rect x="26" y="84" width="148" height="84" rx="18" className="fill-glow-deep" />
        <path d="M30 100 L100 56 L170 100Z" strokeWidth="10" strokeLinejoin="round" className="a-flap-open fill-primary stroke-primary" />
        <g className="a-rise" style={{ "--d": "0.9s" } as CSSProperties}>
          <rect x="52" y="60" width="96" height="94" rx="14" className="fill-foreground" />
          <rect x="66" y="75" width="46" height="8" rx="4" className="fill-glow-deep" opacity="0.5" />
          <rect x="66" y="92" width="68" height="8" rx="4" className="fill-glow-deep" opacity="0.3" />
          <rect x="66" y="109" width="36" height="8" rx="4" className="fill-glow-deep" opacity="0.3" />
          <g transform="translate(122 128)">
            <g className="a-slam" style={{ "--d": "1.7s" } as CSSProperties}>
              <circle r="19" className="fill-primary" />
              <Check d="M-8 0 L-2.5 6.5 L9 -7" w={5.5} />
            </g>
          </g>
        </g>
        <path d="M26 104 L100 146 L174 104 V150 a18 18 0 0 1 -18 18 H44 a18 18 0 0 1 -18 -18Z" strokeWidth="6" strokeLinejoin="round" className="fill-primary stroke-primary" />
        <g className="a-pop" style={{ "--d": "0.5s" } as CSSProperties}>
          <Eyes x1={86} x2={114} y={148} r={4} />
          <Smile d="M92 156 Q100 163 108 156" w={4} />
        </g>
        <path d="M26 96 Q26 86 36 86 H164 Q174 86 174 96 L100 140Z" strokeWidth="6" strokeLinejoin="round" className="a-flap-closed fill-foreground stroke-foreground" />
      </g>
      <Sparkle x={170} y={46} s={0.9} />
      <Sparkle x={30} y={52} s={0.6} fill="fill-foreground" delay="1s" />
    </svg>
  );
}

/** 4. Un calendrier dont les jours fixes se cochent un par un, un seau qui fait un petit rebond joyeux. */
export function SceneCalendar() {
  const cols = [34, 60, 86, 112];
  const rows = [96, 120, 144];
  const ticks: [number, number, string][] = [
    [60, 96, "0.7s"],
    [112, 120, "1.1s"],
    [60, 144, "1.5s"],
  ];
  return (
    <svg {...svgProps}>
      <g className="float">
        <rect x="14" y="40" width="124" height="122" rx="22" className="fill-foreground" />
        <path d="M14 62 a22 22 0 0 1 22 -22 H116 a22 22 0 0 1 22 22 V76 H14Z" className="fill-primary" />
        <rect x="44" y="28" width="11" height="26" rx="5.5" className="fill-glow-deep" />
        <rect x="97" y="28" width="11" height="26" rx="5.5" className="fill-glow-deep" />
        {rows.flatMap((y) => cols.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="6" className="fill-glow-deep" opacity="0.22" />))}
        {ticks.map(([x, y, d]) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
            <g className="a-pop" style={{ "--d": d } as CSSProperties}>
              <circle r="11.5" className="fill-primary" />
              <Check d="M-5 0 L-1.5 4 L5.5 -4.5" w={3.8} />
            </g>
          </g>
        ))}
      </g>
      <g transform="translate(156 152)">
        <g className="a-joy" style={{ "--d": "1.9s" } as CSSProperties}>
          <g className="float2">
            <path d="M-22 -26 H22 L17 20 a8 8 0 0 1 -8 7 H-9 a8 8 0 0 1 -8 -7Z" strokeWidth="6" strokeLinejoin="round" className="fill-primary stroke-primary" />
            <rect x="-28" y="-36" width="56" height="13" rx="6.5" className="fill-foreground" />
            <path d="M-21 -36 Q0 -66 21 -36" fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-foreground" />
            <Eyes x1={-8} x2={8} y={-6} r={3.6} />
            <Smile d="M-6 4 Q0 10 6 4" w={3.6} />
          </g>
        </g>
      </g>
      <Sparkle x={176} y={96} s={0.8} delay="0.4s" />
      <Sparkle x={26} y={186} s={0.6} fill="fill-foreground" delay="1.2s" />
      <Sparkle x={134} y={178} s={0.5} delay="2s" />
    </svg>
  );
}
