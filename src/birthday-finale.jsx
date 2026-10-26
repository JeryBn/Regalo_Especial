import React, { useState } from "react";

const stars = [
  [23, 20],
  [37, 20],
  [43, 28],
  [40, 37],
  [25, 53],
  [43, 53],
  [57, 27],
  [64, 20],
  [64, 53],
];
function downloadPostcard() {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1000;
  const c = canvas.getContext("2d");
  c.fillStyle = "#030817";
  c.fillRect(0, 0, 1600, 1000);
  const glow = c.createRadialGradient(800, 450, 10, 800, 450, 700);
  glow.addColorStop(0, "#30335c");
  glow.addColorStop(1, "#030817");
  c.fillStyle = glow;
  c.fillRect(0, 0, 1600, 1000);
  let seed = 21;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 1600; i++) {
    c.globalAlpha = 0.15 + random() * 0.8;
    c.fillStyle = i % 8 === 0 ? "#ffdfa3" : "#c9dfff";
    c.beginPath();
    c.arc(
      random() * 1600,
      random() * 1000,
      0.3 + random() * 1.5,
      0,
      Math.PI * 2,
    );
    c.fill();
  }
  c.globalAlpha = 1;
  c.textAlign = "center";
  c.fillStyle = "#f7dfa8";
  c.font = "180px Georgia";
  c.fillText("21", 800, 400);
  c.fillStyle = "#edf3ff";
  c.font = "64px Georgia";
  c.fillText("¡Feliz cumpleaños, Stacy!", 800, 550);
  c.font = "27px Georgia";
  c.fillStyle = "#bbcce8";
  c.fillText(
    "21 galaxias · 21 mensajes · Un universo para celebrar tu día",
    800,
    640,
  );
  c.font = "24px Georgia";
  c.fillText("30 de octubre de 2026 · Universo 21", 800, 850);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Stacy-universo-21.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }, "image/png");
}
export default function BirthdayFinale({ onClose }) {
  const [stage, setStage] = useState("constellation");
  const [out, setOut] = useState([]);
  const [wished, setWished] = useState(false);
  const extinguish = (index) =>
    setOut((old) => (old.includes(index) ? old : [...old, index]));
  return (
    <section
      className="birthday-finale"
      role="dialog"
      aria-modal="true"
      aria-label="Celebración de los 21 años de Stacy"
    >
      <button
        className="finale-close"
        onClick={onClose}
        aria-label="Seguir explorando"
      >
        ×
      </button>
      <span className="finale-eyebrow">21 GALAXIAS · UN CUMPLEAÑOS</span>
      {stage === "constellation" && (
        <>
          <svg
            className="constellation-21"
            viewBox="0 0 90 65"
            aria-label="Constelación del número 21"
          >
            <path d="M23 20 L37 20 L43 28 L40 37 L25 53 L43 53 M57 27 L64 20 L64 53" />
            {stars.map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r=".7"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </svg>
          <h2>¡Felices 21, Stacy!</h2>
          <p>
            Este universo fue preparado para celebrar tus 21. Has descubierto
            todos sus mensajes; ahora queda una pequeña celebración.
          </p>
          <button
            className="birthday-action"
            onClick={() => setStage("candles")}
          >
            Encender la celebración
          </button>
        </>
      )}
      {stage === "candles" && (
        <>
          <h2>21 luces. Un cumpleaños.</h2>
          <p>
            Pasa el ratón por las luces o desliza el dedo para apagarlas.
            También puedes tocarlas una a una.
          </p>
          <div
            className="star-candles"
            onPointerMove={(event) => {
              if (event.pointerType === "touch" || event.buttons) {
                const element = document.elementFromPoint(
                  event.clientX,
                  event.clientY,
                );
                const index = element?.getAttribute("data-candle");
                if (index !== null && index !== undefined)
                  extinguish(Number(index));
              }
            }}
          >
            {Array.from({ length: 21 }, (_, i) => (
              <button
                key={i}
                data-candle={i}
                className={out.includes(i) ? "candle extinguished" : "candle"}
                aria-label={`Apagar velita ${i + 1}`}
                aria-pressed={out.includes(i)}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") extinguish(i);
                }}
                onClick={() => extinguish(i)}
              >
                ✦
              </button>
            ))}
          </div>
          <span className="candle-count" aria-live="polite">
            {out.length} de 21 luces apagadas
          </span>
          {out.length === 21 && (
            <>
              <div className="birthday-shower" aria-hidden="true">
                {Array.from({ length: 25 }, (_, i) => (
                  <i
                    key={i}
                    style={{
                      left: `${(i * 37) % 100}%`,
                      animationDelay: `${(i % 7) * 0.23}s`,
                    }}
                  />
                ))}
              </div>
              <button
                className="birthday-action"
                onClick={() => setStage("wish")}
              >
                Pedir mi deseo
              </button>
            </>
          )}
        </>
      )}
      {stage === "wish" && (
        <>
          <h2>
            {wished
              ? "Que tengas un cumpleaños inolvidable."
              : "Antes de irte, pide tu deseo."}
          </h2>
          <p>
            {wished
              ? "Tu deseo se queda entre las estrellas. Puedes guardar un recuerdo de este universo o volver a recorrerlo cuando quieras."
              : "Piensa en él y toca la estrella cuando estés lista. No necesitas escribirlo: es solo tuyo."}
          </p>
          <button
            className={`wish-star ${wished ? "wish-sent" : ""}`}
            aria-label={
              wished
                ? "Deseo enviado a las estrellas"
                : "Lanzar mi estrella del deseo"
            }
            disabled={wished}
            onClick={() => setWished(true)}
          >
            ✦
          </button>
          {wished && (
            <>
              <button className="birthday-action" onClick={downloadPostcard}>
                Guardar mi postal de cumpleaños
              </button>
              <button className="birthday-secondary" onClick={onClose}>
                Volver a las galaxias
              </button>
            </>
          )}
        </>
      )}
    </section>
  );
}
