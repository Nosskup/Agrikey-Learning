"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  LIMITS,
  PARTNER_TYPES,
  validatePartnerRequest,
  type FieldErrors,
} from "../lib/partner-request";

type FormState = {
  full_name: string;
  organization: string;
  partner_type: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
  website: string; // champ piège : doit rester vide
};

const EMPTY: FormState = {
  full_name: "",
  organization: "",
  partner_type: "",
  email: "",
  phone: "",
  message: "",
  consent: false,
  website: "",
};

const INPUT =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-2 focus:ring-green-100";

export default function PartnerForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (key in errors) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key as keyof FieldErrors];
        return next;
      });
    }
  }

  function onText(key: keyof FormState) {
    return (
      event: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => update(key, event.target.value as never);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    setFormError("");

    // Mêmes règles que le serveur : l'erreur s'affiche tout de suite.
    const check = validatePartnerRequest(form);
    if (check.kind === "invalid") {
      setErrors(check.errors);
      return;
    }

    setErrors({});
    setSending(true);

    try {
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      let data: { ok?: boolean; errors?: FieldErrors; error?: string } = {};
      try {
        data = await response.json();
      } catch {
        // réponse non lisible : géré ci-dessous
      }

      if (response.ok && data.ok) {
        setSent(true);
        setForm(EMPTY);
        return;
      }

      if (data.errors) {
        setErrors(data.errors);
      }

      setFormError(
        data.error ||
          (data.errors
            ? "Certains champs sont à corriger."
            : "Votre demande n'a pas pu être envoyée. Merci de réessayer.")
      );
    } catch {
      setFormError(
        "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez."
      );
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-2xl font-black text-white">
          ✓
        </div>

        <h3 className="mt-5 text-xl font-black text-slate-900">
          Votre demande a bien été envoyée
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Merci de votre intérêt pour AGRIKEY Learning. Nous avons bien reçu
          votre message et nous reviendrons vers vous.
        </p>

        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 rounded-xl border border-green-300 bg-white px-5 py-2.5 text-sm font-bold text-green-800 transition hover:bg-green-100"
        >
          Envoyer une autre demande
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="pf-name" className="text-sm font-semibold text-slate-800">
            Votre nom <span className="text-red-600">*</span>
          </label>
          <input
            id="pf-name"
            type="text"
            autoComplete="name"
            value={form.full_name}
            onChange={onText("full_name")}
            maxLength={LIMITS.name.max + 20}
            aria-invalid={!!errors.full_name}
            aria-describedby={errors.full_name ? "pf-name-err" : undefined}
            className={INPUT}
          />
          {errors.full_name && (
            <p id="pf-name-err" className="mt-1 text-xs font-medium text-red-600">
              {errors.full_name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="pf-org" className="text-sm font-semibold text-slate-800">
            Organisation <span className="font-normal text-slate-400">(facultatif)</span>
          </label>
          <input
            id="pf-org"
            type="text"
            autoComplete="organization"
            value={form.organization}
            onChange={onText("organization")}
            aria-invalid={!!errors.organization}
            className={INPUT}
          />
          {errors.organization && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.organization}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="pf-type" className="text-sm font-semibold text-slate-800">
          Vous êtes <span className="text-red-600">*</span>
        </label>
        <select
          id="pf-type"
          value={form.partner_type}
          onChange={onText("partner_type")}
          aria-invalid={!!errors.partner_type}
          aria-describedby={errors.partner_type ? "pf-type-err" : undefined}
          className={INPUT}
        >
          <option value="">Choisissez…</option>
          {PARTNER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {errors.partner_type && (
          <p id="pf-type-err" className="mt-1 text-xs font-medium text-red-600">
            {errors.partner_type}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="pf-email" className="text-sm font-semibold text-slate-800">
            Adresse e-mail <span className="text-red-600">*</span>
          </label>
          <input
            id="pf-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={onText("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "pf-email-err" : undefined}
            className={INPUT}
          />
          {errors.email && (
            <p id="pf-email-err" className="mt-1 text-xs font-medium text-red-600">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="pf-phone" className="text-sm font-semibold text-slate-800">
            Téléphone <span className="font-normal text-slate-400">(facultatif)</span>
          </label>
          <input
            id="pf-phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={onText("phone")}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "pf-phone-err" : undefined}
            className={INPUT}
          />
          {errors.phone && (
            <p id="pf-phone-err" className="mt-1 text-xs font-medium text-red-600">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="pf-message" className="text-sm font-semibold text-slate-800">
          Votre besoin <span className="text-red-600">*</span>
        </label>
        <textarea
          id="pf-message"
          rows={5}
          value={form.message}
          onChange={onText("message")}
          placeholder="Quelle formation souhaitez-vous digitaliser, pour quel public, avec quel objectif ?"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "pf-message-err" : undefined}
          className={INPUT}
        />
        <div className="mt-1 flex items-start justify-between gap-3">
          {errors.message ? (
            <p id="pf-message-err" className="text-xs font-medium text-red-600">
              {errors.message}
            </p>
          ) : (
            <span />
          )}
          <span className="shrink-0 text-xs text-slate-400">
            {form.message.length} / {LIMITS.message.max}
          </span>
        </div>
      </div>

      {/* Champ piège : invisible pour une personne, souvent rempli par les robots. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="pf-website">Ne pas remplir ce champ</label>
        <input
          id="pf-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={onText("website")}
        />
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => update("consent", e.target.checked)}
            aria-invalid={!!errors.consent}
            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-green-700 focus:ring-green-600"
          />
          <span>
            J'accepte que ces informations soient utilisées uniquement pour
            répondre à ma demande.
          </span>
        </label>
        {errors.consent && (
          <p className="mt-1 text-xs font-medium text-red-600">{errors.consent}</p>
        )}
      </div>

      {formError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-xl bg-green-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {sending ? "Envoi en cours..." : "Envoyer ma demande"}
      </button>
    </form>
  );
}
