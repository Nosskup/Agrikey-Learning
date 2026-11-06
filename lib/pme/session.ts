import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type Entreprise = {
  id: string;
  user_id: string;
  nom: string;
  activite: string | null;
  adresse: string | null;
  ville: string | null;
  telephone: string | null;
  email: string | null;
  rccm: string | null;
  logo_url: string | null;
  couleur: string;
  statut: "en_attente" | "valide" | "refuse";
};

/** Accès du membre : période gratuite, abonnement payé, et s'il peut utiliser l'outil. */
export type Acces = {
  actif: boolean;
  finEssai: string | null;
  abonnementJusqua: string | null;
};

/** Jours entiers restants avant une date (0 si elle est passée). */
export function joursRestants(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

/** Accès du membre connecté, ou null si la base n'est pas encore à jour (on ne bloque alors personne). */
export async function lireAcces(supabase: ClientSupabase): Promise<Acces | null> {
  const { data, error } = await supabase.rpc("pme_mon_acces");
  const ligne = (data as { actif: boolean; fin_essai: string | null; abonnement_jusqua: string | null }[] | null)?.[0];
  if (error || !ligne) return null;
  return { actif: Boolean(ligne.actif), finEssai: ligne.fin_essai, abonnementJusqua: ligne.abonnement_jusqua };
}

/**
 * Exige un utilisateur connecté qui a déjà renseigné son entreprise.
 * Sinon, redirige vers la connexion ou vers la saisie du nom.
 * Sans période gratuite ni abonnement en cours, l'outil est bloqué : redirection vers
 * la page d'abonnement, sauf pour les pages qui restent ouvertes (`memeSansAcces`).
 */
export async function exigerEntreprise({ memeSansAcces = false }: { memeSansAcces?: boolean } = {}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/pme/connexion");
  }

  const { data: entreprise } = await supabase
    .from("entreprises")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<Entreprise>();

  if (!entreprise) {
    redirect("/pme/bienvenue");
  }

  // Inscription sur validation : rien n'est accessible avant l'accord d'un administrateur.
  // (Statut absent = base pas encore mise à jour : on laisse passer pour ne bloquer personne.)
  if (entreprise.statut && entreprise.statut !== "valide") {
    redirect("/pme/en-attente");
  }

  const acces = await lireAcces(supabase);
  if (acces && !acces.actif && !memeSansAcces) {
    redirect("/pme/abonnement?expire=1");
  }

  return { supabase, user, entreprise, acces };
}

/** Client Supabase et utilisateur connecté (null si déconnecté), pour les actions. */
export async function utilisateurConnecte() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export type Categorie = {
  id: string;
  nom: string;
  type: "recu" | "depense" | "tous";
};

export type Operation = {
  id: string;
  type: "recu" | "depense";
  montant: number;
  categorie_id: string | null;
  note: string | null;
  date: string;
};

export type Projet = {
  id: string;
  nom: string;
  description: string | null;
  date_debut: string | null;
  date_fin: string | null;
};

export type StatutTache = "a_faire" | "en_cours" | "termine";

export type Tache = {
  id: string;
  projet_id: string;
  titre: string;
  responsable: string | null;
  echeance: string | null;
  statut: StatutTache;
};

type ClientSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** Vrai si le compte a le rôle « admin » dans la table profiles d'AGRIKEY Learning. */
export async function estAdmin(supabase: ClientSupabase, userId: string): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("role").eq("user_id", userId).maybeSingle();
  return data?.role === "admin";
}

/**
 * Modèles de documents autorisés pour l'utilisateur connecté (liste du membre,
 * sinon de son code). null = tous les modèles.
 */
export async function modelesAutorises(supabase: ClientSupabase): Promise<string[] | null> {
  const { data, error } = await supabase.rpc("pme_mes_modeles");
  // Base pas encore mise à jour ou aucune restriction : tous les modèles.
  if (error || data == null) return null;
  const liste = data as string[];
  return liste.includes("*") ? null : liste;
}

/** Vrai si l'utilisateur connecté a un abonnement Premium en cours (faux si la base n'est pas encore à jour). */
export async function estPremium(supabase: ClientSupabase): Promise<boolean> {
  const { data, error } = await supabase.rpc("pme_est_premium");
  return !error && data === true;
}
