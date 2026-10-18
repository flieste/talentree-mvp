import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "@fontsource/big-shoulders-display/700";
import "@fontsource/big-shoulders-display/800";
import "@fontsource/big-shoulders-display/900";
import "@fontsource/hanken-grotesk/400";
import "@fontsource/hanken-grotesk/500";
import "@fontsource/hanken-grotesk/600";
import "@fontsource/jetbrains-mono/400";
import "./landing.css";
import { HowItWorks } from "./HowItWorks";
import { WaitlistForm } from "./WaitlistForm";

export const metadata: Metadata = {
  title: "TalenTree — Que te vean no es cuestión de suerte",
  description:
    "TalenTree conecta jugadores con clubes y agentes. Perfiles con estadísticas validadas por IA y un buscador para encontrar talento fuera de las redes de siempre.",
};

/** Entrada a la demo: si no hay sesión, el middleware lleva a /login. */
const DEMO_HREF = "/inicio";

const MARQUEE = ["Visibilidad", "Datos validados", "Contacto directo"];

const STATS = [
  {
    n: "+90%",
    text: "de los jugadores consultados tuvo dificultades moderadas o severas para conseguir club.",
  },
  {
    n: "45,5%",
    text: "no tiene ninguna forma de darse a conocer ante instituciones.",
  },
  {
    n: "9 de 15",
    text: "clubes y agentes contactados pidieron más información sobre la propuesta.",
  },
];

const WHO = [
  {
    tag: "01 · 14 A 23 AÑOS",
    title: "Jugadores",
    text: "Un perfil profesional y verificable, y contacto directo con clubes y agentes, sin depender de contactos informales.",
  },
  {
    tag: "02 · AMBA",
    title: "Clubes",
    text: "Talento filtrado y comparable, con menos costo que el scouting tradicional. Y un canal para ubicar a quienes ya no entran en tu plantel.",
  },
  {
    tag: "03 · AMBA",
    title: "Agentes",
    text: "Llegá antes que la competencia a talento sin representación, con información completa y confiable.",
  },
];

/** Solo letras, números, guion y punto: el canal de origen (?src=...) se guarda en la lista. */
function cleanSource(raw?: string) {
  return raw && /^[a-z0-9_.-]{1,40}$/i.test(raw) ? raw.toLowerCase() : undefined;
}

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ src?: string }>;
}) {
  const source = cleanSource((await searchParams).src);

  // Cinta: cantidad par de repeticiones idénticas, así el bucle (-50%) es continuo.
  const loop = Array.from({ length: 8 }).flatMap(() =>
    MARQUEE.flatMap((w) => [w, "/"]),
  );

  return (
    <div className="tt" id="top">
      {/* NAV */}
      <header className="tt-wrap tt-nav">
        <a href="#top" className="tt-brand" aria-label="TalenTree">
          <Image
            src="/landing-tree.png"
            alt=""
            width={53}
            height={52}
            priority
          />
          <span className="tt-brand__name">
            <span className="tt-accent">Talen</span>Tree
          </span>
        </a>
        <nav className="tt-links" aria-label="Principal">
          <a href="#problema">El problema</a>
          <a href="#como">Cómo funciona</a>
          <a href="#para-quien">Para quién</a>
          <Link href={DEMO_HREF} className="tt-btn tt-btn--ghost tt-btn--sm tt-hide-sm">
            Ver la demo
          </Link>
          <a href="#lista" className="tt-btn tt-btn--sm">
            Sumarme
          </a>
        </nav>
      </header>

      {/* HERO */}
      <section className="tt-wrap tt-hero">
        <div className="tt-hero__copy">
          <div className="tt-eyebrow tt-mono tt-hero__eyebrow tt-rise">
            <i />
            Plataforma de scouting · Fútbol argentino
          </div>
          <h1 className="tt-rise r2">
            Que te vean
            <br />
            no es cuestión
            <br />
            <span className="tt-accent">de suerte.</span>
          </h1>
          <p className="tt-lead tt-rise r3">
            TalenTree conecta jugadores con clubes y agentes. Perfiles con
            estadísticas validadas por IA y un buscador para encontrar talento
            fuera de las redes de siempre.
          </p>
          <div className="tt-row tt-rise r4">
            <a href="#lista" className="tt-btn">
              Quiero mi cuenta
            </a>
            <Link href={DEMO_HREF} className="tt-btn tt-btn--ghost">
              Probar la demo
            </Link>
          </div>
        </div>

        <div className="tt-pitch tt-rise r3" aria-hidden="true">
          <svg viewBox="0 0 400 560">
            <defs>
              <pattern
                id="tt-stripes"
                width="400"
                height="80"
                patternUnits="userSpaceOnUse"
              >
                <rect width="400" height="40" fill="#121D14" />
                <rect y="40" width="400" height="40" fill="#0F1710" />
              </pattern>
            </defs>
            <rect width="400" height="560" fill="url(#tt-stripes)" />
            <g
              fill="none"
              stroke="#ECF0E2"
              strokeOpacity=".28"
              strokeWidth="1.5"
            >
              <rect x="24" y="24" width="352" height="512" />
              <line x1="24" y1="280" x2="376" y2="280" />
              <circle cx="200" cy="280" r="52" />
              <rect x="104" y="24" width="192" height="84" />
              <rect x="152" y="24" width="96" height="30" />
              <rect x="104" y="452" width="192" height="84" />
              <rect x="152" y="506" width="96" height="30" />
              <path d="M156 108a52 52 0 0 0 88 0" />
              <path d="M156 452a52 52 0 0 1 88 0" />
            </g>
            <g fill="#7BD65A">
              <circle cx="118" cy="168" r="5" />
              <circle className="tt-pulse" cx="118" cy="168" r="5" />
              <circle cx="262" cy="236" r="5" />
              <circle className="tt-pulse d2" cx="262" cy="236" r="5" />
              <circle cx="188" cy="374" r="5" />
              <circle className="tt-pulse d3" cx="188" cy="374" r="5" />
              <circle cx="302" cy="430" r="4" fillOpacity=".5" />
              <circle cx="92" cy="332" r="4" fillOpacity=".5" />
              <circle cx="224" cy="110" r="4" fillOpacity=".5" />
            </g>
            <path
              d="M118 168 L262 236 L188 374"
              fill="none"
              stroke="#7BD65A"
              strokeOpacity=".45"
              strokeDasharray="3 6"
            />
          </svg>
          <div className="tt-pitch__scan" />
          <div className="tt-pitch__tag tt-mono">IA VALIDANDO</div>
          <div className="tt-pitch__card">
            <div className="tt-pitch__meta tt-mono">
              <span>PERFIL VERIFICADO</span>
              <span className="tt-accent">3 PERFILES</span>
            </div>
            <div className="tt-pitch__title tt-display">Talento a la vista</div>
            <div style={{ fontSize: 14, color: "var(--soft)" }}>
              Ilustración de cómo se vería un perfil validado.
            </div>
          </div>
        </div>
      </section>

      {/* CINTA */}
      <div className="tt-marquee-wrap" aria-hidden="true">
        <div className="tt-marquee tt-display">
          {loop.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
      </div>

      {/* LISTA DE ESPERA */}
      <section id="lista" className="tt-wrap tt-signup">
        <div className="tt-signup__copy">
          <div className="tt-eyebrow tt-mono">Lista de espera</div>
          <h2 className="tt-h2">
            Tu perfil <span className="tt-accent">te espera.</span>
          </h2>
          <p className="tt-lead">
            Estamos viendo cuántos jugadores quieren tener su perfil en
            TalenTree. Dejanos tus datos y te avisamos apenas abramos las
            cuentas.
          </p>
          <p className="tt-signup__alt">
            ¿Querés ver cómo funciona antes?{" "}
            <Link href={DEMO_HREF} className="tt-signup__link">
              Probá la demo
            </Link>
            .
          </p>
        </div>
        <div className="tt-signup__card">
          <WaitlistForm source={source} />
        </div>
      </section>

      {/* PROBLEMA */}
      <section id="problema" className="tt-wrap tt-section tt-problem">
        <div className="tt-head">
          <div className="tt-eyebrow tt-mono">El problema</div>
          <h2 className="tt-h2">
            Sobra talento.
            <br />
            Falta un canal.
          </h2>
          <p className="tt-lead">
            Hoy un jugador depende de un contacto, de su entrenador o de estar
            en el lugar justo. Y los clubes y agentes compiten siempre por los
            mismos nombres conocidos.
          </p>
        </div>
        <div className="tt-stats">
          {STATS.map((s) => (
            <div className="tt-stat" key={s.n}>
              <div className="tt-stat__n">{s.n}</div>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
        <div className="tt-source tt-mono">
          Fuente: encuestas y entrevistas propias del equipo TalenTree, 2026.
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como" className="tt-wrap tt-section tt-how">
        <div className="tt-head" style={{ maxWidth: 760 }}>
          <div className="tt-eyebrow tt-mono">Cómo funciona</div>
          <h2 className="tt-h2">
            Tres pasos.
            <br />
            Un solo perfil.
          </h2>
        </div>
        <HowItWorks />
        <div className="tt-row">
          <a href="#lista" className="tt-btn">
            Quiero mi cuenta
          </a>
          <Link href={DEMO_HREF} className="tt-btn tt-btn--ghost">
            Probar la demo
          </Link>
        </div>
      </section>

      {/* PARA QUIEN */}
      <section id="para-quien" className="tt-who">
        <div className="tt-wrap tt-section">
          <h2 className="tt-h2">
            Jugadores, clubes y agentes.{" "}
            <span className="tt-accent">Un solo canal.</span>
          </h2>
          <div className="tt-cards">
            {WHO.map((w) => (
              <div className="tt-card" key={w.title}>
                <span className="tt-card__tag tt-mono">{w.tag}</span>
                <div>
                  <h3>{w.title}</h3>
                  <p>{w.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CIERRE */}
      <section id="contacto" className="tt-wrap tt-cta">
        <h2>
          Que el talento
          <br />
          <span className="tt-accent">se encuentre.</span>
        </h2>
        <p className="tt-lead">
          Estamos armando TalenTree en el AMBA. Dejanos tus datos y sé de los
          primeros en tener tu perfil.
        </p>
        <div className="tt-row">
          <a href="#lista" className="tt-btn">
            Quiero mi cuenta
          </a>
          <Link href={DEMO_HREF} className="tt-btn tt-btn--ghost">
            Entrar a la demo
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="tt-wrap tt-footer">
        <span>TalenTree · Proyecto universitario, Universidad Austral, Argentina</span>
        <span style={{ maxWidth: "44em" }}>
          Proyecto en desarrollo. Los perfiles mostrados en esta página son
          ilustrativos.
        </span>
      </footer>
    </div>
  );
}
