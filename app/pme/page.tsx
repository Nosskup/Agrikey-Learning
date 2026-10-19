import Link from "next/link";
import { estPremium, exigerEntreprise, utilisateurConnecte } from "@/lib/pme/session";
import Presentation from "./Presentation";
import BoutonInstallation from "@/components/pme/Installation";
import { bornesDuMois, formatFCFA, nomDuMois } from "@/lib/pme/format";
import Icone, { type NomIcone } from "@/components/pme/Icones";
import { carte } from "@/components/pme/styles";
import { iaDisponible } from "@/lib/pme/ia";

export const metadata = { title: { absolute: "AGRIKEY PME — Gérez votre entreprise simplement" } };

type Service = {
  href: string;
  icone: NomIcone;
  titre: string;
  info: string;
  teinte: string;
};

export default async function TableauDeBord() {
  // Visiteur non connecté (lien de démonstration) : page de présentation.
  const { user } = await utilisateurConnecte();
  if (!user) return <Presentation />;

  const { supabase, entreprise } = await exigerEntreprise();
  const { debut, fin } = bornesDuMois();

  const [operations, tachesAFaire, documents, premium] = await Promise.all([
    supabase
      .from("operations_caisse")
      .select("type, montant")
      .gte("date", debut)
      .lte("date", fin),
    supabase
      .from("taches")
      .select("id", { count: "exact", head: true })
      .neq("statut", "termine"),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true }),
    estPremium(supabase),
  ]);

  const solde = (operations.data ?? []).reduce(
    (total, op) => total + (op.type === "recu" ? op.montant : -op.montant),
    0
  );
  const nbTaches = tachesAFaire.count ?? 0;
  const nbDocuments = documents.count ?? 0;

  const services: Service[] = [
    {
      href: "/pme/caisse",
      icone: "caisse",
      titre: "Caisse",
      info: "Reçus et dépenses",
      teinte: "bg-green-50 text-agri",
    },
    {
      href: "/pme/projets",
      icone: "projets",
      titre: "Projets",
      info: nbTaches === 0 ? "Aucune tâche à faire" : `${nbTaches} tâche${nbTaches > 1 ? "s" : ""} à faire`,
      teinte: "bg-sky-50 text-sky-700",
    },
    {
      href: "/pme/documents",
      icone: "documents",
      titre: "Documents",
      info:
        nbDocuments === 0
          ? "Devis, factures…"
          : `${nbDocuments} document${nbDocuments > 1 ? "s" : ""}`,
      teinte: "bg-amber-50 text-amber-700",
    },
    {
      href: "/pme/opportunites",
      icone: "opportunites",
      titre: "Opportunités",
      info: "Emplois, marchés, actualités",
      teinte: "bg-violet-50 text-violet-700",
    },
    ...(iaDisponible()
      ? [
          {
            href: "/pme/affiches",
            icone: "palette" as const,
            titre: "Affiches et logos IA",
            info: "Prêts pour WhatsApp",
            teinte: "bg-pink-50 text-pink-700",
          },
        ]
      : []),
    {
      href: "/pme/entreprise",
      icone: "entreprise",
      titre: "Mon entreprise",
      info: "Logo, coordonnées",
      teinte: "bg-teal-50 text-teal-700",
    },
  ];

  const raccourcis: { href: string; icone: NomIcone; libelle: string }[] = [
    { href: "/pme/caisse?ajouter=recu", icone: "recu", libelle: "Argent reçu" },
    { href: "/pme/caisse?ajouter=depense", icone: "depense", libelle: "Dépense" },
    { href: "/pme/projets?ajouter=tache", icone: "tache", libelle: "Tâche" },
    { href: "/pme/documents", icone: "documents", libelle: "Document" },
  ];

  return (
    <div className="space-y-6">
      {/* Carte d'accueil : solde du mois et raccourcis */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-marine via-marine-clair to-agri-fonce p-5 text-white shadow-xl shadow-marine/20">
        <div aria-hidden="true" className="absolute -top-16 -right-12 h-48 w-48 rounded-full bg-white/10" />
        <div aria-hidden="true" className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-agri/30" />

        <div className="relative">
          <p className="flex items-center justify-between text-base text-slate-200">
            Bonjour,
            {premium && (
              <Link href="/pme/abonnement" className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-black text-amber-950">
                PREMIUM
              </Link>
            )}
          </p>
          <h1 className="text-2xl leading-tight font-black">{entreprise.nom}</h1>

          <Link href="/pme/caisse" className="mt-5 block rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur hover:bg-white/15">
            <span className="block text-sm font-semibold text-slate-200">Solde de {nomDuMois()}</span>
            <span className={`mt-1 block text-3xl font-black tracking-tight ${solde < 0 ? "text-red-200" : ""}`}>
              {formatFCFA(solde)}
            </span>
          </Link>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {raccourcis.map((r) => (
              <Link key={r.href} href={r.href} className="flex flex-col items-center gap-1.5 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-marine shadow-md active:scale-95">
                  <Icone nom={r.icone} className="h-6 w-6" />
                </span>
                <span className="text-xs leading-tight font-semibold text-slate-100">{r.libelle}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <BoutonInstallation />

      {!premium && (
        <Link
          href="/pme/abonnement"
          className={`${carte} flex items-center gap-4 p-4 hover:border-amber-200 active:scale-[0.99]`}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
            <Icone nom="etoile" plein className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-black text-marine">Passez à Premium</span>
            <span className="block text-sm text-slate-500">À partir de 2 500 FCFA par mois, par Orange Money ou Moov</span>
          </span>
          <Icone nom="fleche" className="h-5 w-5 shrink-0 text-slate-400" />
        </Link>
      )}

      {/* Services */}
      <section>
        <h2 className="mb-3 px-1 text-lg font-black text-marine">Mes services</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className={`${carte} flex min-h-32 flex-col justify-between gap-3 p-4 hover:border-green-200 active:scale-[0.98]`}
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${service.teinte}`}>
                <Icone nom={service.icone} className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-base font-black text-marine">{service.titre}</span>
                <span className="block text-sm text-slate-500">{service.info}</span>
              </span>
            </Link>
          ))}

          {!iaDisponible() && (
          <Link
            href="/pme/affiches"
            className="flex min-h-32 flex-col justify-between gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-500"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
              <Icone nom="palette" className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-base font-black">Affiches et logos IA</span>
              <span className="mt-1 inline-block rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                Bientôt
              </span>
            </span>
          </Link>
          )}
        </div>
      </section>
    </div>
  );
}
