import Link from "next/link";
import PageJuridique, { Valeur } from "@/components/pme/PageJuridique";
import { EDITEUR, VERSION_CONDITIONS } from "@/lib/pme/editeur";

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
            "Votre entreprise : nom, activité, adresse, téléphone, e-mail, RCCM, logo, couleur et, le cas échéant, le code partenaire utilisé à l'inscription.",
            "Votre activité : opérations de caisse, catégories, projets, tâches et documents que vous créez.",
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
            "Vous seul. Chaque compte est isolé : un autre utilisateur ne peut pas voir vos données. Un partenaire (code partenaire) ne reçoit que des nombres globaux, jamais vos informations.",
            "Les données sont hébergées par des prestataires techniques sur des serveurs situés hors du Mali : Supabase (base de données et connexion) et Vercel (site web). Ils agissent pour notre compte et n'utilisent pas vos données pour eux-mêmes.",
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
