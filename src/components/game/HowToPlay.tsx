import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { translate } from "../../lib/i18n";
import type { StringKey } from "../../lib/i18n";
import type { Locale } from "../../lib/types";
import { Mascot } from "../brand/Mascot";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Pager } from "../ui/Pager";

function Vignette({ step }: { step: number }) {
  if (step === 0)
    return (
      <div className="vignette v-gather">
        {[0, 1, 2, 3, 4].map((s) => (
          <Avatar key={s} slot={s} size={46} />
        ))}
      </div>
    );
  if (step === 1)
    return (
      <div className="vignette v-questions">
        <span className="mini-q">Q</span>
        <span className="mini-q">Q</span>
        <span className="mini-q odd">Q?</span>
        <span className="mini-q">Q</span>
      </div>
    );
  if (step === 2)
    return (
      <div className="vignette v-discuss">
        <span className="mini-bubble a">🍕</span>
        <span className="mini-bubble b">🌮</span>
        <span className="mini-bubble c">🤔</span>
      </div>
    );
  return (
    <div className="vignette v-reveal">
      <Mascot size={96} />
    </div>
  );
}

export function HowToPlay({
  locale,
  onDone,
}: {
  locale: Locale;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const t = (k: StringKey) => translate(locale, k);
  return (
    <div className="how">
      <div className="how-card" key={step}>
        <Vignette step={step} />
        <span className="how-num">0{step + 1}</span>
        <h3>{t(`step${step + 1}` as StringKey)}</h3>
        <p>{t(`step${step + 1}body` as StringKey)}</p>
      </div>
      <Pager page={step} total={4} onChange={setStep} locale={locale} />
      <p className="how-note">{t("howNote")}</p>
      <Button onClick={step < 3 ? () => setStep(step + 1) : onDone}>
        {t(step < 3 ? "nextStep" : "letsPlay")}
        <ArrowRight size={18} />
      </Button>
    </div>
  );
}
