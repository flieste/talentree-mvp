"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import type { NewsItem } from "@/lib/types";
import { NewsItemCard } from "@/components/NewsItemCard";
import { cn } from "@/lib/utils";

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Panel de noticias del Inicio: carrusel horizontal con una noticia por slide.
 * - Se desliza con el dedo / trackpad / rueda horizontal (scroll-snap).
 * - Las flechas laterales aparecen al pasar el cursor por encima.
 * - Los puntos (arriba a la derecha) indican en qué noticia estás.
 */
export function NewsPanel({ items }: { items: NewsItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // Slide de destino y si hay una animación en curso: permite clickear la flecha
  // varias veces seguidas sin que se pierdan clicks mientras el scroll anima.
  const targetRef = useRef(0);
  const animatingRef = useRef(false);
  const count = items.length;

  const goTo = useCallback(
    (i: number) => {
      const el = trackRef.current;
      if (!el) return;
      const target = Math.max(0, Math.min(count - 1, i));
      targetRef.current = target;
      animatingRef.current = true;
      el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
    },
    [count],
  );

  function handleScroll() {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (animatingRef.current) {
      if (Math.abs(el.scrollLeft - targetRef.current * el.clientWidth) < 2) {
        animatingRef.current = false;
      }
    } else {
      targetRef.current = i;
    }
    setIndex(i);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(targetRef.current + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(targetRef.current - 1);
    }
  }

  return (
    <section
      aria-roledescription="carrusel"
      aria-labelledby="news-panel-title"
      className="news-panel group p-4 pl-5 sm:p-5 sm:pl-6"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          id="news-panel-title"
          className="font-display text-xl font-semibold tracking-tight text-[var(--news-gold)]"
        >
          Noticias y eventos
        </h2>

        {count > 0 && (
          <div className="flex items-center gap-2" role="group" aria-label="Elegir noticia">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ir a la noticia ${i + 1} de ${count}`}
                aria-current={i === index}
                className={cn("news-dot", i === index && "news-dot--active")}
              />
            ))}
          </div>
        )}
      </div>

      {count === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded border border-dashed border-[#3d4650] px-4 py-8 text-center">
          <p className="font-display text-2xl italic text-[var(--news-gold)]">Próximamente...</p>
          <p className="text-sm text-[var(--news-gold-soft)]/80">
            Acá vas a ver las pruebas en clubes, pruebas privadas y otros eventos.
          </p>
        </div>
      ) : (
        <>
          <div className="relative">
            <div
              ref={trackRef}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              tabIndex={0}
              aria-label="Noticias y eventos"
              className="news-track flex snap-x snap-mandatory overflow-x-auto"
            >
              {items.map((item, i) => (
                <div
                  key={item.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} de ${count}`}
                  className="flex w-full shrink-0 snap-center"
                >
                  <div className="flex w-full">
                    <NewsItemCard item={item} featured />
                  </div>
                </div>
              ))}
            </div>

            {index > 0 && (
              <button
                type="button"
                onClick={() => goTo(targetRef.current - 1)}
                aria-label="Noticia anterior"
                className="news-arrow left-2"
              >
                <Chevron direction="left" />
              </button>
            )}
            {index < count - 1 && (
              <button
                type="button"
                onClick={() => goTo(targetRef.current + 1)}
                aria-label="Noticia siguiente"
                className="news-arrow right-2"
              >
                <Chevron direction="right" />
              </button>
            )}
          </div>

          <div className="mt-3 flex justify-end">
            <Link href="/news" className="news-panel__link text-sm font-medium">
              Ver todas
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
