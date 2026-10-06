"use client";

import { useState } from "react";
import { coverSource } from "../lib/course-cover";

type CourseCoverProps = {
  courseId: number;
  title: string;
  imageUrl?: string | null;
  /**
   * Le composant fournit lui-même un cadre 16:9.
   * À utiliser quand la page ne prévoit pas de cadre à hauteur fixe autour.
   * Sans cette option, le composant remplit le cadre de la page (h-full).
   */
  framed?: boolean;
  /** Image visible dès l'ouverture de la page : chargée sans attendre. */
  priority?: boolean;
};

const GRADIENTS = [
  "from-green-800 via-green-700 to-emerald-500",
  "from-emerald-800 via-emerald-700 to-teal-500",
  "from-teal-800 via-teal-700 to-green-500",
  "from-lime-700 via-green-700 to-emerald-600",
  "from-slate-800 via-green-800 to-green-600",
];

export default function CourseCover({
  courseId,
  title,
  imageUrl,
  framed = false,
  priority = false,
}: CourseCoverProps) {
  const src = coverSource(courseId, imageUrl);

  // Si l'image ne se charge pas (lien cassé, fichier supprimé), on montre
  // le visuel de marque au lieu d'une icône d'image brisée.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const showImage = src !== null && failedSrc !== src;

  const content = showImage ? (
    <img
      src={src}
      alt={`Couverture de la formation ${title}`}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailedSrc(src)}
      className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
    />
  ) : (
    <BrandCover courseId={courseId} title={title} />
  );

  if (framed) {
    return (
      <div className="relative aspect-video w-full overflow-hidden bg-slate-200">
        <div className="absolute inset-0">{content}</div>
      </div>
    );
  }

  return content;
}

function BrandCover({
  courseId,
  title,
}: {
  courseId: number;
  title: string;
}) {
  const gradient = GRADIENTS[Math.abs(courseId) % GRADIENTS.length];

  return (
    <div
      role="img"
      aria-label={`Couverture de la formation ${title}`}
      className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${gradient}`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border-[24px] border-white/10" />

      <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full border-[24px] border-white/10" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur transition duration-500 group-hover:scale-110">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8"
            aria-hidden="true"
          >
            <path d="M12 21v-6" />
            <path d="M12 13c0-4 3-7 8-7 0 4-3 7-8 7Z" />
            <path d="M12 15c0-3-2.5-5.5-7-5.5 0 3.5 2.5 5.5 7 5.5Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
