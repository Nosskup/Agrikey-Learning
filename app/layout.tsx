import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";

// Adresse publique du site : à définir dans NEXT_PUBLIC_SITE_URL quand le
// site aura son propre nom de domaine. Sert à construire le lien absolu de
// l'image affichée lors d'un partage (WhatsApp, LinkedIn, Facebook...).
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://agrikey-learning.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AGRIKEY Learning — Formation professionnelle en ligne",
    template: "%s | AGRIKEY Learning",
  },
  description:
    "Plateforme malienne de formation en ligne : des parcours pratiques pour les jeunes, les entrepreneurs, les professionnels et les organisations.",
  openGraph: {
    type: "website",
    siteName: "AGRIKEY Learning",
    title: "AGRIKEY Learning — Formation professionnelle en ligne",
    description:
      "Transformer l'expertise en compétences accessibles. Formations pratiques, quiz et certificats vérifiables.",
    images: [
      {
        url: "/images/og-agrikey.png",
        width: 1200,
        height: 630,
        alt: "AGRIKEY Learning",
      },
    ],
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "AGRIKEY Learning",
    description: "Transformer l'expertise en compétences accessibles.",
    images: ["/images/og-agrikey.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}