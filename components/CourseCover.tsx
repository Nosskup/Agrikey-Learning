type CourseCoverProps = {
  courseId: number;
  title: string;
  imageUrl?: string | null;
};

/**
 * Images des formations créées avant ce composant.
 * Toute nouvelle formation reçoit automatiquement une couverture
 * aux couleurs de la marque (voir plus bas), sans rien à ajouter ici.
 *
 * À terme, ces images pourront être remplacées par une colonne
 * image_url dans la table courses (le composant l'accepte déjà
 * via la propriété imageUrl).
 */
const KNOWN_COVERS: Record<number, string> = {
  1: "/images/gestion-financiere.png?v=1",
  2: "/images/gestion-entreprise.png?v=1",
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
}: CourseCoverProps) {
  const src = imageUrl || KNOWN_COVERS[courseId];

  if (src) {
    return (
      <img
        src={src}
        alt={`Couverture de la formation ${title}`}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
    );
  }

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
