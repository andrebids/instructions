import React from "react";
import { Button, Card } from "@heroui/react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-foreground">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
        <div className="grid w-full items-center gap-12 md:grid-cols-2">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <span className="h-2 w-2 rounded-full bg-primary-500" aria-hidden />
              {t("pages.notFound.badge")}
            </span>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                {t("pages.notFound.title")}
              </h1>
              <p className="text-base text-foreground/70 md:text-lg">
                {t("pages.notFound.description")}
              </p>
              <p className="text-sm text-foreground/60">
                {t("pages.notFound.hint")}
              </p>
            </div>
            <Button
              as={Link}
              to="/"
              color="primary"
              variant="solid"
              size="lg"
              radius="full"
              className="w-fit bg-primary-500 text-white"
            >
              {t("common.backToDashboard")}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}

