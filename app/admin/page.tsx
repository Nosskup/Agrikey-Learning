"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";
import { prepareCoverImage } from "@/lib/prepare-cover-image";

type Course = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  level: string | null;
  price: number;
  duration: string | null;
  published: boolean;
  is_free: boolean;
  image_url: string | null;
  objectives: string | null;
  audience: string | null;
  prerequisites: string | null;
  instructor_name: string | null;
  instructor_bio: string | null;
};

type DeletePreview = {
  title: string;
  modules: number;
  lessons: number;
  quizzes: number;
  questions: number;
  learners: number;
  quiz_attempts: number;
  certificates: number;
  payments_kept: number;
  payments_pending: number;
  blocked: boolean;
  reasons: string[];
};

type CourseStats = {
  modules: number;
  lessons: number;
  learners: number;
};

export default function AdminPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Record<number, CourseStats>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [newPartnerRequests, setNewPartnerRequests] = useState(0);

  // Suppression définitive d'une formation
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deletePreview, setDeletePreview] = useState<DeletePreview | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [editingCourseId, setEditingCourseId] = useState<
    number | null
  >(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("Débutant");
  const [price, setPrice] = useState("0");
  const [duration, setDuration] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [published, setPublished] = useState(false);
  const [objectives, setObjectives] = useState("");
  const [audience, setAudience] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [instructorBio, setInstructorBio] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    null
  );
  const [existingImageUrl, setExistingImageUrl] = useState<
    string | null
  >(null);

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Vous devez être connecté.");
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profileError || profile?.role !== "admin") {
      throw new Error("Accès réservé aux administrateurs.");
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      await checkAdmin();

      const { data: courseData, error: courseError } =
        await supabase
          .from("courses")
          .select(
            "id, title, description, category, level, price, duration, published, is_free, image_url, objectives, audience, prerequisites, instructor_name, instructor_bio"
          )
          .order("id", { ascending: false });

      if (courseError) {
        throw courseError;
      }

      const loadedCourses = courseData || [];
      setCourses(loadedCourses);

      const newStats: Record<number, CourseStats> = {};

      for (const course of loadedCourses) {
        const { data: moduleData, error: moduleError } =
          await supabase
            .from("modules")
            .select("id")
            .eq("course_id", course.id);

        if (moduleError) {
          throw moduleError;
        }

        const moduleIds =
          moduleData?.map((module) => module.id) || [];

        let lessonCount = 0;

        if (moduleIds.length > 0) {
          const { count, error: lessonError } =
            await supabase
              .from("lessons")
              .select("id", {
                count: "exact",
                head: true,
              })
              .in("module_id", moduleIds);

          if (lessonError) {
            throw lessonError;
          }

          lessonCount = count || 0;
        }

        const { count: learnerCount, error: learnerError } =
          await supabase
            .from("enrollments")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("course_id", course.id);

        if (learnerError) {
          throw learnerError;
        }

        newStats[course.id] = {
          modules: moduleIds.length,
          lessons: lessonCount,
          learners: learnerCount || 0,
        };
      }

      setStats(newStats);

      // Nouvelles demandes de partenariat (sans bloquer la page si la table n'existe pas encore).
      const { count: newRequests } = await supabase
        .from("partner_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "new");

      setNewPartnerRequests(newRequests || 0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetCourseForm() {
    setEditingCourseId(null);
    setTitle("");
    setDescription("");
    setCategory("");
    setLevel("Débutant");
    setPrice("0");
    setDuration("");
    setIsFree(true);
    setPublished(false);
    setObjectives("");
    setAudience("");
    setPrerequisites("");
    setInstructorName("");
    setInstructorBio("");
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
  }

  function startEditingCourse(course: Course) {
    setEditingCourseId(course.id);
    setTitle(course.title);
    setDescription(course.description || "");
    setCategory(course.category || "");
    setLevel(course.level || "Débutant");
    setPrice(String(course.price ?? 0));
    setDuration(course.duration || "");
    setIsFree(course.is_free);
    setPublished(course.published);
    setObjectives(course.objectives || "");
    setAudience(course.audience || "");
    setPrerequisites(course.prerequisites || "");
    setInstructorName(course.instructor_name || "");
    setInstructorBio(course.instructor_bio || "");
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(course.image_url || null);

    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
  }

  async function handleImageChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const original = e.target.files?.[0] || null;

    if (!original) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    try {
      setImageBusy(true);

      // Réduit la photo (1600 px de large au plus) pour qu'elle s'affiche vite
      // et passe toujours la limite de poids.
      const prepared = await prepareCoverImage(original);

      setImageFile(prepared);
      setImagePreview(URL.createObjectURL(prepared));
    } finally {
      setImageBusy(false);
    }
  }

  async function uploadCourseImage(
    courseId: number
  ): Promise<string | null> {
    if (!imageFile) {
      return existingImageUrl || null;
    }

    if (!imageFile.type.startsWith("image/")) {
      throw new Error("Le fichier doit être une image.");
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      throw new Error("L'image ne doit pas dépasser 5 Mo.");
    }

    const extension =
      imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const filePath = `${courseId}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("course-covers")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("course-covers")
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async function saveCourse() {
    if (!title.trim()) {
      setError("Le titre de la formation est obligatoire.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (editingCourseId) {
        const uploadedImageUrl = await uploadCourseImage(
          editingCourseId
        );

        const { data, error: updateError } = await supabase
          .from("courses")
          .update({
            title: title.trim(),
            description: description.trim() || null,
            category: category.trim() || null,
            level: level.trim() || "Débutant",
            price: isFree ? 0 : Number(price) || 0,
            duration: duration.trim() || null,
            is_free: isFree,
            published,
            image_url: uploadedImageUrl,
            objectives: objectives.trim() || null,
            audience: audience.trim() || null,
            prerequisites: prerequisites.trim() || null,
            instructor_name: instructorName.trim() || null,
            instructor_bio: instructorBio.trim() || null,
          })
          .eq("id", editingCourseId)
          .select(
            "id, title, description, category, level, price, duration, published, is_free, image_url, objectives, audience, prerequisites, instructor_name, instructor_bio"
          )
          .single();

        if (updateError) {
          throw updateError;
        }

        setCourses(
          courses.map((c) => (c.id === editingCourseId ? data : c))
        );

        setMessage("Formation modifiée avec succès.");
      } else {
        const { data, error: insertError } = await supabase
          .from("courses")
          .insert({
            title: title.trim(),
            description: description.trim() || null,
            category: category.trim() || null,
            level: level.trim() || "Débutant",
            price: isFree ? 0 : Number(price) || 0,
            duration: duration.trim() || null,
            is_free: isFree,
            published,
            objectives: objectives.trim() || null,
            audience: audience.trim() || null,
            prerequisites: prerequisites.trim() || null,
            instructor_name: instructorName.trim() || null,
            instructor_bio: instructorBio.trim() || null,
          })
          .select(
            "id, title, description, category, level, price, duration, published, is_free, image_url, objectives, audience, prerequisites, instructor_name, instructor_bio"
          )
          .single();

        if (insertError) {
          throw insertError;
        }

        // L'image ne peut être envoyée qu'une fois la formation
        // créée : on a besoin de son id pour ranger le fichier.
        const uploadedImageUrl = await uploadCourseImage(data.id);

        if (uploadedImageUrl) {
          const { error: imageUpdateError } = await supabase
            .from("courses")
            .update({ image_url: uploadedImageUrl })
            .eq("id", data.id);

          if (imageUpdateError) {
            throw imageUpdateError;
          }

          data.image_url = uploadedImageUrl;
        }

        setCourses([data, ...courses]);

        setStats({
          ...stats,
          [data.id]: {
            modules: 0,
            lessons: 0,
            learners: 0,
          },
        });

        setMessage("Formation créée avec succès.");
      }

      resetCourseForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer la formation."
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(course: Course) {
    try {
      setTogglingId(course.id);
      setError("");

      const { data, error: toggleError } = await supabase
        .from("courses")
        .update({ published: !course.published })
        .eq("id", course.id)
        .select(
          "id, title, description, category, level, price, duration, published, is_free, image_url, objectives, audience, prerequisites, instructor_name, instructor_bio"
        )
        .single();

      if (toggleError) {
        throw toggleError;
      }

      setCourses(
        courses.map((c) => (c.id === course.id ? data : c))
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de changer le statut de publication."
      );
    } finally {
      setTogglingId(null);
    }
  }

  // Supprime les fichiers (couverture, PDF) d'une formation supprimée.
  // Fait au mieux : la formation est déjà supprimée de la base à ce stade.
  async function removeStorageFolder(
    bucket: string,
    prefix: string,
    depth = 0
  ) {
    // Garde-fou : on ne descend jamais plus de 4 niveaux de dossiers.
    if (depth > 4) return;

    try {
      const { data: entries } = await supabase.storage
        .from(bucket)
        .list(prefix, { limit: 1000 });

      if (!entries || entries.length === 0) return;

      const files: string[] = [];

      for (const entry of entries) {
        const entryPath = `${prefix}/${entry.name}`;

        if (entry.id === null) {
          await removeStorageFolder(bucket, entryPath, depth + 1);
        } else {
          files.push(entryPath);
        }
      }

      if (files.length > 0) {
        await supabase.storage.from(bucket).remove(files);
      }
    } catch {
      // Nettoyage des fichiers non bloquant.
    }
  }

  async function openDeleteDialog(course: Course) {
    setDeleteTarget(course);
    setDeletePreview(null);
    setDeleteConfirmText("");
    setDeleteError("");
    setDeleteLoading(true);

    try {
      // Aperçu : ne supprime rien, mesure seulement l'impact.
      const { data, error: previewError } = await supabase.rpc(
        "admin_delete_course",
        { p_course_id: course.id, p_confirm: false }
      );

      if (previewError) {
        throw previewError;
      }

      setDeletePreview(data as DeletePreview);
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Impossible de mesurer l'impact de la suppression."
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  function closeDeleteDialog() {
    if (deleting) return;
    setDeleteTarget(null);
    setDeletePreview(null);
    setDeleteConfirmText("");
    setDeleteError("");
  }

  async function confirmDeleteCourse() {
    if (!deleteTarget || !deletePreview || deletePreview.blocked) return;
    if (deleteConfirmText.trim() !== "SUPPRIMER") return;

    const course = deleteTarget;

    try {
      setDeleting(true);
      setDeleteError("");

      const { error: deleteRpcError } = await supabase.rpc(
        "admin_delete_course",
        { p_course_id: course.id, p_confirm: true }
      );

      if (deleteRpcError) {
        throw deleteRpcError;
      }

      // Base nettoyée : on retire la formation de l'écran…
      setCourses((current) => current.filter((c) => c.id !== course.id));
      setStats((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([id]) => Number(id) !== course.id)
        )
      );

      if (editingCourseId === course.id) {
        resetCourseForm();
      }

      // …puis on supprime ses fichiers (couverture et PDF).
      await removeStorageFolder("course-covers", String(course.id));
      await removeStorageFolder("course-pdfs", String(course.id));

      setMessage(
        `La formation « ${course.title} » a été supprimée définitivement.`
      );
      setError("");
      setDeleteTarget(null);
      setDeletePreview(null);
      setDeleteConfirmText("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "La suppression a échoué. Rien n'a été supprimé."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <p>Chargement de l'administration...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <p className="text-sm font-semibold text-green-700">
            AGRIKEY
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Administration
          </h1>

          <p className="mt-2 text-gray-600">
            Gérez vos formations, modules, leçons et quiz.
          </p>

          <a
            href="/admin/partenaires"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Demandes de partenariat
            {newPartnerRequests > 0 && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                {newPartnerRequests} nouvelle{newPartnerRequests > 1 ? "s" : ""}
              </span>
            )}
          </a>
        </div>

        {message && (
          <div className="mb-6 rounded-lg bg-green-100 p-4 text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-800">
            {error}
          </div>
        )}

        <section className="mb-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Formations
            </p>

            <p className="mt-2 text-3xl font-bold">
              {courses.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Modules
            </p>

            <p className="mt-2 text-3xl font-bold">
              {Object.values(stats).reduce(
                (total, stat) => total + stat.modules,
                0
              )}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Leçons
            </p>

            <p className="mt-2 text-3xl font-bold">
              {Object.values(stats).reduce(
                (total, stat) => total + stat.lessons,
                0
              )}
            </p>
          </div>
        </section>

        <section className="mb-10 rounded-xl bg-white p-8 shadow">
          <div className="flex items-center justify-between">
            <h2 className="mb-6 text-xl font-bold">
              {editingCourseId
                ? "Modifier la formation"
                : "Créer une formation"}
            </h2>

            {editingCourseId && (
              <button
                onClick={resetCourseForm}
                className="mb-6 text-sm font-semibold text-gray-500 hover:text-gray-800"
              >
                Annuler la modification
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la formation"
              className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
            />

            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Catégorie"
              className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
            />

            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-3"
            >
              <option value="Débutant">Débutant</option>
              <option value="Intermédiaire">
                Intermédiaire
              </option>
              <option value="Avancé">Avancé</option>
            </select>

            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Durée, ex : 4 heures"
              className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
            />

            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={isFree}
              placeholder="Prix en FCFA"
              className="rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
            />

            <div className="flex items-center gap-6 rounded-lg border border-gray-200 px-4 py-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) =>
                    setIsFree(e.target.checked)
                  }
                />
                Formation gratuite
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) =>
                    setPublished(e.target.checked)
                  }
                />
                Publier
              </label>
            </div>
          </div>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="Description de la formation"
            rows={5}
            className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
          />

          <div className="mt-8 border-t border-gray-100 pt-6">
            <h3 className="text-base font-bold text-gray-900">
              Page de présentation de la formation
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Ces informations s'affichent sur la page publique de la
              formation. Ce qui est laissé vide n'est pas affiché.
            </p>

            <label className="mb-1 mt-5 block text-sm font-semibold text-gray-700">
              Objectifs : ce que l'apprenant saura faire (un par ligne)
            </label>
            <textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder={"Rédiger une note conceptuelle structurée\nConstruire un cadre logique cohérent\nSuivre les indicateurs d'un projet"}
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
            />

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Pour qui ?
                </label>
                <textarea
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Ex. Jeunes entrepreneurs et responsables de petites structures"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Prérequis
                </label>
                <textarea
                  value={prerequisites}
                  onChange={(e) => setPrerequisites(e.target.value)}
                  placeholder="Ex. Aucun prérequis. Savoir lire et utiliser un téléphone."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Nom du formateur ou de l'organisation
                </label>
                <input
                  type="text"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  placeholder="Ex. Adama KEITA, ou nom d'un partenaire"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Présentation du formateur (2 à 3 phrases)
                </label>
                <textarea
                  value={instructorBio}
                  onChange={(e) => setInstructorBio(e.target.value)}
                  placeholder="Parcours, expertise, expérience..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Image de couverture
            </label>

            <div className="flex flex-wrap items-center gap-4">
              {(imagePreview || existingImageUrl) && (
                <>
                  <img
                    src={imagePreview || existingImageUrl || ""}
                    alt="Aperçu de la couverture"
                    className="aspect-video w-48 rounded-lg border border-gray-200 object-cover"
                  />

                  <button
                    type="button"
                    onClick={removeImage}
                    className="text-sm font-semibold text-red-600 hover:text-red-700"
                  >
                    Retirer l'image
                  </button>
                </>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-sm"
              />
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Choisissez une photo horizontale (format 16:9, par
              exemple 1280 × 720 px) : c'est ainsi qu'elle s'affiche.
              Une photo verticale est recadrée au centre. La photo est
              automatiquement réduite pour s'afficher vite. Sans image,
              une couverture aux couleurs d'AGRIKEY est générée.
            </p>

            {imageBusy && (
              <p className="mt-1 text-xs font-semibold text-green-700">
                Préparation de l'image...
              </p>
            )}
          </div>

          <button
            onClick={saveCourse}
            disabled={saving || imageBusy}
            className="mt-4 rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {saving
              ? "Enregistrement..."
              : editingCourseId
                ? "Enregistrer les modifications"
                : "Créer la formation"}
          </button>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Mes formations
              </h2>

              <p className="mt-1 text-gray-600">
                Accédez à la gestion de chaque formation.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {courses.map((course) => {
              const courseStats = stats[course.id] || {
                modules: 0,
                lessons: 0,
                learners: 0,
              };

              return (
                <div
                  key={course.id}
                  className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {course.title}
                    </h3>

                    <span
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                        course.published
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {course.published
                        ? "Publiée"
                        : "Brouillon"}
                    </span>
                  </div>

                  <p className="mt-4 text-gray-600">
                    {course.category || "Sans catégorie"}{" "}
                    · {course.level || "Sans niveau"}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <span className="rounded-full bg-gray-100 px-4 py-2 text-sm">
                      {course.is_free
                        ? "Gratuite"
                        : `${course.price.toLocaleString(
                            "fr-FR"
                          )} FCFA`}
                    </span>

                    <span className="rounded-full bg-gray-100 px-4 py-2 text-sm">
                      {course.duration || "Durée non définie"}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3 border-t border-gray-100 pt-5">
                    <div>
                      <p className="text-xs text-gray-500">
                        Modules
                      </p>
                      <p className="mt-1 font-bold">
                        {courseStats.modules}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Leçons
                      </p>
                      <p className="mt-1 font-bold">
                        {courseStats.lessons}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Apprenants
                      </p>
                      <p className="mt-1 font-bold">
                        {courseStats.learners}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href={`/formations/${course.id}`}
                      className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800"
                    >
                      Voir la formation
                    </a>

                    <a
                      href={`/admin/formations/${course.id}`}
                      className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
                    >
                      Gérer
                    </a>

                    <button
                      onClick={() => startEditingCourse(course)}
                      className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Modifier
                    </button>

                    <button
                      onClick={() => togglePublished(course)}
                      disabled={togglingId === course.id}
                      className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {togglingId === course.id
                        ? "..."
                        : course.published
                          ? "Dépublier"
                          : "Publier"}
                    </button>

                    <button
                      onClick={() => openDeleteDialog(course)}
                      className="rounded-lg border border-red-300 px-5 py-3 font-semibold text-red-700 hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          onClick={closeDeleteDialog}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-red-600">
              Suppression définitive
            </p>

            <h2
              id="delete-title"
              className="mt-2 text-xl font-bold text-gray-900"
            >
              {deleteTarget.title}
            </h2>

            {deleteLoading && (
              <p className="mt-5 text-sm text-gray-500">
                Analyse de ce qui serait supprimé...
              </p>
            )}

            {deleteError && (
              <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {deleteError}
              </p>
            )}

            {deletePreview && deletePreview.blocked && (
              <div className="mt-5">
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-900">
                    Cette formation ne peut pas être supprimée.
                  </p>

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                    {deletePreview.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>

                <p className="mt-4 text-sm text-gray-600">
                  Pour la retirer du catalogue sans rien perdre, vous pouvez
                  la <strong>dépublier</strong> : elle disparaît pour les
                  visiteurs, mais les certificats et l'historique restent
                  valides.
                </p>

                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <button
                    onClick={closeDeleteDialog}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Fermer
                  </button>

                  {deleteTarget.published && (
                    <button
                      onClick={async () => {
                        const course = deleteTarget;
                        closeDeleteDialog();
                        await togglePublished(course);
                      }}
                      className="rounded-lg bg-gray-900 px-5 py-2.5 font-semibold text-white hover:bg-gray-800"
                    >
                      Dépublier à la place
                    </button>
                  )}
                </div>
              </div>
            )}

            {deletePreview && !deletePreview.blocked && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-gray-800">
                  Seront définitivement supprimés :
                </p>

                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  <li>
                    {deletePreview.modules} module(s) et{" "}
                    {deletePreview.lessons} leçon(s)
                  </li>
                  <li>
                    {deletePreview.quizzes} quiz et{" "}
                    {deletePreview.questions} question(s)
                  </li>
                  <li>
                    {deletePreview.learners} inscription(s) d'apprenants, avec
                    leur progression et leurs résultats de quiz (
                    {deletePreview.quiz_attempts} tentative(s))
                  </li>
                  {deletePreview.payments_pending > 0 && (
                    <li>
                      {deletePreview.payments_pending} commande(s) de paiement
                      jamais payée(s)
                    </li>
                  )}
                  <li>L'image de couverture et les fichiers PDF</li>
                </ul>

                {deletePreview.learners > 0 && (
                  <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-900">
                    Attention : {deletePreview.learners} apprenant(s) perdront
                    l'accès à cette formation et toute leur progression.
                  </p>
                )}

                <p className="mt-4 text-sm font-bold text-red-700">
                  Cette action est irréversible.
                </p>

                <label className="mt-4 block text-sm font-semibold text-gray-700">
                  Pour confirmer, tapez SUPPRIMER :
                </label>

                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="SUPPRIMER"
                  autoComplete="off"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                />

                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <button
                    onClick={closeDeleteDialog}
                    disabled={deleting}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Annuler
                  </button>

                  <button
                    onClick={confirmDeleteCourse}
                    disabled={
                      deleting || deleteConfirmText.trim() !== "SUPPRIMER"
                    }
                    className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {deleting
                      ? "Suppression..."
                      : "Supprimer définitivement"}
                  </button>
                </div>
              </div>
            )}

            {!deleteLoading && !deletePreview && deleteError && (
              <div className="mt-5 flex justify-end">
                <button
                  onClick={closeDeleteDialog}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}