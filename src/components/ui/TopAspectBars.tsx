/* ------------------------------------------------------------------ */
/* components/ui/TopAspectBars.tsx                                    */
/* ------------------------------------------------------------------ */
'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function TopAspectBars({
    data,
}: {
    data: { id: number; name: string; value: number }[];
}) {
    if (!data.length) {
        return <p className="text-sm text-muted-foreground">Veri yok.</p>;
    }

    const max = Math.max(...data.map((d) => d.value));

    return (
        <ul className="space-y-2">
            {data.map((a) => (
                <li key={a.id}>
                    {/* başlık + sayaç + ok ikonu */}
                    <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex-1 min-w-0 flex justify-between">
                            <span className="truncate">{a.name}</span>
                            <span className="text-muted-foreground">{a.value}</span>
                        </div>

                        <Link
                            href={`/aspects/${a.id}`}
                            className="ml-2 shrink-0 text-muted-foreground hover:text-primary"
                        >
                            <ArrowUpRight size={16} />
                        </Link>
                    </div>

                    {/* progress bar */}
                    <div className="h-2 rounded bg-muted/60">
                        <div
                            className="h-full rounded bg-primary"
                            style={{ width: `${(a.value / max) * 100}%` }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}
