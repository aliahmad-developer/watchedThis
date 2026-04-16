"use client";
import { useEffect, useState } from "react";

const DICE_FACES: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [25, 25],
    [75, 75],
  ],
  3: [
    [25, 25],
    [50, 50],
    [75, 75],
  ],
  4: [
    [25, 25],
    [75, 25],
    [25, 75],
    [75, 75],
  ],
  5: [
    [25, 25],
    [75, 25],
    [50, 50],
    [25, 75],
    [75, 75],
  ],
  6: [
    [25, 25],
    [75, 25],
    [25, 50],
    [75, 50],
    [25, 75],
    [75, 75],
  ],
};

function DiceFace({ value, size = 96 }: { value: number; size?: number }) {
  const dots = DICE_FACES[value] ?? DICE_FACES[1];
  const dotR = size * 0.09;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: "block" }}
    >
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="18"
        fill="var(--color-card, #1e1e1e)"
        stroke="var(--color-border, rgba(255,255,255,0.12))"
        strokeWidth="2"
      />
      {dots.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={dotR}
          fill="var(--color-accent, currentColor)"
        />
      ))}
    </svg>
  );
}

function RollingDice() {
  const [face, setFace] = useState(1);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    let fast: ReturnType<typeof setInterval>;
    let slow: ReturnType<typeof setInterval>;
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;

    const startRoll = () => {
      setRolling(true);
      fast = setInterval(() => setFace(Math.ceil(Math.random() * 6)), 160);
      t1 = setTimeout(() => {
        clearInterval(fast);
        slow = setInterval(() => setFace(Math.ceil(Math.random() * 6)), 400);
      }, 900);
      t2 = setTimeout(() => {
        clearInterval(slow);
        setFace(Math.ceil(Math.random() * 6));
        setRolling(false);
      }, 1800);
    };

    startRoll();
    const loop = setInterval(startRoll, 3200);

    return () => {
      clearInterval(fast);
      clearInterval(slow);
      clearInterval(loop);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      style={{
        display: "inline-block",
        animation: rolling
          ? "diceRock 0.35s ease-in-out infinite alternate"
          : "none",
        filter: rolling
          ? "drop-shadow(0 8px 24px var(--color-accent-glow, rgba(0,0,0,0.3)))"
          : "drop-shadow(0 4px 12px rgba(0,0,0,0.4))",
        transition: "filter 0.4s ease",
      }}
    >
      <DiceFace value={face} size={96} />
    </div>
  );
}

const MESSAGES = [
  "Rolling the dice…",
  "Shuffling the deck…",
  "Picking something great…",
  "Spinning the wheel of fate…",
  "Consulting the film gods…",
];

const FINAL_MESSAGE = "Almost there…";

function CyclingMessage({ finishing }: { finishing: boolean }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    if (!finishing) return;
    setVisible(false);
    const t = setTimeout(() => {
      setShowFinal(true);
      setVisible(true);
    }, 300);
    return () => clearTimeout(t);
  }, [finishing]);

  useEffect(() => {
    if (finishing) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, [finishing]);

  return (
    <p
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        color: "var(--color-secondary-text, rgba(128,128,128,0.8))",
        fontSize: "0.95rem",
        letterSpacing: "0.02em",
        minHeight: "1.5em",
        textAlign: "center",
      }}
    >
      {showFinal ? FINAL_MESSAGE : MESSAGES[index]}
    </p>
  );
}

export default function DiceRoll({ finishing = false }: { finishing?: boolean }) {
  return (
    <>
      <style>{`
        :root {
          --color-card:           var(--color-light-card, #e9ecef);
          --color-border:         var(--color-light-border, #dee2e6);
          --color-accent:         var(--color-light-accent, #ad858d);
          --color-accent-glow:    color-mix(in srgb, var(--color-light-accent, #ad858d) 50%, transparent);
          --color-secondary-text: var(--color-light-secondary-text, #6c757d);
        }

        .dark {
          --color-card:           var(--color-dark-card, #282828);
          --color-border:         var(--color-dark-border, rgb(49,49,49));
          --color-accent:         var(--color-dark-accent, #d4a373);
          --color-accent-glow:    color-mix(in srgb, var(--color-dark-accent, #d4a373) 50%, transparent);
          --color-secondary-text: var(--color-dark-secondary-text, #9e9e9e);
        }

        @keyframes diceRock {
          from { transform: rotate(-6deg) scale(1.03); }
          to   { transform: rotate(6deg) scale(0.98); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>

      <div
        className="flex flex-col items-center justify-center gap-6"
        style={{ animation: "fadeUp 1s ease both" }}
      >
        <RollingDice />

        <div className="flex flex-col items-center gap-2">
          <CyclingMessage finishing={finishing} />

          <div className="flex gap-1.5 mt-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  display: "inline-block",
                  background: "var(--color-accent, currentColor)",
                  animation: `dotPulse 2.4s ease-in-out ${i * 0.4}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}