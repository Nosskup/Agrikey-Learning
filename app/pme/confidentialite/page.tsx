import Link from "next/link";
import PageJuridique, { Valeur } from "@/components/pme/PageJuridique";
import { EDITEUR, VERSION_CONDITIONS } from "@/lib/pme/editeur";
import { ABONNEMENTS_VISIBLES } from "@/lib/pme/formules";

export const metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <PageJuridique
      titre="Politique de confidentialité"
      version={VERSION_CONDITIONS}
      introduction="Cette page explique quelles données AGRIKEY PME enregistre, pourquoi, et comment vous gardez la main dessus."
      sections={[
        {
          titre: "Qui est responsable de vos données",
          paragraphes: [
            <>
              {EDITEUR.nom}, <Valeur texte={EDITEUR.adresse} />. Contact : <Valeur texte={EDITEUR.email} />.
            </>,
          ],
        },
        {
          titre: "Les données enregistrées",
          paragraphes: [
            "Votre compte : adresse e-mail et mot de passe (enregistré chiffré, personne ne peut le lire).",
            "Votre entreprise : nom, activité, adresse, téléphone, e-mail, RCCM, logo, couleur et, le code d'invitation utilisé à l'inscription et le statut de votre inscription (en attente, validée ou refusée).",
            "Votre activité : opérations de caisse, catégories, projets, tâches et documents que vous créez, domaines suivis et annonces enregistrées dans « Opportunités ».",
            "Vos affiches et logos IA : la description que vous écrivez et l'image obtenue, ainsi que le nombre de créations du mois.",
          ],
        },
        {
          titre: "Pourquoi",
          paragraphes: [
            "Uniquement pour faire fonctionner le service : afficher votre caisse et vos projets, remplir vos documents, vous permettre de vous reconnecter. Nous n'utilisons pas vos données pour de la publicité et ne les vendons pas.",
          ],
        },
        {
          titre: "Qui peut les voir",
          paragraphes: [
            "Votre caisse, vos projets et le contenu de vos documents : vous seul. Chaque compte est isolé, un autre utilisateur ne peut pas les voir.",
            "Pour suivre les partenariats, l'équipe AGRIKEY voit le nom, la ville et l'activité de votre entreprise, l'e-mail de votre compte (pour valider votre inscription), sa date d'inscription, le code d'invitation utilisé et si l'outil est utilisé (oui ou non, nombre de documents créés). Le partenaire dont vous avez utilisé le code peut recevoir ces mêmes informations, uniquement pour les entreprises inscrites avec son code.",
            "Les données sont hébergées par des prestataires techniques sur des serveurs situés hors du Mali : Supabase (base de données et connexion) et Vercel (site web). Ils agissent pour notre compte et n'utilisent pas vos données pour eux-mêmes.",
            "Quand vous créez une affiche ou un logo, votre description et les informations de votre entreprise choisies pour l'image (nom, activité, téléphone, adresse, couleur, logo) sont envoyées aux services d'intelligence artificielle d'Anthropic (Claude) et, si vous demandez une photo, d'OpenAI, aux États-Unis. Ils ne servent qu'à créer l'image. Votre caisse, vos projets et vos documents ne leur sont jamais envoyés.",
          ],
        },
        {
          titre: "Sécurité",
          paragraphes: [
            "Connexion chiffrée (HTTPS), mots de passe chiffrés, règles d'accès appliquées directement dans la base de données pour que chaque compte ne voie que ses propres informations.",
          ],
        },
        {
          titre: "Durée de conservation",
          paragraphes: [
            "Vos données sont conservées tant que votre compte est utilisé. Vous pouvez les supprimer vous-même à tout moment.",
            ...(ABONNEMENTS_VISIBLES
              ? [
                  "Exception : la trace de vos paiements d'abonnement (date, formule, montant, statut) est conservée pour la comptabilité, même après la suppression de vos autres données. Le paiement lui-même est traité par PayDunya : AGRIKEY ne voit jamais votre numéro de carte ni votre code mobile money.",
                ]
              : []),
          ],
        },
        {
          titre: "Vos droits",
          paragraphes: [
            <>
              Vous pouvez consulter, corriger, télécharger et supprimer vos données. Tout se fait dans{" "}
              <Link href="/pme/compte" className="font-semibold text-agri underline">Mon compte</Link> : « Télécharger mes
              données » et « Supprimer mes données ». Pour fermer complètement votre compte AGRIKEY, écrivez à{" "}
              <Valeur texte={EDITEUR.email} />.
            </>,
            "Vous pouvez aussi vous adresser à l'Autorité de Protection des Données à caractère Personnel (APDP) du Mali.",
          ],
        },
      ]}
    />
  );
}
