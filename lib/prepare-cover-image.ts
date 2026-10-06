/**
 * Préparation d'une photo de couverture avant son envoi.
 *
 * Les photos de téléphone font souvent 3 à 8 Mo et 4000 pixels de large : trop lourdes
 * pour s'afficher vite, et parfois refusées par la limite de 5 Mo. On les ramène à
 * 1600 pixels de large au plus, en JPEG, directement dans le navigateur.
 * Une petite image déjà légère est conservée telle quelle (aucune perte de qualité).
 */

export const COVER_MAX_WIDTH = 1600;
export const COVER_KEEP_UNDER_BYTES = 400 * 1024;

/** Dimensions après réduction : jamais plus large que `maxWidth`, proportions conservées. */
export function computeCoverSize(
  width: number,
  height: number,
  maxWidth: number = COVER_MAX_WIDTH
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width, height };
  }

  if (width <= maxWidth) {
    return { width, height };
  }

  const ratio = maxWidth / width;

  return {
    width: maxWidth,
    height: Math.max(1, Math.round(height * ratio)),
  };
}

/** Renvoie le fichier à envoyer : la photo réduite, ou l'originale si rien ne s'y oppose. */
export async function prepareCoverImage(file: File): Promise<File> {
  // On ne touche ni aux non-images, ni aux formats qu'on ne doit pas rasteriser.
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const target = computeCoverSize(bitmap.width, bitmap.height);

    const alreadySmall =
      target.width === bitmap.width && file.size <= COVER_KEEP_UNDER_BYTES;

    if (alreadySmall) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;

    const context = canvas.getContext("2d");

    if (!context) {
      bitmap.close();
      return file;
    }

    // Fond blanc : un PNG transparent ne doit pas devenir noir en JPEG.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, target.width, target.height);
    context.drawImage(bitmap, 0, 0, target.width, target.height);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );

    if (!blob) {
      return file;
    }

    // Si le résultat n'est pas plus léger et que la taille n'a pas changé, on garde l'original.
    if (blob.size >= file.size && target.width === bitmap.width) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "couverture";

    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    // Format non lisible par le navigateur : on laisse les contrôles habituels décider.
    return file;
  }
}
