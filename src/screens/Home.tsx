import { ArrowRight, HelpCircle, KeyRound, Sparkles } from "lucide-react";
import { translate } from "../lib/i18n";
import type { StringKey } from "../lib/i18n";
import type { Locale } from "../lib/types";
import { Mascot, Wordmark } from "../components/brand/Mascot";
import { Avatar } from "../components/ui/Avatar";
import { sound } from "../lib/sound";

function OnlineArt() {
  return (
    <span className="mode-art online-art" aria-hidden="true">
      <span className="signal" />
      <span className="mini-phone p1">
        <Avatar slot={2} size={26} />
      </span>
      <span className="mini-phone p2">
        <Avatar slot={3} size={26} />
      </span>
      <span className="mini-phone p3">
        <Avatar slot={5} size={26} />
      </span>
    </span>
  );
}
function PassArt() {
  return (
    <span className="mode-art pass-art" aria-hidden="true">
      <span className="pass-arc" />
      <Avatar slot={1} size={30} className="pass-left" />
      <Avatar slot={3} size={30} className="pass-right" />
      <span className="mini-phone pass-phone">
        <span className="phone-q">?</span>
      </span>
    </span>
  );
}

export function Home({
  locale,
  onOnline,
  onLocal,
  onHelp,
}: {
  locale: Locale;
  onOnline: () => void;
  onLocal: () => void;
  onHelp: () => void;
}) {
  const t = (k: StringKey) => translate(locale, k);
  return (
    <section className="screen screen-home" data-view="home">
      <div className="home-hero">
        <div className="hero-stage" aria-hidden="true">
          <span className="hero-glow" />
          <span className="float-q q1">?</span>
          <span className="float-q q2">?</span>
          <span className="float-spark s1">✦</span>
          <span className="float-spark s2">✦</span>
          <Mascot size={150} className="hero-mascot" />
        </div>
        <h1 className="hero-title">
          <span className="sr-only">Sneaky Queries. </span>
          <Wordmark />
        </h1>
        <p className="hero-tagline">
          {t("hero1")} <em>{t("hero2")}</em>
        </p>
        <ol className="hero-flow" aria-label={t("partyFlow")}>
          {(["quickAnswer", "quickDiscuss", "quickReveal"] as const).map(
            (key, i) => (
              <li key={key}>
                <b>{i + 1}</b>
                {t(key)}
              </li>
            ),
          )}
        </ol>
      </div>
      <div className="mode-picker">
        <button
          type="button"
          className="mode-card mode-online"
          aria-label={t("onlineMode")}
          onClick={() => {
            sound.tap();
            onOnline();
          }}
        >
          <OnlineArt />
          <span className="mode-text">
            <strong>{t("onlineMode")}</strong>
            <small>{t("onlineSub")}</small>
          </span>
          <span className="mode-go">
            <ArrowRight size={17} />
          </span>
        </button>
        <button
          type="button"
          className="mode-card mode-pass"
          aria-label={t("passPlay")}
          onClick={() => {
            sound.tap();
            onLocal();
          }}
        >
          <PassArt />
          <span className="mode-text">
            <strong>{t("passPlay")}</strong>
            <small>{t("passPlaySub")}</small>
          </span>
          <span className="mode-go">
            <ArrowRight size={17} />
          </span>
        </button>
      </div>
      <div className="home-foot">
        <button type="button" className="how-pill" onClick={onHelp}>
          <HelpCircle size={17} />
          {t("navHow")}
        </button>
        <span className="home-facts">
          <Sparkles size={13} /> 3–10 · {t("free")}
        </span>
      </div>
    </section>
  );
}

export function OnlineChoice({
  locale,
  onCreate,
  onJoin,
}: {
  locale: Locale;
  onCreate: () => void;
  onJoin: () => void;
}) {
  const t = (k: StringKey) => translate(locale, k);
  return (
    <div className="online-choice">
      <p className="sheet-sub">{t("onlineSheetSub")}</p>
      <button
        type="button"
        className="choice-tile host-tile"
        onClick={onCreate}
      >
        <span className="choice-icon">
          <Mascot size={46} animated={false} />
        </span>
        <span>
          <strong>{t("create")}</strong>
          <small>{t("hostPartySub")}</small>
        </span>
        <ArrowRight size={18} />
      </button>
      <button type="button" className="choice-tile join-tile" onClick={onJoin}>
        <span className="choice-icon">
          <KeyRound size={26} />
        </span>
        <span>
          <strong>{t("join")}</strong>
          <small>{t("joinPartySub")}</small>
        </span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
