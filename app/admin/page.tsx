"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";

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

  function handleImageChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
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
                    className="h-24 w-40 rounded-lg border border-gray-200 object-cover"
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
              Format JPG ou PNG, 5 Mo maximum. Sans image, une
              couverture aux couleurs d'AGRIKEY est générée
              automatiquement.
            </p>
          </div>

          <button
            onClick={saveCourse}
            disabled={saving}
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
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}