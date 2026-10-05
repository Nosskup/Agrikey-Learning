import type { Metadata } from "next";
import Link from "next/link";
import Footer from "../../components/Footer";
import PartnerForm from "../../components/PartnerForm";
import PartnerShowcase from "../../components/PartnerShowcase";

export const metadata: Metadata = {
  title: "Devenir partenaire",
  description:
    "Experts, centres de formation, ONG et entreprises : transformez une expertise en formation numérique avec AGRIKEY Learning, de la conception à la mise en ligne.",
  openGraph: {
    title: "Devenir partenaire d'AGRIKEY Learning",
    description:
      "Digitalisez vos formations, formez vos bénéficiaires, suivez les apprentissages.",
    images: [{ url: "/images/og-agrikey.png", width: 1200, height: 630 }],
  },
};

const PROFILES = [
  {
    title: "Experts et formateurs",
    text: "Transformez votre expertise en formation numérique et valorisez vos connaissances auprès d'un public plus large.",
  },
  {
    title: "Centres de formation et universités",
    text: "Digitalisez une partie de vos formations et proposez à vos apprenants une expérience complémentaire en ligne.",
  },
  {
    title: "ONG et projets de développement",
    text: "Déployez des parcours de formation numériques pour vos bénéficiaires, avec leur progression suivie leçon après leçon.",
  },
  {
    title: "Entreprises et organisations",
    text: "Formez vos collaborateurs et développez leurs compétences à travers des parcours adaptés à vos besoins.",
  },
];

const STEPS = [
  {
    title: "Analyser votre besoin",
    text: "Public cible, compétences à développer, objectifs, contenus déjà disponibles.",
  },
  {
    title: "Digitaliser vos contenus",
    text: "Leçons, vidéos, supports PDF, fiches pratiques, quiz et exercices.",
  },
  {
    title: "Construire le parcours",
    text: "Des modules et des leçons structurés, avec des objectifs clairs et une progression cohérente.",
  },
  {
    title: "Mettre en ligne",
    text: "Votre formation est publiée sur AGRIKEY Learning, avec le nom et la présentation du formateur.",
  },
  {
    title: "Accompagner le lancement",
    text: "Inscription des participants, communication auprès des bénéficiaires, prise en main.",
  },
  {
    title: "Évaluer et améliorer",
    text: "Les résultats et les retours des apprenants servent à améliorer la formation.",
  },
];

const MODELS = [
  {
    title: "Digitalisation d'une formation existante",
    text: "Vous avez déjà les contenus : nous les transformons en parcours numérique.",
  },
  {
    title: "Conception d'un nouveau parcours",
    text: "Nous vous accompagnons de la conception pédagogique jusqu'à la mise en ligne.",
  },
  {
    title: "Formation sponsorisée",
    text: "Votre organisation finance l'accès à la formation pour un groupe de bénéficiaires.",
  },
  {
    title: "Partage de revenus",
    text: "Pour une formation payante, les revenus sont répartis selon des conditions définies ensemble.",
  },
];

const APPROACHES = [
  {
    title: "Une approche locale",
    text: "Pensée pour les réalités des organisations et des apprenants au Mali et en Afrique francophone.",
  },
  {
    title: "Une approche pédagogique",
    text: "Nous ne mettons pas seulement des PDF en ligne : nous travaillons la manière dont les apprenants acquièrent réellement les compétences.",
  },
  {
    title: "Une approche flexible",
    text: "Le dispositif s'adapte au contenu, au public, aux objectifs et aux ressources disponibles.",
  },
  {
    title: "Une approche collaborative",
    text: "Votre organisation reste au cœur de la conception et de la validation des contenus.",
  },
];

const HIGHLIGHTS = [
  "Un parcours structuré en modules, leçons et quiz",
  "Un certificat vérifiable pour vos apprenants",
  "Votre nom et votre présentation en tête de la formation",
  "Utilisable sur téléphone, à leur rythme",
];

const PILOT = [
  "1 formation",
  "1 parcours numérique",
  "1 groupe d'apprenants",
  "Suivi de la progression",
  "Évaluation des participants",
  "Bilan et recommandations",
];

export default function PartenairesPage() {
  // Coordonnées facultatives : affichées seulement si elles sont définies
  // dans les variables d'environnement (jamais de texte « à compléter » en ligne).
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 text-white">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-green-400/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-green-100">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Partenariats
            </div>

            <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
              Transformez une expertise en{" "}
              <span className="text-green-300">formation numérique.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-green-50/90 sm:text-lg">
              AGRIKEY Learning accompagne les experts, les centres de
              formation, les ONG et les entreprises dans la conception, la mise
              en ligne et le suivi de formations professionnelles.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact"
                className="rounded-xl bg-white px-6 py-3.5 text-center text-sm font-bold text-green-900 shadow-lg transition hover:bg-green-50"
              >
                Nous contacter
              </a>

              <Link
                href="/formations"
                className="rounded-xl border border-white/30 px-6 py-3.5 text-center text-sm font-bold text-white transition hover:bg-white/10"
              >
                Voir les formations →
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-7 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-widest text-green-200">
              Ce que vous obtenez
            </p>

            <ul className="mt-5 space-y-4">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-white">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-400 text-xs font-black text-green-950">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* POUR QUI */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-green-700">
            Pour qui ?
          </p>

          <h2 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Quatre profils de partenaires
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {PROFILES.map((profile) => (
              <div
                key={profile.title}
                className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <h3 className="text-lg font-bold text-slate-900">
                  {profile.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {profile.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA SE PASSE */}
      <section className="bg-green-50/60 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-green-700">
            Comment ça se passe
          </p>

          <h2 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            De votre expertise à une formation en ligne
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-700 text-sm font-black text-white">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VITRINE : formations réellement publiées */}
      <PartnerShowcase />

      {/* PILOTE */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-green-950 to-green-800 p-8 text-white sm:p-12">
            <p className="text-xs font-bold uppercase tracking-widest text-green-300">
              Commencer simplement
            </p>

            <h2 className="mt-2 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
              Un premier pilote, avant tout engagement plus large
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-7 text-green-50/90">
              Nous proposons de tester la collaboration sur une seule formation
              ou un seul module. Cela permet de mesurer concrètement la valeur
              du dispositif avant un déploiement à plus grande échelle.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PILOT.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-400 text-xs font-black text-green-950">
                    ✓
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MODÈLES */}
      <section className="pb-16 lg:pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-green-700">
            Modèles de collaboration
          </p>

          <h2 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Plusieurs formules, selon votre projet
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MODELS.map((model) => (
              <div
                key={model.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-base font-bold text-slate-900">
                  {model.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {model.text}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-6 max-w-3xl text-sm text-slate-500">
            Les modalités sont définies au cas par cas, selon le niveau de
            production, les responsabilités de chaque partie et le modèle de
            diffusion.
          </p>
        </div>
      </section>

      {/* POURQUOI */}
      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-green-700">
            Pourquoi AGRIKEY Learning ?
          </p>

          <h2 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Quatre façons de travailler ensemble
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {APPROACHES.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-7"
              >
                <h3 className="text-lg font-bold text-green-800">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="scroll-mt-20 py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-5 lg:px-8">
          <div className="lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-widest text-green-700">
              Parlons de votre besoin
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Construisons ensemble votre première formation
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Vous avez déjà une formation, un programme à déployer, ou une
              expertise à transmettre ? Décrivez-nous votre besoin en quelques
              lignes : nous reviendrons vers vous.
            </p>

            {(contactEmail || contactPhone) && (
              <div className="mt-8 space-y-3 text-sm">
                <p className="font-bold text-slate-900">
                  Vous pouvez aussi nous joindre directement :
                </p>

                {contactEmail && (
                  <p>
                    <span className="text-slate-500">E-mail : </span>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="font-semibold text-green-700 hover:text-green-800"
                    >
                      {contactEmail}
                    </a>
                  </p>
                )}

                {contactPhone && (
                  <p>
                    <span className="text-slate-500">Téléphone : </span>
                    <a
                      href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                      className="font-semibold text-green-700 hover:text-green-800"
                    >
                      {contactPhone}
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-green-900/5 sm:p-8 lg:col-span-3">
            <PartnerForm />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
