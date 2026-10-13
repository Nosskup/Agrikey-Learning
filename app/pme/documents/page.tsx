import Link from "next/link";
import { exigerEntreprise } from "@/lib/pme/session";
import { MODELES } from "@/lib/pme/modeles";

export const metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const { supabase } = await exigerEntreprise();

  const { data: historique } = await supabase
    .from("documents")
    .select("id, titre, modele_code, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const icones = new Map(MODELES.map((m) => [m.code, m.icone]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-black text-marine">📄 Documents</h1>
        <Link href="/pme" className="min-h-12 content-center text-base font-semibold text-slate-600 underline">
          Accueil
        </Link>
      </div>

      <p className="text-base text-slate-600">
        Choisissez un modèle, remplissez le formulaire : votre logo et vos coordonnées sont ajoutés automatiquement.
      </p>

      <section className="grid gap-3 sm:grid-cols-2">
        {MODELES.map((m) => (
          <Link
            key={m.code}
            href={`/pme/documents/nouveau/${m.code}`}
            className="flex min-h-20 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:border-agri active:bg-green-50"
          >
            <span aria-hidden="true" className="text-3xl">
              {m.icone}
            </span>
            <span>
              <span className="block text-lg font-black text-marine">{m.titre}</span>
              <span className="block text-base text-slate-600">{m.description}</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black text-marine">Mes documents</h2>
        {!historique?.length ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-base text-slate-600">
            Les documents que vous créez apparaîtront ici.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {historique.map((d) => (
              <li key={d.id}>
                <Link href={`/pme/documents/${d.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <span aria-hidden="true" className="text-2xl">
                    {icones.get(d.modele_code) ?? "📄"}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-base font-semibold text-slate-900">{d.titre}</span>
                    <span className="block text-base text-slate-500">
                      {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
