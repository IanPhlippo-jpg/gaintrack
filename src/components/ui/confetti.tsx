/**
 * Confetti (21st.dev / motion.dev) - deeltjesexplosie, omgebouwd naar een globale laag met useConfetti().
 */
import * as React from "react";
import { animate } from "motion/react";

const colors = ["#26ccff", "#a25afd", "#ff5e7e", "#88ff5a", "#fcff42", "#ffa62d", "#ff36ff"];
const shapes = ["circle", "rect", "rect", "strip", "strip"] as const;
const keyframeCount = 40;
const popWindow = 0.08;

type ParticleShape = (typeof shapes)[number];
type Particle = { keyframes: { transform: string[]; opacity: number[] }; duration: number; size: number; color: string; shape: ParticleShape };
type Burst = { id: number; x: number; y: number; particles: Particle[] };

function buildKeyframes({ angle, startVelocity, decay, gravity, drift, wobbleSpeed, wobbleOffset, size, ticks, tiltRotations, rotation }: {
  angle: number; startVelocity: number; decay: number; gravity: number; drift: number; wobbleSpeed: number; wobbleOffset: number; size: number; ticks: number; tiltRotations: number; rotation: number;
}) {
  const transforms: string[] = [];
  const opacities: number[] = [];
  let velocity = startVelocity, x = 0, y = 0, wobble = wobbleOffset, tick = 0;
  for (let i = 0; i <= keyframeCount; i++) {
    const t = i / keyframeCount;
    if (i > 0) {
      const targetTick = Math.round((i * ticks) / keyframeCount);
      while (tick < targetTick) {
        x += Math.cos(angle) * velocity + drift;
        y += Math.sin(angle) * velocity + gravity * 3;
        velocity *= decay;
        wobble += wobbleSpeed;
        tick++;
      }
    }
    const translateX = i === 0 ? 0 : x + Math.cos(wobble) * 15 * size;
    let scale: number;
    if (t < popWindow * 0.6) scale = (t / (popWindow * 0.6)) * 1.15;
    else if (t < popWindow) scale = 1.15 - ((t - popWindow * 0.6) / (popWindow * 0.4)) * 0.15;
    else scale = 1;
    const tilt = tiltRotations * 360 * t;
    let opacity: number;
    if (t <= 0.5) opacity = 1;
    else if (t <= 0.8) opacity = 1 - ((t - 0.5) / 0.3) * 0.5;
    else opacity = 0.5 - ((t - 0.8) / 0.2) * 0.5;
    transforms.push(`translate(${translateX}px, ${y}px) scale(${scale}) rotateY(${tilt}deg) rotate(${rotation}deg)`);
    opacities.push(opacity);
  }
  return { transform: transforms, opacity: opacities };
}

function ParticleDot({ particle }: { particle: Particle }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { keyframes, duration, size, color, shape } = particle;
  const width = shape === "strip" ? size * 0.3 : shape === "rect" ? size * 0.7 : size;
  const height = shape === "strip" ? size * 2 : size;
  const radius = shape === "circle" ? "50%" : shape === "strip" ? size * 0.12 : 2;
  React.useEffect(() => {
    if (!ref.current) return;
    const playback = animate(ref.current, keyframes, { duration, ease: "linear" });
    return () => playback.cancel();
  }, [keyframes, duration]);
  return <div ref={ref} style={{ position: "absolute", width, height, borderRadius: radius, backgroundColor: color, willChange: "transform, opacity", pointerEvents: "none" }} />;
}

type FireOptions = { x?: number; y?: number; particleCount?: number; spread?: number; startVelocity?: number };
const ConfettiContext = React.createContext<(opts?: FireOptions) => void>(() => {});

export function ConfettiProvider({ children }: { children: React.ReactNode }) {
  const [bursts, setBursts] = React.useState<Burst[]>([]);
  const nextId = React.useRef(0);

  const fire = React.useCallback(({ x, y, particleCount = 90, spread = 110, startVelocity = 28 }: FireOptions = {}) => {
    const id = nextId.current++;
    const duration = 2.6;
    const ticks = Math.round(duration * 60);
    const particles = Array.from({ length: particleCount }, () => {
      const spreadRad = spread * (Math.PI / 180);
      const angle = -Math.PI / 2 + (0.5 * spreadRad - Math.random() * spreadRad);
      const velocity = startVelocity * 0.5 + Math.random() * startVelocity;
      return {
        keyframes: buildKeyframes({ angle, startVelocity: velocity, decay: 0.91, gravity: 1, drift: 0, wobbleSpeed: Math.min(0.11, Math.random() * 0.1 + 0.05), wobbleOffset: Math.random() * 10, size: 1, ticks, tiltRotations: 2 + Math.random() * 4, rotation: Math.random() * 360 }),
        duration,
        size: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      };
    });
    setBursts((c) => [...c, { id, x: x ?? window.innerWidth / 2, y: y ?? window.innerHeight * 0.45, particles }]);
    setTimeout(() => setBursts((c) => c.filter((b) => b.id !== id)), (duration + 0.5) * 1000);
  }, []);

  return (
    <ConfettiContext.Provider value={fire}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
        {bursts.map((burst) => (
          <div key={burst.id} style={{ position: "absolute", left: burst.x, top: burst.y }}>
            {burst.particles.map((p, i) => (
              <ParticleDot key={i} particle={p} />
            ))}
          </div>
        ))}
      </div>
    </ConfettiContext.Provider>
  );
}

export const useConfetti = () => React.useContext(ConfettiContext);
