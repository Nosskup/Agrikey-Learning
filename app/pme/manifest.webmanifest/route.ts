// Manifeste de l'application installable AGRIKEY PME (limitée à l'espace /pme).
export function GET() {
  const manifeste = {
    id: "/pme",
    name: "AGRIKEY PME",
    short_name: "AGRIKEY PME",
    description: "Caisse, projets, devis, factures et reçus : gérez votre entreprise depuis votre téléphone.",
    lang: "fr",
    start_url: "/pme",
    scope: "/pme",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#0f2a44",
    categories: ["business", "finance", "productivity"],
    icons: [
      { src: "/pme/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pme/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pme/icone-masquable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Ajouter à la caisse", short_name: "Caisse", url: "/pme/caisse?ajouter=recu", icons: [{ src: "/pme/icone-192.png", sizes: "192x192" }] },
      { name: "Nouveau devis", short_name: "Devis", url: "/pme/documents/nouveau/devis", icons: [{ src: "/pme/icone-192.png", sizes: "192x192" }] },
    ],
  };

  return new Response(JSON.stringify(manifeste), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
