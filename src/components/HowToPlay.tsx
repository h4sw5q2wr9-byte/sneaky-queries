import { useState } from "react";
import {
  Eye,
  MessageCircle,
  ShieldQuestion,
  Users,
  ArrowRight,
} from "lucide-react";
import { translate } from "../lib/i18n";
import type { StringKey } from "../lib/i18n";
import type { Locale } from "../lib/types";
import { Button, Title } from "./ui";
import { Pager } from "./Pager";
export function HowToPlay({
  locale,
  onPlay,
}: {
  locale: Locale;
  onPlay: () => void;
}) {
  const [step, setStep] = useState(0);
  const t = (k: StringKey) => translate(locale, k);
  const Icon = [Users, ShieldQuestion, MessageCircle, Eye][step];
  return (
    <section className="narrow how-screen">
      <Title title={t("navHow")} sub={t("howNote")} />
      <div className="how-card screen-enter" key={step}>
        <div className="how-visual">
          <Icon size={54} />
          <span>0{step + 1}</span>
        </div>
        <h2>{t(`step${step + 1}` as StringKey)}</h2>
        <p>{t(`step${step + 1}body` as StringKey)}</p>
      </div>
      <Pager page={step} total={4} onChange={setStep} locale={locale} />
      <div className="action-dock">
        <Button onClick={step < 3 ? () => setStep(step + 1) : onPlay}>
          {t(step < 3 ? "nextStep" : "letsPlay")}
          <ArrowRight size={18} />
        </Button>
      </div>
    </section>
  );
}
