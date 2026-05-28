import { getTranslations } from "next-intl/server";

export default async function TermsPage() {
  const t = await getTranslations("legal.terms");

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-14">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t("title")}</h1>
      <p className="mt-10 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">{t("p1")}</p>
      <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">{t("p2")}</p>
      <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">{t("p3")}</p>
      <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">{t("p4")}</p>
      <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">{t("p5")}</p>
      <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">{t("p6")}</p>
      <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">{t("p7")}</p>
    </main>
  );
}
