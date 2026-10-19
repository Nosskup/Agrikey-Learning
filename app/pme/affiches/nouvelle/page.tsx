import Link from "next/link";
import { redirect } from "next/navigation";
import { exigerEntreprise } from "@/lib/pme/session";
import { uuidValide } from "@/lib/pme/validation";
import type { Creation, TypeCreation } from "@/lib/pme/creations";
import { iaDisponible, photoDisponible } from "@/lib/pme/ia";
import { boutonSecondaire } from "@/components/pme/styles";
import { lireQuota } from "../quota";
import FormulaireCreation from "./FormulaireCreation";

export const metadata = { title: "Nouvelle création" };

// La création (dessin + photo) peut prendre plus d'une minute.
export const maxDuration = 300;

export default async function NouvelleCreationPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; depuis?: string }>;
}) {
  const { type, depuis } = await searchParams;
  const { supabase, entreprise } = await exigerEntreprise();

  const quota = await lireQuota(supabase);
  if (!iaDisponible() || !quota || quota.restantes <= 0) {
    redirect("/pme/affiches");
  }

  // « Modifier et recréer » : on repart de la demande d'une création précédente.
  let precedente: Creation | null = null;
  if (depuis && uuidValide(depuis)) {
    const { data } = await supabase
      .from("creations_ia")
      .select("id, type, format, titre, demande, statut, created_at")
      .eq("id", depuis)
      .maybeSingle<Creation>();
    precedente = data;
  }

  const typeInitial: TypeCreation = precedente?.type ?? (type === "logo" ? "logo" : "affiche");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-marine">Nouvelle création</h1>
        <p className="mt-1 text-base text-slate-600">
          Il vous reste {quota.restantes} création{quota.restantes > 1 ? "s" : ""} ce mois-ci.
        </p>
      </div>

      <FormulaireCreation
        typeInitial={typeInitial}
        formatInitial={precedente?.type === "affiche" ? precedente.format : "carre"}
        demande={precedente?.demande ?? null}
        nomEntreprise={entreprise.nom}
        aUnLogo={Boolean(entreprise.logo_url)}
        aUnTelephone={Boolean(entreprise.telephone || entreprise.adresse)}
        photoPossible={photoDisponible()}
      />

      <Link href="/pme/affiches" className={boutonSecondaire}>
        Annuler
      </Link>
    </div>
  );
}
