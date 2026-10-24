/** Metadata-only calendar grouping shared by news and journal navigation.
 * ISO calendar keys sort lexically; input order is never assumed or mutated.
 */
export interface CalendarEntry {
  title: string;
  url: string;
  year: string;
  monthKey: string;
  timestamp: number;
}

export function calendarArchive<T extends CalendarEntry>(entries: T[]) {
  const years = new Map<string, Map<string, T[]>>();
  for (const entry of [...entries].sort((a, b) => b.timestamp - a.timestamp || a.url.localeCompare(b.url))) {
    const months = years.get(entry.year) ?? new Map<string, T[]>();
    years.set(entry.year, months);
    const items = months.get(entry.monthKey) ?? [];
    months.set(entry.monthKey, items);
    items.push(entry);
  }
  return [...years].sort(([a], [b]) => b.localeCompare(a)).map(([year, months]) => ({
    year,
    months: [...months].sort(([a], [b]) => b.localeCompare(a)).map(([key, items]) => ({ key, items })),
  }));
}

export function calendarSidebar(entries: CalendarEntry[]) {
  const years = calendarArchive(entries);
  return years.map(({ year, months }, yearIndex) => ({
    text: year,
    latestLink: months[0].items[0].url,
    collapsed: yearIndex !== 0,
    items: months.map(({ key, items }, monthIndex) => ({
      text: key,
      latestLink: items[0].url,
      collapsed: yearIndex !== 0 || monthIndex !== 0,
      items: items.map(({ title, url }) => ({ text: title, link: url })),
    })),
  }));
}
