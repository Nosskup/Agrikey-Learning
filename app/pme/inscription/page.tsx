import FormulaireInscription from "./FormulaireInscription";

export const metadata = { title: "Créer un compte" };

// Lien à partager par un partenaire : /pme/inscription?code=LIGUE
export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>;
}) {
  const { code } = await searchParams;
  const codeInitial =
    typeof code === "string" && /^[A-Za-z0-9-]{2,20}$/.test(code) ? code.toUpperCase() : "";

  return <FormulaireInscription codeInitial={codeInitial} />;
}
