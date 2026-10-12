'use client';

import { Overview, percent, rankText } from './types';

export default function KeywordTable({ data, onKeyword }: { data: Overview; onKeyword: (keyword: string) => void }) {
  return <section className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm">
    <thead className="text-xs text-ink-muted"><tr><th className="py-3">Keyword</th><th className="px-3">Visibility</th><th className="px-3">Change</th><th className="px-3">Avg rank</th><th>Latest observation</th></tr></thead>
    <tbody className="divide-y divide-line">{data.settings?.keywords.map(keyword => {
      const scan = data.latest.find(s => s.keyword === keyword);
      return <tr key={keyword}>
        <td className="min-w-[180px] py-3"><button className="font-medium text-brand-600 hover:underline" onClick={() => onKeyword(keyword)}>{keyword}</button></td>
        <td className="px-3">{percent(scan?.summary.visibility)}</td>
        <td className="whitespace-nowrap px-3">{scan?.visibilityChange == null ? '-' : `${scan.visibilityChange > 0 ? '+' : ''}${scan.visibilityChange} pp`}</td>
        <td className="px-3">{rankText(scan?.summary.average)}</td>
        <td className="text-xs text-ink-muted">{scan ? `${new Date(scan.createdAt).toLocaleString()} / ${scan.radiusKm} km / ${scan.gridSize} x ${scan.gridSize} / ${scan.status}` : 'No scan recorded'}</td>
      </tr>;
    })}</tbody>
  </table></section>;
}
