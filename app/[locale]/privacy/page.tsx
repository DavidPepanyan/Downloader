import { getTranslations } from "next-intl/server";

const paragraphClass =
  "text-[15px] leading-7 text-muted-foreground sm:text-base sm:leading-[1.75]";

export default async function PrivacyPolicyPage() {
  const t = await getTranslations("legal.privacy");

  return (
    <main className="bg-gradient-to-b from-background to-muted/40">
      <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t("title")}</h1>
        <article className="mt-8 space-y-6">
          <p className={paragraphClass}>{t("p1")}</p>
          <p className={paragraphClass}>{t("p2")}</p>
          <p className={paragraphClass}>{t("p3")}</p>
          <p className={paragraphClass}>{t("p4")}</p>
          <p className={paragraphClass}>{t("p5")}</p>
          <p className={paragraphClass}>{t("p6")}</p>
          <p className={paragraphClass}>{t("p7")}</p>
          <p className={paragraphClass}>{t("p8")}</p>
        </article>
      </div>
    </main>
  );
}
