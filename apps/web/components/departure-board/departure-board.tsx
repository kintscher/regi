import type { Departure } from "@/lib/sources/transport/types";
import { delayLabel, fmtTimeCH } from "./format";

/**
 * Departures as semantic tabular data: a real <table> (line · destination ·
 * time · delay · platform) with a screen-reader caption and column headers —
 * the correct, accessible structure for columnar transit data. An instance
 * of the gazette system: hairline rows, mono figures, accent links-only,
 * delay signalled by ink weight not colour (design-system.md §11). Pure
 * presentational Server Component.
 */
export function DepartureBoard({ departures }: { departures: Departure[] }) {
  return (
    <table className="ov">
      <caption className="sr-only">Nächste Abfahrten ab Bahnhof Regensdorf-Watt</caption>
      <thead>
        <tr>
          <th scope="col" className="ov__c-line">
            Linie
          </th>
          <th scope="col">Ziel</th>
          <th scope="col" className="ov__c-time">
            Ab
          </th>
          <th scope="col" className="ov__c-delay">
            Verspätung
          </th>
          <th scope="col" className="ov__c-plat">
            Gleis
          </th>
        </tr>
      </thead>
      <tbody>
        {departures.map((d) => {
          const at = d.scheduled ?? d.prognosis;
          const delay = delayLabel(d.delayMin);
          return (
            <tr key={d.key}>
              <td className="ov__c-line ov__line">{d.line}</td>
              <td className="ov__dest">{d.to ?? "—"}</td>
              <td className="ov__c-time ov__time">
                {at ? <time dateTime={at}>{fmtTimeCH(at)}</time> : "—"}
              </td>
              <td className="ov__c-delay">
                <span className={delay.late ? "ov__delay ov__delay--late" : "ov__delay"}>
                  {delay.text}
                </span>
              </td>
              <td className="ov__c-plat ov__plat">{d.platform ?? "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
