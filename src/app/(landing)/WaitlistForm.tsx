"use client";

import { useActionState } from "react";
import { joinWaitlist, type WaitlistState } from "./actions";

const initialState: WaitlistState = { status: "idle" };

export function WaitlistForm({ source }: { source?: string }) {
  const [state, formAction, isPending] = useActionState(
    joinWaitlist,
    initialState,
  );

  if (state.status === "ok") {
    return (
      <div className="tt-signup__done" role="status">
        <div className="tt-signup__check tt-accent" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12.5l4.5 4.5L19 7.500"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3>Ya estás en la lista</h3>
        <p>
          Te vamos a escribir apenas abramos las cuentas. Mientras tanto,
          podés mirar cómo se ve la demo.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="tt-form" noValidate>
      <div className="tt-field-input">
        <label htmlFor="wl-name">Nombre</label>
        <input
          id="wl-name"
          name="name"
          type="text"
          autoComplete="given-name"
          placeholder="Tu nombre"
          defaultValue={state.values?.name}
          maxLength={80}
          required
        />
      </div>
      <div className="tt-field-input">
        <label htmlFor="wl-email">Email</label>
        <input
          id="wl-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          defaultValue={state.values?.email}
          maxLength={254}
          required
        />
      </div>
      <div className="tt-field-input">
        <label htmlFor="wl-contact">WhatsApp o Instagram</label>
        <input
          id="wl-contact"
          name="contact"
          type="text"
          autoComplete="tel"
          placeholder="+54 9 11 ... o @tuusuario"
          defaultValue={state.values?.contact}
          maxLength={80}
          required
        />
      </div>

      {/* Campo trampa anti-bots: fuera de pantalla y fuera del teclado. */}
      <div className="tt-hp" aria-hidden="true">
        <label htmlFor="wl-website">No completar</label>
        <input id="wl-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="source" value={source ?? ""} />

      <label className="tt-consent" htmlFor="wl-consent">
        <input id="wl-consent" name="consent" type="checkbox" />
        <span>
          Acepto que TalenTree use estos datos para avisarme del lanzamiento y
          contactarme.
        </span>
      </label>

      {state.status === "error" && state.message && (
        <p role="alert" className="tt-form__error">
          {state.message}
        </p>
      )}

      <button type="submit" className="tt-btn tt-form__submit" disabled={isPending}>
        {isPending ? "Enviando..." : "Quiero mi cuenta"}
      </button>
    </form>
  );
}
