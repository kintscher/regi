import { type EventGroup, fmtDateCH, fmtTimeCH, seriesLine } from "./format";

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/**
 * One event series as an instance of the gazette `.notice` row (NOT a card):
 * next date in the mono gutter, title as the only weight, a quiet meta line,
 * the staffelung sub-line, and the single accented external link. Reuses
 * .notice/.notice__date/.notice__title/.notice__foot/.tag/.ext unchanged
 * (docs/design-system.md §10). Pure presentational Server Component.
 */
export function EventCard({ group }: { group: EventGroup }) {
  const series = seriesLine(group.furtherCount, group.last);
  const host = hostOf(group.url);

  return (
    <li>
      <article className="notice">
        <time className="notice__date" dateTime={group.next}>
          {fmtDateCH(group.next)}
        </time>
        <div className="notice__main">
          <h2 className="notice__title">{group.title}</h2>

          <p className="event__meta">
            <span className="event__time">{fmtTimeCH(group.next)} Uhr</span>
            {group.locationName || group.organizerName ? (
              <span className="event__where">
                {group.locationName ? (
                  <>
                    <span className="event__sep" aria-hidden="true">
                      ·
                    </span>
                    {group.locationName}
                  </>
                ) : null}
                {group.organizerName ? (
                  <>
                    <span className="event__sep" aria-hidden="true">
                      ·
                    </span>
                    {group.organizerName}
                  </>
                ) : null}
              </span>
            ) : null}
          </p>

          {series ? <p className="event__series">{series}</p> : null}

          <footer className="notice__foot">
            <span className="tag" translate="no">
              Quelle: Eventfrog
            </span>
            <span className="event__sep" aria-hidden="true">
              ·
            </span>
            <a
              className="ext"
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={
                host
                  ? `Veranstaltung bei ${host} (öffnet in neuem Tab)`
                  : "Veranstaltung (öffnet in neuem Tab)"
              }
            >
              Zur Veranstaltung
              <span className="ext__glyph" aria-hidden="true">
                ↗
              </span>
            </a>
          </footer>
        </div>
      </article>
    </li>
  );
}
