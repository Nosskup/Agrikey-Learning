/**
 * Demandes de partenariat : validation et protection contre le courrier indésirable.
 *
 * Ce fichier ne dépend ni de Supabase ni de Next : il décrit des règles pures,
 * utilisées à la fois par la route serveur (/api/partners) et par le formulaire,
 * afin que les deux disent exactement la même chose.
 */

export const PARTNER_TYPES = [
  { value: "expert", label: "Expert ou formateur" },
  { value: "centre", label: "Centre de formation ou université" },
  { value: "ong", label: "ONG ou projet de développement" },
  { value: "entreprise", label: "Entreprise ou organisation" },
  { value: "autre", label: "Autre" },
] as const;

export type PartnerType = (typeof PARTNER_TYPES)[number]["value"];

export const LIMITS = {
  name: { min: 2, max: 120 },
  organization: { max: 160 },
  email: { min: 5, max: 200 },
  phone: { max: 40 },
  message: { min: 10, max: 2000 },
} as const;

/** Au plus 3 demandes par adresse e-mail et par 24 heures. */
export const MAX_PER_EMAIL_PER_DAY = 3;
/** Au plus 60 demandes au total par heure, tous visiteurs confondus. */
export const MAX_PER_HOUR_GLOBAL = 60;

export type PartnerRequestRow = {
  full_name: string;
  organization: string | null;
  partner_type: PartnerType;
  email: string;
  phone: string | null;
  message: string;
};

export type FieldErrors = Partial<
  Record<
    | "full_name"
    | "organization"
    | "partner_type"
    | "email"
    | "phone"
    | "message"
    | "consent",
    string
  >
>;

export type ValidationResult =
  | { kind: "ok"; row: PartnerRequestRow }
  | { kind: "spam" }
  | { kind: "invalid"; errors: FieldErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[0-9+().\-\s]{6,40}$/;

function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  // retire les caractères de contrôle, puis les espaces autour
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

export function validatePartnerRequest(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { kind: "invalid", errors: { message: "Demande invalide." } };
  }

  const input = body as Record<string, unknown>;

  // Champ piège : invisible pour une personne, rempli par la plupart des robots.
  if (clean(input.website) !== "") {
    return { kind: "spam" };
  }

  const errors: FieldErrors = {};

  const fullName = clean(input.full_name);
  if (fullName.length < LIMITS.name.min) {
    errors.full_name = "Indiquez votre nom.";
  } else if (fullName.length > LIMITS.name.max) {
    errors.full_name = `Votre nom ne peut pas dépasser ${LIMITS.name.max} caractères.`;
  }

  const organization = clean(input.organization);
  if (organization.length > LIMITS.organization.max) {
    errors.organization = `Le nom de l'organisation ne peut pas dépasser ${LIMITS.organization.max} caractères.`;
  }

  const partnerType = clean(input.partner_type);
  if (!PARTNER_TYPES.some((t) => t.value === partnerType)) {
    errors.partner_type = "Choisissez le type de partenariat.";
  }

  const email = clean(input.email).toLowerCase();
  if (
    email.length < LIMITS.email.min ||
    email.length > LIMITS.email.max ||
    !EMAIL_PATTERN.test(email)
  ) {
    errors.email = "Indiquez une adresse e-mail valide.";
  }

  const phone = clean(input.phone);
  if (phone !== "" && !PHONE_PATTERN.test(phone)) {
    errors.phone = "Le numéro ne doit contenir que des chiffres, espaces, + ( ) . -";
  }

  const message = clean(input.message);
  if (message.length < LIMITS.message.min) {
    errors.message = `Décrivez votre besoin en quelques mots (au moins ${LIMITS.message.min} caractères).`;
  } else if (message.length > LIMITS.message.max) {
    errors.message = `Votre message ne peut pas dépasser ${LIMITS.message.max} caractères.`;
  }

  if (input.consent !== true) {
    errors.consent = "Veuillez accepter que nous utilisions ces informations pour vous répondre.";
  }

  if (Object.keys(errors).length > 0) {
    return { kind: "invalid", errors };
  }

  return {
    kind: "ok",
    row: {
      full_name: fullName,
      organization: organization === "" ? null : organization,
      partner_type: partnerType as PartnerType,
      email,
      phone: phone === "" ? null : phone,
      message,
    },
  };
}

export type PartnerDeps = {
  now: () => Date;
  countByEmailSince: (email: string, sinceIso: string) => Promise<number>;
  countAllSince: (sinceIso: string) => Promise<number>;
  insert: (row: PartnerRequestRow) => Promise<{ error: string | null }>;
};

export type PartnerResponse = {
  status: 200 | 400 | 429 | 500;
  body: { ok: boolean; errors?: FieldErrors; error?: string };
};

export async function processPartnerRequest(
  body: unknown,
  deps: PartnerDeps
): Promise<PartnerResponse> {
  const validation = validatePartnerRequest(body);

  // Les robots reçoivent une réponse de succès : ils ne savent pas qu'ils ont été repérés.
  if (validation.kind === "spam") {
    return { status: 200, body: { ok: true } };
  }

  if (validation.kind === "invalid") {
    return { status: 400, body: { ok: false, errors: validation.errors } };
  }

  try {
    const now = deps.now();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    const fromSameEmail = await deps.countByEmailSince(validation.row.email, dayAgo);
    if (fromSameEmail >= MAX_PER_EMAIL_PER_DAY) {
      return {
        status: 429,
        body: {
          ok: false,
          error:
            "Vous avez déjà envoyé plusieurs demandes aujourd'hui. Nous reviendrons vers vous : merci de patienter.",
        },
      };
    }

    const lastHour = await deps.countAllSince(hourAgo);
    if (lastHour >= MAX_PER_HOUR_GLOBAL) {
      return {
        status: 429,
        body: {
          ok: false,
          error: "Le service reçoit beaucoup de demandes. Merci de réessayer un peu plus tard.",
        },
      };
    }

    const { error } = await deps.insert(validation.row);
    if (error) {
      return {
        status: 500,
        body: { ok: false, error: "Votre demande n'a pas pu être enregistrée. Merci de réessayer." },
      };
    }

    return { status: 200, body: { ok: true } };
  } catch {
    return {
      status: 500,
      body: { ok: false, error: "Le service est momentanément indisponible. Merci de réessayer." },
    };
  }
}
