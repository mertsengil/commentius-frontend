/* ------------------------------------------------------------------ */
/* components/reviews/helpers.tsx                                     */
/* ------------------------------------------------------------------ */
'use client';

import Link from 'next/link';
import {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent,
} from '@/components/ui/hover-card';

/* ------------------------------------------------------------------ */
/* Tip tanımları                                                      */
/* ------------------------------------------------------------------ */
export type Sentiment = 'positive' | 'negative' | 'neutral';

/* ------------------------------------------------------------------ */
/* Emoji haritası                                                     */
/* ------------------------------------------------------------------ */
export const catEmoji: Record<string, string> = {
    drink: '🍹',
    food: '🍽️',
    hygiene: '🧼',
    location: '📍',
    other: '🏷️',
    price: '💸',
    ambience: '🎶',
    service: '🛎️',
    view: '🌅',
    waiter: '🤵',
};

/* ------------------------------------------------------------------ */
/* Fosforlu vurgulama renkleri (cümle içinde)                         */
/* ------------------------------------------------------------------ */
export const hi = {
    positive:
        'bg-lime-300/80 dark:bg-lime-600/70 text-black dark:text-lime-50 rounded px-1',
    negative:
        'bg-rose-300/80 dark:bg-rose-600/70 text-black dark:text-rose-50 rounded px-1',
    neutral:
        'bg-gray-300/80 dark:bg-gray-500/70 text-black dark:text-gray-50 rounded px-1',
} as const;

/* ------------------------------------------------------------------ */
/* Sentiment rozet (pill) renkleri                                    */
/* ------------------------------------------------------------------ */
export const pill = {
    positive:
        'bg-lime-200 dark:bg-lime-700/50 text-green-900 dark:text-lime-100',
    negative:
        'bg-rose-200 dark:bg-rose-700/50 text-rose-900 dark:text-rose-100',
    neutral:
        'bg-gray-200 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100',
} as const;

/* ------------------------------------------------------------------ */
/* Aspect metni vurgulayan yardımcı fonksiyon                         */
/* ------------------------------------------------------------------ */
export function highlightAspects(
    text: string,
    aspects: {
        id: number;
        aspect: string;
        category: string;
        sentiment: Sentiment;
    }[],
) {
    if (!text || aspects.length === 0) return text;

    // ① Orijinal metni locale-hassas küçült
    const textLower = text.toLocaleLowerCase('tr-TR');

    // ② Aspect’leri de locale-hassas küçült ve uzunlukça sırala
    const sorted = [...aspects]
        .map(a => ({ ...a, aspect: a.aspect.toLocaleLowerCase('tr-TR') }))
        .sort((a, b) => b.aspect.length - a.aspect.length);

    const parts: (string | JSX.Element)[] = [];
    let idx = 0;
    let key = 0;

    while (idx < text.length) {
        let hitPos = -1;
        let hitAspect: typeof sorted[0] | null = null;

        for (const a of sorted) {
            const p = textLower.indexOf(a.aspect, idx);
            if (p !== -1 && (hitPos === -1 || p < hitPos)) {
                hitPos = p;
                hitAspect = a;
            }
        }

        // Hiç eşleşme kalmadıysa kalan metni ekleyip bitir
        if (hitPos === -1 || !hitAspect) {
            parts.push(text.slice(idx));
            break;
        }

        // Eşleşme öncesi düz metni ekle
        if (hitPos > idx) parts.push(text.slice(idx, hitPos));

        // Eşleşen kısmı orijinal metinden al
        const end = hitPos + hitAspect.aspect.length;
        const matched = text.slice(hitPos, end);

        // HoverCard ile vurgulu link ekle
        parts.push(
            <HoverCard key={key++}>
                <HoverCardTrigger asChild>
                    <Link
                        href={`/dashboard/aspect/${hitAspect.id}`}
                        className={hi[hitAspect.sentiment]}
                    >
                        {matched}
                    </Link>
                </HoverCardTrigger>
                <HoverCardContent className="text-xs leading-tight w-56">
                    <p className="font-medium">{hitAspect.aspect}</p>
                    <p className="text-muted-foreground">
                        {catEmoji[hitAspect.category] ?? ''} {hitAspect.category}
                    </p>
                    <p>
                        Duygu:{' '}
                        {hitAspect.sentiment === 'positive'
                            ? 'Pozitif'
                            : hitAspect.sentiment === 'negative'
                                ? 'Negatif'
                                : 'Nötr'}
                    </p>
                </HoverCardContent>
            </HoverCard>,
        );

        // İmleci eşleşme sonrasına taşı
        idx = end;
    }

    return parts;
}
