import Link from "next/link";
import { exigerEntreprise } from "@/lib/pme/session";
import { boutonSecondaire } from "@/components/pme/styles";

export const metadata = { title: "Ajouter" };

export default async function AjouterPage() {
  await exigerEntreprise();

  const choix = [
    { href: "/pme/caisse?ajouter=recu", icone: "⬇️", titre: "Argent reçu", couleur: "border-green-300 bg-green-50 text-agri-fonce" },
    { href: "/pme/caisse?ajouter=depense", icone: "⬆️", titre: "Argent dépensé", couleur: "border-red-200 bg-red-50 text-red-700" },
    { href: "/pme/projets?ajouter=tache", icone: "✅", titre: "Une tâche", couleur: "border-slate-200 bg-white text-marine" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-marine">Que voulez-vous ajouter ?</h1>

      <div className="space-y-4">
        {choix.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`flex min-h-20 items-center gap-4 rounded-2xl border-2 px-5 text-2xl font-black ${c.couleur}`}
          >
            <span aria-hidden="true">{c.icone}</span> {c.titre}
          </Link>
        ))}
      </div>

      <Link href="/pme" className={boutonSecondaire}>
        Annuler
      </Link>
    </div>
  );
}
