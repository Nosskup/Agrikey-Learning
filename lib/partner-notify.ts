/**
 * Notification par e-mail d'une nouvelle demande de partenariat.
 *
 * Service d'envoi : Resend (https://resend.com), appelé directement par son API,
 * sans bibliothèque supplémentaire.
 *
 * Réglages (variables d'environnement, côté serveur uniquement) :
 *   RESEND_API_KEY        clé secrète de l'API (commence par « re_ »)
 *   PARTNER_NOTIFY_EMAIL  adresse qui reçoit les notifications
 *   PARTNER_NOTIFY_FROM   facultatif : expéditeur. Par défaut,
 *                         « AGRIKEY Learning <onboarding@resend.dev> », qui ne peut
 *                         écrire qu'à l'adresse de votre propre compte Resend, tant
 *                         qu'aucun nom de domaine n'est vérifié chez eux.
 *
 * L'envoi n'est JAMAIS une condition de l'enregistrement d'une demande : si l'e-mail
 * échoue, la demande est quand même conservée (voir processPartnerRequest).
 */

import { PARTNER_TYPES, type PartnerRequestRow } from "./partner-request";

export type NotifyConfig = {
  apiKey: string;
  to: string;
  from: string;
};

export type Mail = {
  subject: string;
  text: string;
  replyTo?: string;
};

export type SendResult = { ok: true } | { ok: false; reason: string };

const DEFAULT_FROM = "AGRIKEY Learning <onboarding@resend.dev>";
const RESEND_URL = "https://api.resend.com/emails";

type Env = Record<string, string | undefined>;

/** Renvoie la configuration, ou null si la notification n'est pas (entièrement) réglée. */
export function getNotifyConfig(env: Env = process.env): NotifyConfig | null {
  const apiKey = (env.RESEND_API_KEY || "").trim();
  const to = (env.PARTNER_NOTIFY_EMAIL || "").trim();

  if (!apiKey || !to) return null;

  return {
    apiKey,
    to,
    from: (env.PARTNER_NOTIFY_FROM || "").trim() || DEFAULT_FROM,
  };
}

/** Texte sur une seule ligne : supprime les retours à la ligne et caractères de contrôle. */
function oneLine(value: string, max: number): string {
  const flat = value
    .replace(/[\u0000-\u001F\u007F\u2028\u2029]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return flat.length > max ? flat.slice(0, max - 1) + "…" : flat;
}

function typeLabel(value: string): string {
  return PARTNER_TYPES.find((t) => t.value === value)?.label ?? value;
}

/** Rédige le message de notification (texte brut : rien n'est interprété comme du HTML). */
export function buildNotification(
  row: PartnerRequestRow,
  adminUrl: string
): Mail {
  const lines = [
    "Une nouvelle demande de partenariat vient d'arriver sur AGRIKEY Learning.",
    "",
    `Nom : ${oneLine(row.full_name, 120)}`,
    `Organisation : ${row.organization ? oneLine(row.organization, 160) : "(non précisée)"}`,
    `Type : ${typeLabel(row.partner_type)}`,
    `E-mail : ${row.email}`,
    `Téléphone : ${row.phone ? oneLine(row.phone, 40) : "(non précisé)"}`,
    "",
    "Message :",
    row.message,
    "",
    "—",
    `Pour répondre, répondez simplement à cet e-mail : la réponse part directement à ${row.email}.`,
    `Pour suivre cette demande : ${adminUrl}`,
  ];

  return {
    subject: `Nouvelle demande de partenariat : ${oneLine(row.full_name, 80)}`,
    text: lines.join("\n"),
    replyTo: row.email,
  };
}

/** Message de test, envoyé depuis l'administration pour vérifier les réglages. */
export function buildTestMail(adminUrl: string): Mail {
  return {
    subject: "Test de notification AGRIKEY Learning",
    text: [
      "Ceci est un message de test.",
      "",
      "Si vous le lisez, la notification par e-mail est correctement réglée :",
      "vous recevrez un message de ce type à chaque nouvelle demande de partenariat.",
      "",
      `Administration des demandes : ${adminUrl}`,
    ].join("\n"),
  };
}

/** Envoie un e-mail. Ne lève jamais d'exception : renvoie toujours un résultat. */
export async function sendMail(
  config: NotifyConfig,
  mail: Mail,
  options: { fetchImpl?: typeof fetch; timeoutMs?: number } = {}
): Promise<SendResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 4000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [config.to],
        subject: mail.subject,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
      signal: controller.signal,
    });

    if (response.ok) {
      return { ok: true };
    }

    let detail = "";
    try {
      const data = await response.json();
      if (data && typeof data.message === "string") {
        detail = data.message;
      }
    } catch {
      // réponse non lisible : on garde seulement le code
    }

    const reason = detail
      ? `Resend a refusé l'envoi (${response.status}) : ${detail}`
      : `Resend a refusé l'envoi (code ${response.status}).`;

    return { ok: false, reason: reason.slice(0, 400) };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        reason: "Le service d'envoi n'a pas répondu à temps (plus de 4 secondes).",
      };
    }

    return {
      ok: false,
      reason: "Impossible de joindre le service d'envoi (problème de connexion).",
    };
  } finally {
    clearTimeout(timer);
  }
}
