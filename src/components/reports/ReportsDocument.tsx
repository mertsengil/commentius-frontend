// components/reports/ReportsDocument.tsx
import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    Image,
} from '@react-pdf/renderer';
import Logo from './Logo';
/* ---------- 1. Font & Logo ---------- */
Font.register({
    family: 'Aileron',
    fonts: [
        { src: '/Aileron-Regular.otf', fontWeight: 'normal' },
        { src: '/Aileron-Bold.otf', fontWeight: 'bold' },
    ],
});



/* ---------- 2. Yardımcı: "**bold**" → <Text style={bold}> ---------- */
const richText = (str: string, baseStyle: any, boldStyle: any) => {
    const parts = str.split(/(\*\*[^*]+\*\*)/);          // **blok**
    return parts.map((p, i) =>
        p.startsWith('**')
            ? <Text key={i} style={boldStyle}>{p.slice(2, -2)}</Text>
            : <Text key={i} style={baseStyle}>{p}</Text>
    );
};

/* ---------- 3. Stiller ---------- */
const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 11, fontFamily: 'Aileron', lineHeight: 1.5 },
    /* Header */
    headerWrap: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12, paddingBottom: 6,
        borderBottomWidth: 1, borderColor: '#2c3e50'
    },
    title: { marginTop: 20, fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    date: { fontSize: 9, color: '#7f8c8d' },

    /* Section */
    section: { marginTop: 14 },
    sectionTitle: {
        fontSize: 13, fontWeight: 'bold', marginBottom: 6,
        color: '#2c3e50'
    },
    paragraph: { fontSize: 11, color: '#333', marginBottom: 4 },

    /* List */
    listItem: { flexDirection: 'row', marginBottom: 2 },
    bullet: { width: 10, fontSize: 14 },
    listText: { flex: 1, fontSize: 11 },

    /* Table */
    table: { display: 'table', width: 'auto', marginTop: 4 },
    row: { flexDirection: 'row' },
    th: {
        width: '25%', fontSize: 10, fontWeight: 'bold',
        padding: 4, backgroundColor: '#ecf0f1',
        borderRightWidth: 1, borderColor: '#bdc3c7'
    },
    td: {
        width: '25%', fontSize: 10, padding: 4,
        borderRightWidth: 1, borderColor: '#ecf0f1'
    },
    zebra: { backgroundColor: '#fafafa' },

    /* Footer */
    footerWrap: { position: 'absolute', bottom: 28, left: 40, right: 40 },
    footerLine: { borderBottomWidth: 1, borderColor: '#ecf0f1', marginBottom: 4 },
    footerText: { fontSize: 9, textAlign: 'right', color: '#7f8c8d' },
});

/* ---------- 4. Ana Bileşen ---------- */
export const ReportsDocument: React.FC<{ detail: any }> = ({ detail }) => {
    const { meta, summary, aspectAnalysis,
        sentimentDistribution, recommendations,
        originalData, aiGeneratedReport } = detail;

    /* Sentiment dizisine ihtiyaç var */
    const sentiments = [
        ['Pozitif', sentimentDistribution.stats.positive],
        ['Negatif', sentimentDistribution.stats.negative],
        ['Nötr', sentimentDistribution.stats.neutral],
    ];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerWrap}>
                    <Logo />
                </View>
                <View style={styles.headerWrap}>

                    <Text style={styles.title}>{meta.reportType}</Text>
                    <Text style={styles.date}>
                        {new Date(meta.generatedAt).toLocaleDateString('tr-TR')}
                    </Text>
                </View>



                <View style={styles.section} >
                    <Text style={styles.sectionTitle}>1. Aspect Bazlı Analiz</Text>

                    <View style={styles.table}>
                        {/* Başlık satırı tekrar edilsin */}
                        <View style={styles.row} fixed>
                            {['Aspect', 'Pozitif', 'Negatif', 'Nötr'].map(h =>
                                <Text key={h} style={styles.th}>{h}</Text>)}
                        </View>

                        {/* Veri satırları – tek satır bölünmesin */}
                        {Object.entries(aspectAnalysis.aspects).map(([asp, stats]: any, idx) => (
                            <View
                                key={asp}
                                style={[styles.row, idx % 2 ? styles.zebra : null]}
                                wrap={false}                 /* <= satırı asla bölmez */
                            >
                                <Text style={styles.td}>{asp}</Text>
                                <Text style={styles.td}>{stats.positive}</Text>
                                <Text style={styles.td}>{stats.negative}</Text>
                                <Text style={styles.td}>{stats.neutral}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* --- 3. Sentiment Dağılımı --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Sentiment Dağılımı</Text>
                    {sentiments.map(([label, value]) => (
                        <View key={label as string} style={styles.listItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.listText}>{label}: {value}</Text>
                        </View>
                    ))}
                </View>

                {/* --- 4. Öneriler --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Öneriler</Text>
                    {recommendations.items
                        .filter(Boolean)
                        .map((item: string, idx: number) => (
                            <View key={idx} style={styles.listItem}>
                                <Text style={styles.bullet}>•</Text>
                                {richText(item, styles.listText, { ...styles.listText, fontWeight: 'bold' })}
                            </View>
                        ))}
                </View>

                {/* --- 5. Orijinal Yorumlar --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Orijinal Yorumlar</Text>
                    {originalData.map((rec: any) => (
                        <View key={rec.id} style={{ marginBottom: 6 }}>
                            <Text style={{ ...styles.paragraph, fontWeight: 'bold' }}>
                                Yorum {rec.id} ({new Date(rec.publishedAtDate).toLocaleDateString('tr-TR')})
                            </Text>
                            {richText(rec.text, styles.paragraph, { ...styles.paragraph, fontWeight: 'bold' })}
                        </View>
                    ))}
                </View>

                {/* --- 6. AI Tarafından Üretilen Rapor --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. AI Tarafından Üretilen Rapor</Text>
                    {richText(aiGeneratedReport, styles.paragraph, { ...styles.paragraph, fontWeight: 'bold' })}
                </View>

                {/* Footer */}
                <View style={styles.footerWrap}>
                    <View style={styles.footerLine} />
                    <Text style={styles.footerText}>{meta.weekInfo.dateRange}</Text>
                </View>
            </Page>
        </Document>
    );
};
