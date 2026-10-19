import Link from "next/link";
import { exigerEntreprise } from "@/lib/pme/session";
import { dateLongue } from "@/lib/pme/format";
import { boutonPrincipal, boutonSecondaire, carte } from "@/components/pme/styles";
import Icone, { type NomIcone } from "@/components/pme/Icones";
import { verifierPaiement, type ResultatVerification } from "@/lib/pme/paydunya";

export const metadata = { title: "Paiement" };

const MESSAGES: Record<ResultatVerification, { icone: NomIcone; teinte: string; titre: string; texte: string }> = {
  paye: {
    icone: "verifie",
    teinte: "bg-green-50 text-agri",
    titre: "Paiement reçu, merci !",
    texte: "Votre abonnement Premium est actif.",
  },
  en_attente: {
    icone: "horloge",
    teinte: "bg-amber-50 text-amber-600",
    titre: "Paiement en cours de validation",
    texte: "Validez le paiement sur votre téléphone si ce n'est pas fait, puis actualisez cette page dans une minute.",
  },
  annule: {
    icone: "retour",
    teinte: "bg-slate-100 text-slate-500",
    titre: "Paiement annulé",
    texte: "Rien n'a été débité. Vous pouvez réessayer quand vous voulez.",
  },
  invalide: {
    icone: "retour",
    teinte: "bg-red-50 text-red-600",
    titre: "Paiement introuvable",
    texte: "Nous n'avons pas pu vérifier ce paiement. Si vous avez été débité, contactez AGRIKEY avec votre reçu PayDunya.",
  },
};

/** Page de retour après PayDunya : le paiement est revérifié auprès de PayDunya avant d'afficher quoi que ce soit. */
export default async function RetourPaiementPage({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>;
}) {
  const { token } = await searchParams;
  const { supabase } = await exigerEntreprise();

  const resultat = typeof token === "string" ? await verifierPaiement(token) : "invalide";
  const message = MESSAGES[resultat];

  const { data: abonnement } =
    resultat === "paye"
      ? await supabase.from("pme_abonnements").select("actif_jusqua").maybeSingle<{ actif_jusqua: string }>()
      : { data: null };

  return (
    <div className="space-y-5">
      <section className={`${carte} px-6 py-10 text-center`}>
        <span className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${message.teinte}`}>
          <Icone nom={message.icone} className="h-10 w-10" />
        </span>
        <h1 className="mt-5 text-2xl font-black text-marine">{message.titre}</h1>
        <p className="mt-2 text-base text-slate-600">
          {message.texte}
          {abonnement && <> Il est valable jusqu&apos;au {dateLongue(abonnement.actif_jusqua)}.</>}
        </p>
      </section>

      {resultat === "en_attente" ? (
        <Link href={`/pme/abonnement/retour?token=${encodeURIComponent(String(token))}`} className={boutonPrincipal}>
          Actualiser
        </Link>
      ) : (
        <Link href="/pme" className={boutonPrincipal}>
          Aller à l&apos;accueil
        </Link>
      )}
      <Link href="/pme/abonnement" className={boutonSecondaire}>
        Mon abonnement
      </Link>
    </div>
  );
}
