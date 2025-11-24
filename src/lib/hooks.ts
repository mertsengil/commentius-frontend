// lib/hooks.ts
'use client';

import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { useRef, useState, useEffect } from 'react';
import type { RootState, AppDispatch } from './store';

/* ------------------------------------------------------------------ */
/*  Redux yardımcıları                                                 */
/* ------------------------------------------------------------------ */

/** Typed dispatch */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/** Typed selector */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/* ------------------------------------------------------------------ */
/*  Görünürlük (IntersectionObserver) hook’u                          */
/* ------------------------------------------------------------------ */

/**
 * Bir elemanın viewport içinde olup olmadığını takip eder.
 *
 * @param threshold - 0‒1 arası kesme değeri (varsayılan 0.3)
 * @returns { ref, inView }
 *
 * Örnek kullanım:
 * ```tsx
 * const { ref, inView } = useInViewport<HTMLDivElement>();
 * return <div ref={ref}>{inView && 'Göründüm!'}</div>;
 * ```
 */
export function useInViewport<T extends HTMLElement = HTMLElement>(
    threshold = 0.3,
) {
    const ref = useRef<T | null>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        if (!ref.current) return;

        const io = new IntersectionObserver(
            ([entry]) => entry.isIntersecting && setInView(true),
            { threshold },
        );

        io.observe(ref.current);
        return () => io.disconnect();
    }, [threshold]);

    return { ref, inView };
}
