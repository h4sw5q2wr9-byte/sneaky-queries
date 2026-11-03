import { useState } from "react";
import { Check, X } from "lucide-react";
import { translate } from "../lib/i18n";
import type { StringKey } from "../lib/i18n";
import type { Locale, Member, Presence, Phase } from "../lib/types";
import { Pager } from "./Pager";
export function PlayerRoster({
  members,
  presence,
  submitted,
  uid,
  hostId,
  roundId,
  phase,
  locale,
  onRemove,
}: {
  members: Record<string, Member>;
  presence: Record<string, Presence>;
  submitted: Record<string, string>;
  uid: string;
  hostId: string;
  roundId: string;
  phase: Phase;
  locale: Locale;
  onRemove?: (uid: string) => void;
}) {
  const [page, setPage] = useState(0);
  const t = (k: StringKey) => translate(locale, k);
  const entries = Object.entries(members);
  const pages = Math.ceil(entries.length / 4);
  const current = Math.min(page, pages - 1);
  return (
    <div className="roster-container">
      <div className="player-list" key={current}>
        {entries.slice(current * 4, current * 4 + 4).map(([id, m], i) => (
          <div className={`player-row ${m.ready ? "is-ready" : ""}`} key={id}>
            <span className={`avatar avatar-${(current * 4 + i) % 5}`}>
              {Array.from(m.nickname)[0]?.toUpperCase()}
            </span>
            <div className="player-name">
              {m.nickname} <small>{id === uid && `(${t("you")})`}</small>
              {id === hostId && <span className="host-tag">{t("host")}</span>}
              <span className="player-status">
                {!presence[id]?.online
                  ? t("offline")
                  : phase === "lobby"
                    ? t(m.ready ? "ready" : "notReady")
                    : t(submitted[id] === roundId ? "ready" : "notReady")}
              </span>
            </div>
            {m.ready && phase === "lobby" ? (
              <Check size={16} className="mint" />
            ) : (
              <span
                className={`presence-dot ${presence[id]?.online ? "on" : ""}`}
              />
            )}{" "}
            {onRemove && id !== uid && (
              <button
                className="icon-button remove"
                aria-label={`${t("remove")} ${m.nickname}`}
                onClick={() => onRemove(id)}
              >
                <X size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
      <Pager
        page={current}
        total={pages}
        onChange={setPage}
        locale={locale}
        label={t("players")}
      />
    </div>
  );
}
