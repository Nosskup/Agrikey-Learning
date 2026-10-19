import Link from "next/link";
import PageJuridique, { Valeur } from "@/components/pme/PageJuridique";
import { EDITEUR, VERSION_CONDITIONS } from "@/lib/pme/editeur";

export const metadata = { title: "Conditions d'utilisation" };

export default function ConditionsPage() {
  return (
    <PageJuridique
      titre="Conditions d'utilisation"
      version={VERSION_CONDITIONS}
      introduction="Ces conditions expliquent simplement comment utiliser AGRIKEY PME. En créant un compte, vous les acceptez."
      sections={[
        {
          titre: "Le service",
          paragraphes: [
            <>
              AGRIKEY PME est un outil de gestion en ligne pour les petites entreprises : caisse, projets et
              documents (devis, factures, reçus, lettres). Il est édité par {EDITEUR.nom}, <Valeur texte={EDITEUR.formeJuridique} />,
              RCCM <Valeur texte={EDITEUR.rccm} />, <Valeur texte={EDITEUR.adresse} />.
            </>,
          ],
        },
        {
          titre: "Prix",
          paragraphes: [
            "L'offre de base est gratuite. Des fonctions avancées pourront devenir payantes : leur prix sera affiché clairement avant tout paiement, et vous resterez libre de ne pas les prendre.",
          ],
        },
        {
          titre: "Votre compte",
          paragraphes: [
            "AGRIKEY PME est réservé aux membres des organisations partenaires : l'inscription demande un code d'invitation, puis la validation de votre compte par l'équipe AGRIKEY. Une inscription peut être refusée ou suspendue si elle ne correspond pas à un membre d'une organisation partenaire.",
            "Vous donnez des informations exactes et gardez votre mot de passe secret. Vous êtes responsable de ce qui est fait avec votre compte. Si vous pensez qu'une autre personne l'utilise, changez votre mot de passe et prévenez-nous.",
          ],
        },
        {
          titre: "Vos données vous appartiennent",
          paragraphes: [
            <>
              Les informations que vous saisissez (caisse, projets, documents, logo) restent votre propriété. Nous ne les
              vendons pas et ne les montrons à personne. Vous pouvez les télécharger ou les supprimer à tout moment dans{" "}
              <Link href="/pme/compte" className="font-semibold text-agri underline">Mon compte</Link>. Les détails sont dans la{" "}
              <Link href="/pme/confidentialite" className="font-semibold text-agri underline">politique de confidentialité</Link>.
            </>,
          ],
        },
        {
          titre: "Les documents produits",
          paragraphes: [
            "Les devis, factures, reçus et lettres sont des modèles pratiques. Vous vérifiez leur contenu avant de les utiliser et restez responsable de ce que vous envoyez. Ils ne remplacent pas une comptabilité complète ni les obligations fiscales de votre entreprise.",
          ],
        },
        {
          titre: "Affiches et logos créés par l'IA",
          paragraphes: [
            "Les affiches et logos sont créés automatiquement par une intelligence artificielle à partir de votre description. Relisez toujours les textes, prix et dates avant de publier : vous êtes responsable de ce que vous diffusez. Vous pouvez utiliser librement vos créations pour votre entreprise. Un logo créé par l'IA peut ressembler à d'autres logos : vérifiez-le avant de le déposer comme marque.",
            "Le nombre de créations par mois est limité. Une création qui échoue n'est pas décomptée.",
            "Il est interdit de demander des images trompeuses, offensantes, contraires à la loi, ou qui imitent la marque ou le visage d'une autre personne sans son accord.",
          ],
        },
        {
          titre: "Disponibilité du service",
          paragraphes: [
            "Nous faisons de notre mieux pour que le service fonctionne sans interruption et que vos données soient protégées. Une panne reste possible : pensez à télécharger régulièrement votre journal de caisse et vos documents importants.",
          ],
        },
        {
          titre: "Ce qui est interdit",
          paragraphes: [
            "Utiliser le service pour des activités illégales, produire de faux documents, tenter d'accéder aux données d'autres utilisateurs ou perturber le fonctionnement du service. Un compte qui ne respecte pas ces règles peut être suspendu.",
          ],
        },
        {
          titre: "Partenaires",
          paragraphes: [
            "Pour suivre les partenariats, l'équipe AGRIKEY voit le nom, la ville et l'activité de votre entreprise, l'e-mail de votre compte, sa date d'inscription et si elle utilise l'outil. Si vous vous inscrivez avec un code partenaire (par exemple celui d'une association), ce partenaire peut recevoir ces mêmes informations pour les entreprises inscrites avec son code. Personne d'autre que vous ne voit votre caisse, vos projets ni le contenu de vos documents.",
          ],
        },
        {
          titre: "Changements et contact",
          paragraphes: [
            <>
              Ces conditions peuvent évoluer ; la date de version en haut de page indique la dernière mise à jour. Pour
              toute question : <Valeur texte={EDITEUR.email} />, <Valeur texte={EDITEUR.telephone} />. Ces conditions sont
              soumises au droit malien.
            </>,
          ],
        },
      ]}
    />
  );
}
