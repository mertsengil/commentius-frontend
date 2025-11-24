/* helpers/category-metrics.ts */

/* 10 adım renk: kırmızıdan yeşile akış */
export const GRADIENT_COLORS = [
    '#dc2626', '#e24a26', '#ea6d26', '#f19226', '#f8b526',
    '#f6cd1c', '#d9da19', '#b3e014', '#7ad911', '#16a34a',
];
export const GRADIENT_ARCS = Array(GRADIENT_COLORS.length)
    .fill(1 / GRADIENT_COLORS.length);

/* — nötr yorumlar hesapta YOK — */
export function getGaugeData(cat: CategorySummary) {
    const counted = cat.positiveReviews + cat.negativeReviews;
    const total = Math.max(counted, 1);
    const positive = cat.positiveReviews / total;
    return { percent: positive };
}

