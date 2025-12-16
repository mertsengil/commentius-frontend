import React from 'react';
import { Image, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    img: { width: 90, height: 36, objectFit: 'contain' },
});

/**
 * PDF içinde logo resmi.
 * - `public/images/logo.svg` dosyasını kullanır.
 * - Gerekirse `width` / `height` prop’larıyla boyutu ezebilirsiniz.
 */
const Logo: React.FC<{ width?: number; height?: number }> = ({
    width,
    height,
}) => {
    /* 1) Tarayıcıdaysak window.origin; 2) SSR'de .env; 3) Yedek localhost */
    const baseUrl =
        typeof window !== 'undefined' && window.location.origin
            ? window.location.origin
            : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const src = `${baseUrl}/images/logo.svg`;

    return (
        <Image
            src={src}
            cache={false}              // Hot-reload / dev ortamında görsel değişirse anında yenilenir
            style={[
                styles.img,
                width ? { width } : null,
                height ? { height } : null,
            ]}
        />
    );
};

export default Logo;
