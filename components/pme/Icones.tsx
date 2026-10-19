// Icônes au trait d'AGRIKEY PME, dessinées en SVG (aucune bibliothèque, aucun téléchargement).
// Elles prennent la couleur du texte (currentColor) : className="h-6 w-6 text-agri".

const CHEMINS = {
  accueil: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  caisse: "M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M3 7h16a1 1 0 0 1 1 1v3m0 0h-4a2 2 0 0 0 0 4h4m0-4v4",
  projets: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
  documents: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4",
  entreprise: "M4 9h16l-1.5-5h-13zM4 9v1a2.67 2.67 0 0 0 5.33 0 2.67 2.67 0 0 0 5.34 0A2.67 2.67 0 0 0 20 10V9M5 12.5V20h14v-7.5M10 20v-4h4v4",
  opportunites: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.35-4.35M11 8v6M8 11h6",
  emploi: "M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 13h18M11 13v2h2v-2",
  appel: "M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1zM16 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12",
  actualite: "M5 4h11a1 1 0 0 1 1 1v14a1 1 0 0 0 1 1H6a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1zM17 8h2a1 1 0 0 1 1 1v10a1 1 0 0 1-2 0M8 8h5M8 12h5M8 16h3",
  etoile: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  horloge: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  calendrier: "M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 10h16M8 3v4M16 3v4",
  fleche: "M9 6l6 6-6 6",
  retour: "M15 6l-6 6 6 6",
  externe: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  reglages: "M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4",
  plus: "M12 5v14M5 12h14",
  compte: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z",
  palette: "M12 3a9 9 0 0 0 0 18c1 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1 0-.8.7-1.4 1.5-1.4H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8zM7.5 12.5h.01M9.5 8h.01M14.5 8h.01M17 12h.01",
  recu: "M12 4v12M6 10l6 6 6-6M5 20h14",
  depense: "M12 20V8M6 14l6-6 6 6M5 4h14",
  tache: "M9 12l2 2 4-4M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z",
  verifie: "M5 12.5l4.5 4.5L19 7.5",
} as const;

export type NomIcone = keyof typeof CHEMINS;

export default function Icone({
  nom,
  className = "h-6 w-6",
  plein = false,
}: {
  nom: NomIcone;
  className?: string;
  /** Icône remplie (étoile d'une annonce enregistrée, par exemple). */
  plein?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={plein ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={CHEMINS[nom]} />
    </svg>
  );
}
