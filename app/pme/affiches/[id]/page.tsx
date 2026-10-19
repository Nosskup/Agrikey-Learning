import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerEntreprise } from "@/lib/pme/session";
import { uuidValide } from "@/lib/pme/validation";
import { trouverFormat, type Creation } from "@/lib/pme/creations";
import { boutonSecondaire } from "@/components/pme/styles";
import BoutonSupprimer from "@/components/pme/BoutonSupprimer";
import { supprimerCreation } from "../actions";
import ActionsCreation from "./ActionsCreation";

export const metadata = { title: "Ma création" };

export default async function CreationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ photo?: string }>;
}) {
  const { id } = await params;
  const { photo } = await searchParams;
  if (!uuidValide(id)) notFound();

  const { supabase, user } = await exigerEntreprise();
  const { data: creation } = await supabase
    .from("creations_ia")
    .select("id, type, format, titre, demande, statut, created_at")
    .eq("id", id)
    .eq("statut", "pret")
    .maybeSingle<Creation>();
  if (!creation) notFound();

  const format = trouverFormat(creation.type, creation.format);
  if (!format) notFound();
  const url = `/pme/affiches/${creation.id}/image`;
  const estLogo = creation.type === "logo";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-base text-slate-600">{estLogo ? "Logo" : `Affiche · ${format.libelle}`}</p>
        <h1 className="text-2xl font-black break-words text-marine">{creation.titre}</h1>
      </div>

      {photo === "absente" && (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-900">
          La photo de fond n&apos;a pas pu être créée cette fois : l&apos;affiche a été composée sans photo.
        </p>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element -- image privée servie par notre route */}
      <img
        src={url}
        alt={creation.titre ?? "Création"}
        width={format.largeur}
        height={format.hauteur}
        className={`mx-auto h-auto w-full rounded-2xl border border-slate-200 bg-white shadow-sm ${estLogo ? "max-w-sm" : ""}`}
      />

      <ActionsCreation
        url={url}
        titre={creation.titre ?? "creation"}
        largeur={format.largeur}
        hauteur={format.hauteur}
        estLogo={estLogo}
        userId={user.id}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={`/pme/affiches/nouvelle?depuis=${creation.id}`} className={boutonSecondaire}>
          🔁 Modifier et recréer
        </Link>
        <Link href="/pme/affiches" className={boutonSecondaire}>
          ← Toutes mes créations
        </Link>
      </div>

      <BoutonSupprimer
        action={supprimerCreation.bind(null, creation.id)}
        question="Supprimer cette création ? Elle ne sera pas recréditée."
        className="w-full"
      />
    </div>
  );
}
