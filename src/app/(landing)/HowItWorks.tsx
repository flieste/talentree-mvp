"use client";

import { useState } from "react";

const STEPS = [
  {
    label: "Creá tu perfil",
    title: "Tu carrera, en un solo lugar",
    body: "Cargá tus datos deportivos, tus videos y tu historial. Un perfil profesional propio, pensado para que clubes y agentes lo lean en un minuto.",
  },
  {
    label: "Lo validamos",
    title: "Datos que se pueden creer",
    body: "Nuestra IA valida tus estadísticas y tu historial de rendimiento. Quien te mira sabe que lo que ve es verificable.",
  },
  {
    label: "Te encuentran",
    title: "Del buscador al contacto directo",
    body: "Clubes y agentes filtran por posición, edad y rendimiento, y te escriben desde la misma plataforma. Sin fricciones ni intermediarios innecesarios.",
  },
] as const;

const FIELDS = [
  { k: "POSICIÓN", v: "[Posición]" },
  { k: "EDAD", v: "[Edad]" },
  { k: "VIDEOS", v: "[Jugadas cargadas]" },
  { k: "HISTORIAL", v: "[Clubes y temporadas]" },
];

const CHECKS = [
  { label: "Estadísticas de rendimiento", ok: true },
  { label: "Historial deportivo", ok: true },
  { label: "Videos de jugadas", ok: false },
];

const FILTERS = ["Posición", "Edad", "Rendimiento", "Zona"];

export function HowItWorks() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  return (
    <>
      <div className="tt-tabs" role="tablist" aria-label="Cómo funciona">
        {STEPS.map((s, i) => (
          <button
            key={s.label}
            role="tab"
            id={`tt-tab-${i}`}
            aria-selected={i === step}
            aria-controls="tt-panel"
            className="tt-tab"
            onClick={() => setStep(i)}
          >
            <span className="tt-mono">0{i + 1}</span>
            {s.label}
          </button>
        ))}
      </div>

      <div
        className="tt-how__grid"
        id="tt-panel"
        role="tabpanel"
        aria-labelledby={`tt-tab-${step}`}
      >
        <div className="tt-how__text">
          <h3>{current.title}</h3>
          <p>{current.body}</p>
        </div>

        <div className="tt-demo">
          <div className="tt-demo__flag tt-mono">
            EJEMPLO ILUSTRATIVO · NO SON DATOS REALES
          </div>

          {step === 0 && (
            <div className="tt-stack">
              <div className="tt-profile">
                <div className="tt-avatar" />
                <div>
                  <strong>[Nombre del jugador]</strong>
                  <small>[Club actual] · [Localidad]</small>
                </div>
              </div>
              <div className="tt-fields">
                {FIELDS.map((f) => (
                  <div className="tt-field" key={f.k}>
                    <b className="tt-mono">{f.k}</b>
                    <span>{f.v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="tt-stack" style={{ gap: 12 }}>
              {CHECKS.map((c) => (
                <div className="tt-check" key={c.label}>
                  <span>{c.label}</span>
                  <span
                    className={`tt-pill tt-mono${c.ok ? " tt-pill--ok" : ""}`}
                  >
                    {c.ok ? "VALIDADO" : "EN REVISIÓN"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="tt-stack" style={{ gap: 18 }}>
              <div className="tt-filters">
                {FILTERS.map((f) => (
                  <span className="tt-filter" key={f}>
                    {f}
                  </span>
                ))}
              </div>
              <div className="tt-stack" style={{ gap: 10 }}>
                <div className="tt-result">
                  <span>[Perfil 1] · Verificado</span>
                  <span>Contactar</span>
                </div>
                <div className="tt-result">
                  <span>[Perfil 2] · Verificado</span>
                  <span>Contactar</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
