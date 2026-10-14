"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { utilisateurConnecte } from "@/lib/pme/session";
import {
  conditionsAcceptees,
  couleurValide,
  emailValide,
  lireCodePartenaire,
  lireTexte,
} from "@/lib/pme/validation";

const MESSAGE_CODE_INVALIDE = "Ce code partenaire n'est pas valide : lettres et chiffres uniquement, par exemple LIGUE.";
const MESSAGE_CONDITIONS = "Cochez la case pour accepter les conditions d'utilisation.";

export type EtatFormulaire = {
  erreur?: string;
  succes?: string;
};

// ---------------------------------------------------------------------
// Compte
// ---------------------------------------------------------------------

export async function inscrire(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const nomEntreprise = lireTexte(formData, "nom_entreprise");
  const email = lireTexte(formData, "email").toLowerCase();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");

  if (!nomEntreprise || nomEntreprise.length > 120) {
    return { erreur: "Écrivez le nom de votre entreprise." };
  }
  if (!emailValide(email)) {
    return { erreur: "Écrivez une adresse e-mail valide, par exemple nom@gmail.com." };
  }
  if (motDePasse.length < 6) {
    return { erreur: "Choisissez un mot de passe d'au moins 6 caractères." };
  }
  const codePartenaire = lireCodePartenaire(formData);
  if (codePartenaire === null) {
    return { erreur: MESSAGE_CODE_INVALIDE };
  }
  if (!conditionsAcceptees(formData)) {
    return { erreur: MESSAGE_CONDITIONS };
  }
  const accepteLe = new Date().toISOString();

  const supabase = await createSupabaseServerClient();
  const origine =
    (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const { data, error } = await supabase.auth.signUp({
    email,
    password: motDePasse,
    options: {
      data: { nom_entreprise: nomEntreprise, code_partenaire: codePartenaire, conditions_acceptees_le: accepteLe },
      emailRedirectTo: `${origine}/pme/auth/callback`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { erreur: "Cette adresse e-mail a déjà un compte. Connectez-vous." };
    }
    return { erreur: "Le compte n'a pas pu être créé. Réessayez dans un instant." };
  }

  if (!data.session) {
    return {
      succes:
        "Compte créé ! Ouvrez l'e-mail que nous venons de vous envoyer et cliquez sur le lien pour continuer.",
    };
  }

  await supabase.from("entreprises").insert({
    user_id: data.session.user.id,
    nom: nomEntreprise,
    code_partenaire: codePartenaire || null,
    conditions_acceptees_le: accepteLe,
  });

  redirect("/pme");
}

export async function connecter(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const email = lireTexte(formData, "email").toLowerCase();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");

  if (!email || !motDePasse) {
    return { erreur: "Écrivez votre adresse e-mail et votre mot de passe." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  });

  if (error) {
    if (error.message.toLowerCase().includes("not confirmed")) {
      return { erreur: "Confirmez d'abord votre adresse avec le lien reçu par e-mail." };
    }
    return { erreur: "E-mail ou mot de passe incorrect. Vérifiez et réessayez." };
  }

  redirect("/pme");
}

export async function deconnecter() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/pme/connexion");
}

// ---------------------------------------------------------------------
// Entreprise
// ---------------------------------------------------------------------

export async function creerEntreprise(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) {
    redirect("/pme/connexion");
  }

  const nom = lireTexte(formData, "nom");
  if (!nom || nom.length > 120) {
    return { erreur: "Écrivez le nom de votre entreprise." };
  }
  const codePartenaire = lireCodePartenaire(formData);
  if (codePartenaire === null) {
    return { erreur: MESSAGE_CODE_INVALIDE };
  }
  if (!conditionsAcceptees(formData)) {
    return { erreur: MESSAGE_CONDITIONS };
  }

  const { error } = await supabase.from("entreprises").insert({
    user_id: user.id,
    nom,
    code_partenaire: codePartenaire || null,
    conditions_acceptees_le: new Date().toISOString(),
  });

  // 23505 : l'entreprise existe déjà, on continue simplement.
  if (error && error.code !== "23505") {
    return { erreur: "L'enregistrement a échoué. Réessayez dans un instant." };
  }

  redirect("/pme");
}

const LIMITES_ENTREPRISE: Record<string, number> = {
  activite: 120,
  adresse: 200,
  ville: 80,
  telephone: 30,
  rccm: 60,
};

export async function enregistrerEntreprise(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) {
    redirect("/pme/connexion");
  }

  const nom = lireTexte(formData, "nom");
  if (!nom || nom.length > 120) {
    return { erreur: "Le nom de l'entreprise est obligatoire." };
  }

  const champs: Record<string, string | null> = { nom };

  for (const [champ, max] of Object.entries(LIMITES_ENTREPRISE)) {
    const valeur = lireTexte(formData, champ);
    if (valeur.length > max) {
      return { erreur: `Le champ « ${champ} » est trop long (${max} caractères maximum).` };
    }
    champs[champ] = valeur || null;
  }

  const email = lireTexte(formData, "email");
  if (email && !emailValide(email)) {
    return { erreur: "L'adresse e-mail n'est pas valide. Corrigez-la ou laissez-la vide." };
  }
  champs.email = email || null;

  const couleur = lireTexte(formData, "couleur") || "#16834b";
  if (!couleurValide(couleur)) {
    return { erreur: "Choisissez une couleur dans la palette." };
  }
  champs.couleur = couleur;

  // Le logo doit se trouver dans le dossier de l'utilisateur.
  const logoUrl = lireTexte(formData, "logo_url");
  const prefixeLogo = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos-entreprises/${user.id}/`;
  if (logoUrl && !logoUrl.startsWith(prefixeLogo)) {
    return { erreur: "Le logo n'a pas pu être enregistré. Choisissez l'image à nouveau." };
  }
  champs.logo_url = logoUrl || null;

  const { error } = await supabase
    .from("entreprises")
    .upsert({ user_id: user.id, ...champs }, { onConflict: "user_id" });

  if (error) {
    return { erreur: "L'enregistrement a échoué. Vérifiez votre connexion et réessayez." };
  }

  refresh();
  return { succes: "C'est enregistré." };
}

// ---------------------------------------------------------------------
// Affiches et logos IA : liste d'attente
// ---------------------------------------------------------------------

export async function rejoindreListeAttente(): Promise<EtatFormulaire> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user?.email) {
    redirect("/pme/connexion");
  }

  const { error } = await supabase
    .from("liste_attente_ia")
    .upsert({ user_id: user.id, email: user.email }, { onConflict: "user_id" });

  if (error) {
    return { erreur: "L'inscription a échoué. Réessayez dans un instant." };
  }

  return { succes: `C'est noté ! Nous vous écrirons à ${user.email}.` };
}

// ---------------------------------------------------------------------
// Mot de passe oublié
// ---------------------------------------------------------------------

export async function demanderReinitialisation(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const email = lireTexte(formData, "email").toLowerCase();
  if (!emailValide(email)) {
    return { erreur: "Écrivez une adresse e-mail valide, par exemple nom@gmail.com." };
  }

  const supabase = await createSupabaseServerClient();
  const origine =
    (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origine}/pme/auth/callback?suite=/pme/nouveau-mot-de-passe`,
  });

  if (error?.status === 429) {
    return { erreur: "Trop de demandes en peu de temps. Réessayez dans une heure." };
  }

  // Même message que le compte existe ou non, pour ne rien révéler.
  return {
    succes: `Si un compte existe pour ${email}, un e-mail vient d'être envoyé. Ouvrez-le et cliquez sur le lien (pensez à regarder dans les spams).`,
  };
}

export async function changerMotDePasse(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) {
    redirect("/pme/mot-de-passe-oublie");
  }

  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (motDePasse.length < 6) {
    return { erreur: "Choisissez un mot de passe d'au moins 6 caractères." };
  }
  if (motDePasse !== confirmation) {
    return { erreur: "Les deux mots de passe ne sont pas identiques. Retapez-les." };
  }

  const { error } = await supabase.auth.updateUser({ password: motDePasse });
  if (error) {
    return { erreur: "Le mot de passe n'a pas pu être changé. Demandez un nouveau lien et réessayez." };
  }

  redirect("/pme");
}
