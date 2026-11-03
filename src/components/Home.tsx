import {
  ArrowRight,
  HelpCircle,
  MessageCircle,
  Eye,
  Smartphone,
  Users,
  Zap,
} from "lucide-react";
import { Mask } from "./ui";
import { translate } from "../lib/i18n";
import type { Locale } from "../lib/types";
export function Home({
  locale,
  onLocal,
  onOnline,
  onHelp,
}: {
  locale: Locale;
  onLocal: () => void;
  onOnline: () => void;
  onHelp: () => void;
}) {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  return (
    <section className="home-screen">
      <div className="home-heading">
        <span className="eyebrow">
          <Zap size={12} />
          {t("pickMode")}
        </span>
        <h1>
          {t("hero1")} <span>{t("hero2")}</span>
        </h1>
      </div>
      <div className="home-feature">
        <div className="home-deck" aria-hidden="true">
          <div className="deck-card back">?</div>
          <div className="deck-card front">
            <span>SQ</span>
            <Mask />
            <i>?</i>
          </div>
          <span className="deck-spark one">✦</span>
          <span className="deck-spark two">✧</span>
        </div>
        <div className="feature-caption">
          <span className="feature-pill">
            3–10 <Users size={12} />
          </span>
          <p>{t("intro")}</p>
        </div>
      </div>
      <div className="mode-options">
        <button
          className="mode-card online-entry"
          aria-label={t("onlineMode")}
          onClick={onOnline}
        >
          <span className="mode-icon">
            <Users size={26} />
          </span>
          <span className="mode-copy">
            <strong>{t("onlineMode")}</strong>
            <small>{t("onlineSub")}</small>
          </span>
          <span className="mode-arrow">
            <ArrowRight size={18} />
          </span>
        </button>
        <button
          className="mode-card pass-play-entry"
          aria-label={t("passPlay")}
          onClick={onLocal}
        >
          <span className="mode-icon">
            <Smartphone size={26} />
          </span>
          <span className="mode-copy">
            <strong>{t("passPlay")}</strong>
            <small>{t("passPlaySub")}</small>
          </span>
          <span className="mode-arrow">
            <ArrowRight size={18} />
          </span>
        </button>
      </div>
      <div className="home-flow" aria-label={t("partyFlow")}>
        {[
          { Icon: Smartphone, label: t("quickAnswer") },
          { Icon: MessageCircle, label: t("quickDiscuss") },
          { Icon: Eye, label: t("quickReveal") },
        ].map(({ Icon, label }, i) => (
          <span key={label}>
            <i>0{i + 1}</i>
            <Icon size={15} />
            <b>{label}</b>
          </span>
        ))}
      </div>
      <button className="home-help" onClick={onHelp}>
        <span>
          <HelpCircle size={19} />
          {t("navHow")}
        </span>
        <ArrowRight size={16} />
      </button>
      <div className="home-facts">
        <span>{t("free")}</span>
        <span>✦ SNEAKY QUERIES</span>
      </div>
    </section>
  );
}
