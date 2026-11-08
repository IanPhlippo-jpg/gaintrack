/**
 * Het diertje van GainTrack: een eigen ontwerp (rond kopje, buikje, oortjes) in SVG.
 * Humeur bepaalt ogen en mond, het stadium de grootte, en accessoires worden per plek (hoofd, ogen, nek, hand) getekend.
 */
import { motion, useReducedMotion } from "motion/react";
import { PET_BACKGROUNDS, PET_COLORS, stageOf, type Mood, type Pet } from "@/lib/shop";
import { cn } from "@/lib/utils";

const INK = "#1A1433";
const ROOD = "#E5484D";

function Accessory({ id }: { id?: string }) {
  switch (id) {
    case "acc-pet":
      return (
        <g>
          <path d="M56 64 Q100 14 144 64 Z" fill={ROOD} />
          <path d="M100 62 Q140 58 168 66 Q160 76 136 72 Q118 70 100 70 Z" fill="#B8343A" />
          <circle cx="100" cy="30" r="4.5" fill="#B8343A" />
        </g>
      );
    case "acc-zweetband":
      return (
        <g>
          <path d="M47 70 Q100 50 153 70 L151 84 Q100 64 49 84 Z" fill="#F7F7FB" />
          <path d="M48 76 Q100 57 152 76 L152 79 Q100 60 48 79 Z" fill={ROOD} />
        </g>
      );
    case "acc-koptelefoon":
      return (
        <g>
          <path d="M48 92 Q46 30 100 30 Q154 30 152 92" stroke="#2A2A3A" strokeWidth="8" fill="none" strokeLinecap="round" />
          <rect x="36" y="78" width="20" height="32" rx="8" fill="#2A2A3A" />
          <rect x="144" y="78" width="20" height="32" rx="8" fill="#2A2A3A" />
          <rect x="41" y="84" width="10" height="20" rx="4" fill="#8B7CC7" />
          <rect x="149" y="84" width="10" height="20" rx="4" fill="#8B7CC7" />
        </g>
      );
    case "acc-kroon":
      return (
        <g>
          <path d="M68 46 L74 16 L88 34 L100 10 L112 34 L126 16 L132 46 Z" fill="#E8C462" stroke="#B8912A" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="100" cy="36" r="4" fill={ROOD} />
          <circle cx="82" cy="40" r="3" fill="#5CC8E8" />
          <circle cx="118" cy="40" r="3" fill="#5CC8E8" />
        </g>
      );
    case "acc-zonnebril":
      return (
        <g>
          <rect x="66" y="82" width="27" height="19" rx="7" fill="#101018" />
          <rect x="107" y="82" width="27" height="19" rx="7" fill="#101018" />
          <path d="M93 89 L107 89" stroke="#101018" strokeWidth="3" />
          <path d="M71 86 L78 86" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <path d="M112 86 L119 86" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </g>
      );
    case "acc-bril":
      return (
        <g fill="none" stroke="#2A2A3A" strokeWidth="3">
          <circle cx="80" cy="92" r="14" fill="#fff" fillOpacity="0.08" />
          <circle cx="120" cy="92" r="14" fill="#fff" fillOpacity="0.08" />
          <path d="M94 91 Q100 87 106 91" />
        </g>
      );
    case "acc-sjaal":
      return (
        <g>
          <path d="M56 130 Q100 148 144 130 L146 143 Q100 161 54 143 Z" fill={ROOD} />
          <path d="M116 146 L130 146 L128 174 L114 172 Z" fill="#C23B40" />
          <path d="M60 136 Q100 152 140 136" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5" strokeDasharray="4 4" />
        </g>
      );
    case "acc-ketting":
      return (
        <g>
          <path d="M64 130 Q100 158 136 130" stroke="#E8C462" strokeWidth="4" fill="none" strokeDasharray="5 2" strokeLinecap="round" />
          <circle cx="100" cy="150" r="8" fill="#E8C462" stroke="#B8912A" strokeWidth="2" />
          <circle cx="100" cy="150" r="3" fill="#B8912A" />
        </g>
      );
    case "acc-strik":
      return (
        <g>
          <path d="M100 138 L82 129 L82 147 Z" fill={ROOD} />
          <path d="M100 138 L118 129 L118 147 Z" fill={ROOD} />
          <circle cx="100" cy="138" r="5" fill="#B8343A" />
        </g>
      );
    case "acc-halter":
      return (
        <g>
          <path d="M136 164 L180 164" stroke="#77778A" strokeWidth="4" strokeLinecap="round" />
          <rect x="132" y="153" width="9" height="22" rx="2" fill="#2A2A3A" />
          <rect x="175" y="153" width="9" height="22" rx="2" fill="#2A2A3A" />
        </g>
      );
    case "acc-shakebeker":
      return (
        <g>
          <rect x="150" y="138" width="22" height="32" rx="5" fill="#F2F2F7" />
          <rect x="150" y="152" width="22" height="18" rx="4" fill="#C9A3FF" />
          <rect x="147" y="131" width="28" height="9" rx="3" fill="#8B7CC7" />
        </g>
      );
    default:
      return null;
  }
}

function Face({ mood }: { mood: Mood }) {
  const eyes =
    mood === "slaapt" ? (
      <g stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round">
        <path d="M71 94 Q80 100 89 94" />
        <path d="M111 94 Q120 100 129 94" />
      </g>
    ) : (
      <g>
        <ellipse cx="80" cy="92" rx="9" ry={mood === "blij" ? 11 : 10} fill={INK} />
        <ellipse cx="120" cy="92" rx="9" ry={mood === "blij" ? 11 : 10} fill={INK} />
        <circle cx="83" cy="88" r="3.5" fill="#fff" />
        <circle cx="123" cy="88" r="3.5" fill="#fff" />
        <circle cx="77.5" cy="96" r="1.6" fill="#fff" opacity="0.8" />
        <circle cx="117.5" cy="96" r="1.6" fill="#fff" opacity="0.8" />
        {mood === "verdrietig" && (
          <g stroke={INK} strokeWidth="3" strokeLinecap="round">
            <path d="M70 78 L88 82" />
            <path d="M130 78 L112 82" />
          </g>
        )}
      </g>
    );
  const mouth =
    mood === "blij" ? (
      <g>
        <path d="M88 109 Q100 127 112 109 Z" fill="#3A1830" />
        <path d="M94 117 Q100 124 106 117 Q100 113 94 117 Z" fill="#F27A9A" />
      </g>
    ) : mood === "oke" ? (
      <path d="M91 112 Q100 120 109 112" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
    ) : mood === "verdrietig" ? (
      <path d="M91 119 Q100 110 109 119" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
    ) : (
      <ellipse cx="100" cy="114" rx="3.5" ry="4" fill="#3A1830" />
    );
  return (
    <>
      {eyes}
      {mouth}
    </>
  );
}

export function PetAvatar({ pet, mood, className, animate = true }: { pet: Pet; mood: Mood; className?: string; animate?: boolean }) {
  const c = PET_COLORS[pet.color] ?? PET_COLORS.lila;
  const { stage } = stageOf(pet.growth);
  const reduce = useReducedMotion();
  const s = stage.scale;
  const sterk = stage.id === "volwassen";
  const bounce = !animate || reduce ? undefined : mood === "slaapt" ? { scaleY: [1, 1.03, 1] } : mood === "verdrietig" ? { y: [0, -2, 0] } : { y: [0, mood === "blij" ? -8 : -4, 0] };
  const duur = mood === "blij" ? 1.4 : mood === "slaapt" ? 3.2 : 2.4;

  return (
    <svg viewBox="0 0 200 200" className={cn("overflow-visible", className)} role="img" aria-label={`${pet.name}, ${stage.name.toLowerCase()}`}>
      <ellipse cx="100" cy="192" rx={46 * s} ry={6 * s} fill="#000" opacity="0.25" />
      <g transform={`translate(100 192) scale(${s}) translate(-100 -192)`}>
        <motion.g animate={bounce} transition={{ duration: duur, repeat: Infinity, ease: "easeInOut" }} style={{ originX: "100px", originY: "190px" }}>
          {/* voetjes */}
          <ellipse cx="78" cy="182" rx="15" ry="8" fill={c.dark} opacity="0.85" />
          <ellipse cx="122" cy="182" rx="15" ry="8" fill={c.dark} opacity="0.85" />
          {/* armpjes (volwassen: met spierballetjes) */}
          <ellipse cx="54" cy="150" rx="10" ry="17" fill={c.body} transform="rotate(22 54 150)" />
          <ellipse cx="146" cy="150" rx="10" ry="17" fill={c.body} transform="rotate(-22 146 150)" />
          {sterk && (
            <>
              <circle cx="49" cy="139" r="9" fill={c.body} stroke={c.dark} strokeOpacity="0.25" strokeWidth="1.5" />
              <circle cx="151" cy="139" r="9" fill={c.body} stroke={c.dark} strokeOpacity="0.25" strokeWidth="1.5" />
            </>
          )}
          {/* lijf en buikje */}
          <ellipse cx="100" cy="152" rx="48" ry="36" fill={c.body} />
          <ellipse cx="100" cy="158" rx="30" ry="22" fill={c.belly} />
          {/* oortjes */}
          <ellipse cx="64" cy="48" rx="13" ry="23" fill={c.body} transform="rotate(-24 64 48)" />
          <ellipse cx="136" cy="48" rx="13" ry="23" fill={c.body} transform="rotate(24 136 48)" />
          <ellipse cx="65" cy="50" rx="6" ry="13" fill={c.cheek} opacity="0.7" transform="rotate(-24 65 50)" />
          <ellipse cx="135" cy="50" rx="6" ry="13" fill={c.cheek} opacity="0.7" transform="rotate(24 135 50)" />
          {/* kopje */}
          <circle cx="100" cy="90" r="54" fill={c.body} />
          <ellipse cx="80" cy="60" rx="15" ry="8" fill="#fff" opacity="0.22" transform="rotate(-18 80 60)" />
          <ellipse cx="65" cy="108" rx="9" ry="5.5" fill={c.cheek} opacity="0.8" />
          <ellipse cx="135" cy="108" rx="9" ry="5.5" fill={c.cheek} opacity="0.8" />
          <Face mood={mood} />
          <Accessory id={pet.equipped.nek} />
          <Accessory id={pet.equipped.ogen} />
          <Accessory id={pet.equipped.hoofd} />
          <Accessory id={pet.equipped.hand} />
        </motion.g>
      </g>
      {mood === "slaapt" && (
        <g fill="#fff" opacity="0.85" fontWeight="800" fontFamily="system-ui, sans-serif">
          <text x="150" y="58" fontSize="18">z</text>
          <text x="164" y="40" fontSize="13">z</text>
        </g>
      )}
    </svg>
  );
}

/** Het diertje op zijn achtergrond (kamer, gym, strand ...). */
export function PetScene({ pet, mood, className, children }: { pet: Pet; mood: Mood; className?: string; children?: React.ReactNode }) {
  const bgId = pet.background ?? "standaard";
  const bg = PET_BACKGROUNDS[bgId] ?? PET_BACKGROUNDS.standaard;
  return (
    <div className={cn("relative overflow-hidden rounded-3xl", className)} style={{ background: `linear-gradient(180deg, ${bg.from}, ${bg.to})` }}>
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMax slice" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
        {bgId === "standaard" && (
          <g>
            <rect x="0" y="150" width="320" height="50" fill="#000" opacity="0.18" />
            <rect x="34" y="40" width="54" height="44" rx="6" fill="#fff" opacity="0.06" />
            <path d="M61 40 L61 84 M34 62 L88 62" stroke="#fff" opacity="0.08" strokeWidth="2" />
          </g>
        )}
        {bgId === "gym" && (
          <g opacity="0.35">
            <rect x="0" y="152" width="320" height="48" fill="#000" opacity="0.4" />
            <path d="M24 70 L84 70 M240 60 L300 60" stroke="#C9A27A" strokeWidth="4" />
            <rect x="20" y="58" width="8" height="24" rx="2" fill="#C9A27A" />
            <rect x="80" y="58" width="8" height="24" rx="2" fill="#C9A27A" />
            <rect x="236" y="48" width="8" height="24" rx="2" fill="#C9A27A" />
            <rect x="296" y="48" width="8" height="24" rx="2" fill="#C9A27A" />
          </g>
        )}
        {bgId === "strand" && (
          <g>
            <circle cx="262" cy="44" r="20" fill="#FFE07A" opacity="0.9" />
            <path d="M0 150 Q80 138 160 150 T320 150 L320 200 L0 200 Z" fill="#F2D59B" />
            <path d="M0 146 Q80 134 160 146 T320 146" stroke="#fff" strokeWidth="3" fill="none" opacity="0.6" />
          </g>
        )}
        {bgId === "bos" && (
          <g opacity="0.55">
            <path d="M30 150 L52 80 L74 150 Z M250 150 L276 70 L302 150 Z M200 150 L216 104 L232 150 Z" fill="#1E3F2D" />
            <rect x="0" y="150" width="320" height="50" fill="#0E2016" />
          </g>
        )}
        {bgId === "ruimte" && (
          <g fill="#fff">
            {[[30, 30], [70, 80], [120, 24], [250, 40], [290, 90], [210, 70], [40, 120], [280, 140], [160, 50]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1.1} opacity="0.8" />
            ))}
            <circle cx="268" cy="150" r="26" fill="#7B5CFF" opacity="0.5" />
          </g>
        )}
      </svg>
      <div className="relative">{children ?? <PetAvatar pet={pet} mood={mood} className="mx-auto block h-44 w-44" />}</div>
    </div>
  );
}
