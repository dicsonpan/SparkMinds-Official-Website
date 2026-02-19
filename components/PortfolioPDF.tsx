import React from 'react';
import {
  Circle,
  Document,
  Font,
  Image,
  Line,
  Page,
  Polygon,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';
import { ContentBlock, PortfolioTheme, SkillCategory, SkillItem, StudentPortfolio } from '../types';

Font.register({
  family: 'Noto Sans SC',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.0.12/files/noto-sans-sc-chinese-simplified-400-normal.woff',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.0.12/files/noto-sans-sc-chinese-simplified-700-normal.woff',
      fontWeight: 700,
    },
  ],
});

Font.registerHyphenationCallback((word) => {
  if (word.length <= 1) {
    return [word];
  }

  return Array.from(word)
    .map((char) => [char, ''])
    .reduce((acc, item) => {
      acc.push(...item);
      return acc;
    }, [] as string[]);
});

type ThemeKey = PortfolioTheme;

interface PdfTheme {
  pageBackground: string;
  cardBackground: string;
  cardSoftBackground: string;
  text: string;
  muted: string;
  accent: string;
  border: string;
  barTrack: string;
  barFill: string;
  tableHeader: string;
  radarStroke: string;
  radarFill: string;
  radarGrid: string;
}

const PDF_THEMES: Record<ThemeKey, PdfTheme> = {
  tech_dark: {
    pageBackground: '#020617',
    cardBackground: '#0f172a',
    cardSoftBackground: '#13223d',
    text: '#e2e8f0',
    muted: '#94a3b8',
    accent: '#67e8f9',
    border: '#244d58',
    barTrack: '#1e293b',
    barFill: '#22d3ee',
    tableHeader: '#12333f',
    radarStroke: '#67e8f9',
    radarFill: 'rgba(103,232,249,0.2)',
    radarGrid: 'rgba(207,250,254,0.4)',
  },
  academic_light: {
    pageBackground: '#f4f1ea',
    cardBackground: '#fffdf8',
    cardSoftBackground: '#f2eee6',
    text: '#1f2937',
    muted: '#78716c',
    accent: '#4338ca',
    border: '#d6d3d1',
    barTrack: '#e7e5e4',
    barFill: '#4338ca',
    tableHeader: '#ece7de',
    radarStroke: '#4338ca',
    radarFill: 'rgba(67,56,202,0.15)',
    radarGrid: '#a8a29e',
  },
  creative_color: {
    pageBackground: '#fff7e8',
    cardBackground: '#fffdf8',
    cardSoftBackground: '#fff2df',
    text: '#0f172a',
    muted: '#92400e',
    accent: '#0f766e',
    border: '#f1c38f',
    barTrack: '#fed7aa',
    barFill: '#14b8a6',
    tableHeader: '#ffedd5',
    radarStroke: '#0d9488',
    radarFill: 'rgba(20,184,166,0.18)',
    radarGrid: '#fdba74',
  },
};

const createStyles = (theme: PdfTheme) =>
  StyleSheet.create({
    page: {
      paddingTop: 30,
      paddingBottom: 52,
      paddingHorizontal: 30,
      fontFamily: 'Noto Sans SC',
      backgroundColor: theme.pageBackground,
      color: theme.text,
      fontSize: 10,
      lineHeight: 1.55,
    },
    badge: {
      alignSelf: 'flex-start',
      fontSize: 8,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: theme.accent,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.cardBackground,
      borderRadius: 999,
      paddingVertical: 3,
      paddingHorizontal: 8,
      marginBottom: 10,
    },
    coverSection: {
      marginBottom: 16,
    },
    coverColumns: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    coverLeft: {
      width: '36%',
      paddingRight: 14,
    },
    coverRight: {
      width: '64%',
      paddingTop: 4,
    },
    coverBadge: {
      alignSelf: 'flex-start',
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      color: theme.accent,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.cardSoftBackground,
      borderRadius: 999,
      paddingVertical: 4,
      paddingHorizontal: 10,
      marginBottom: 14,
    },
    coverAvatarWrap: {
      width: 170,
      height: 170,
      borderRadius: 85,
      overflow: 'hidden',
      borderWidth: 3,
      borderColor: theme.border,
      backgroundColor: theme.cardSoftBackground,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      alignSelf: 'center',
    },
    coverAvatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    coverAvatarFallback: {
      fontSize: 56,
      fontWeight: 700,
      color: theme.accent,
    },
    coverHeroImage: {
      width: '100%',
      height: 142,
      borderRadius: 14,
      objectFit: 'contain',
      backgroundColor: theme.cardSoftBackground,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 10,
    },
    coverName: {
      fontSize: 52,
      fontWeight: 700,
      color: theme.text,
      marginBottom: 2,
      lineHeight: 1.05,
    },
    coverTitle: {
      fontSize: 30,
      color: theme.text,
      marginBottom: 14,
      fontWeight: 700,
      lineHeight: 1.22,
    },
    coverBio: {
      fontSize: 12,
      color: theme.muted,
      lineHeight: 1.82,
    },
    header: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      backgroundColor: theme.cardBackground,
      padding: 14,
      marginBottom: 14,
    },
    headerMain: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    avatarWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: theme.border,
      backgroundColor: theme.cardSoftBackground,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    avatarFallback: {
      fontSize: 30,
      fontWeight: 700,
      color: theme.accent,
    },
    headerContent: {
      flex: 1,
    },
    studentName: {
      fontSize: 24,
      fontWeight: 700,
      color: theme.text,
      marginBottom: 4,
      lineHeight: 1.25,
    },
    studentTitle: {
      fontSize: 11,
      color: theme.accent,
      marginBottom: 8,
      fontWeight: 700,
    },
    studentBio: {
      fontSize: 9.5,
      color: theme.muted,
      lineHeight: 1.5,
    },
    heroRow: {
      marginTop: 10,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    heroImage: {
      width: '32%',
      height: 76,
      borderRadius: 8,
      marginRight: '2%',
      marginBottom: 6,
      objectFit: 'cover',
      backgroundColor: theme.cardSoftBackground,
      borderWidth: 1,
      borderColor: theme.border,
    },
    heroImageLastInRow: {
      marginRight: 0,
    },
    section: {
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 12,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: 700,
      color: theme.text,
      marginBottom: 8,
    },
    sectionHeadingWrap: {
      marginBottom: 12,
      marginTop: 4,
      alignItems: 'center',
    },
    sectionHeadingLine: {
      width: 60,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      marginBottom: 5,
    },
    sectionHeadingText: {
      fontSize: 15,
      fontWeight: 700,
      color: theme.text,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    textBody: {
      fontSize: 10,
      lineHeight: 1.65,
      color: theme.muted,
    },
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginRight: -8,
    },
    infoItem: {
      width: '48%',
      marginRight: '2%',
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.cardSoftBackground,
      borderRadius: 8,
      padding: 8,
    },
    infoLabel: {
      fontSize: 8,
      fontWeight: 700,
      color: theme.muted,
      textTransform: 'uppercase',
      marginBottom: 3,
    },
    infoValue: {
      fontSize: 10,
      fontWeight: 700,
      color: theme.text,
    },
    skillCategory: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      backgroundColor: theme.cardSoftBackground,
      padding: 10,
      marginBottom: 0,
      height: '100%',
    },
    skillsMatrixRow: {
      flexDirection: 'row',
      marginRight: -8,
      marginBottom: 8,
    },
    skillsMatrixCell: {
      width: '48.5%',
      marginRight: '3%',
    },
    skillsMatrixCellLast: {
      marginRight: 0,
    },
    skillsMatrixCellPlaceholder: {
      width: '48.5%',
    },
    skillCategoryTitle: {
      fontSize: 12,
      fontWeight: 700,
      color: theme.accent,
      marginBottom: 8,
    },
    skillRow: {
      marginBottom: 7,
    },
    skillHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    skillName: {
      fontSize: 9,
      fontWeight: 700,
      color: theme.text,
    },
    skillValue: {
      fontSize: 9,
      fontWeight: 700,
      color: theme.accent,
    },
    skillTrack: {
      width: '100%',
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.barTrack,
      overflow: 'hidden',
    },
    skillFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: theme.barFill,
    },
    statGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginRight: -6,
    },
    statItem: {
      width: '31.33%',
      marginRight: '2%',
      marginBottom: 6,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      backgroundColor: theme.cardBackground,
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    statValue: {
      fontSize: 13,
      fontWeight: 700,
      color: theme.accent,
    },
    statLabel: {
      marginTop: 2,
      fontSize: 8,
      color: theme.muted,
      fontWeight: 700,
      textAlign: 'center',
    },
    circleGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginRight: -8,
    },
    circleItem: {
      width: '31.33%',
      marginRight: '2%',
      marginBottom: 10,
      alignItems: 'center',
    },
    circleLabel: {
      marginTop: 4,
      fontSize: 8,
      textAlign: 'center',
      color: theme.text,
      fontWeight: 700,
    },
    timelineItem: {
      borderLeftWidth: 2,
      borderLeftColor: theme.accent,
      paddingLeft: 10,
      marginBottom: 8,
    },
    timelineDate: {
      alignSelf: 'flex-start',
      fontSize: 8,
      fontWeight: 700,
      color: theme.accent,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 6,
      backgroundColor: theme.cardSoftBackground,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginBottom: 5,
    },
    timelineTitle: {
      fontSize: 12,
      fontWeight: 700,
      color: theme.text,
      marginBottom: 4,
      lineHeight: 1.35,
    },
    timelineText: {
      fontSize: 9.5,
      color: theme.muted,
      lineHeight: 1.55,
    },
    timelineImageRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
      marginRight: -6,
    },
    timelineImageFrame: {
      width: '31.33%',
      marginRight: '2%',
      marginBottom: 6,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.cardSoftBackground,
      padding: 4,
    },
    timelineImage: {
      width: '100%',
      height: 96,
      borderRadius: 6,
      objectFit: 'contain',
    },
    starTitle: {
      fontSize: 12,
      fontWeight: 700,
      color: theme.text,
      marginBottom: 8,
    },
    starGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginRight: -6,
    },
    starCard: {
      width: '48%',
      marginRight: '2%',
      marginBottom: 6,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      backgroundColor: theme.cardSoftBackground,
      padding: 8,
    },
    starLabel: {
      fontSize: 8,
      fontWeight: 700,
      color: theme.accent,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    starText: {
      fontSize: 9,
      color: theme.muted,
      lineHeight: 1.45,
    },
    evidenceRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
      marginRight: -6,
    },
    evidenceImageFrame: {
      width: '31.33%',
      marginRight: '2%',
      marginBottom: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.cardSoftBackground,
      padding: 4,
    },
    evidenceImage: {
      width: '100%',
      height: 96,
      borderRadius: 5,
      objectFit: 'contain',
    },
    table: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      overflow: 'hidden',
    },
    tableHeaderRow: {
      flexDirection: 'row',
      backgroundColor: theme.tableHeader,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tableHeaderCell: {
      paddingVertical: 6,
      paddingHorizontal: 6,
      borderRightWidth: 1,
      borderRightColor: theme.border,
    },
    tableHeaderText: {
      fontSize: 8.5,
      fontWeight: 700,
      color: theme.text,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.cardBackground,
    },
    tableAltRow: {
      backgroundColor: theme.cardSoftBackground,
    },
    tableCell: {
      paddingVertical: 6,
      paddingHorizontal: 6,
      borderRightWidth: 1,
      borderRightColor: theme.border,
    },
    tableCellText: {
      fontSize: 8.5,
      color: theme.muted,
      lineHeight: 1.35,
    },
    imageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginRight: -6,
    },
    imageGridItemFrame: {
      width: '31.33%',
      marginRight: '2%',
      marginBottom: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.cardSoftBackground,
      padding: 4,
    },
    imageGridItem: {
      width: '100%',
      height: 150,
      borderRadius: 6,
      objectFit: 'contain',
    },
    footer: {
      position: 'absolute',
      left: 30,
      right: 30,
      bottom: 20,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 6,
      fontSize: 8,
      color: theme.muted,
      textAlign: 'center',
    },
  });

interface PortfolioPDFProps {
  portfolio: StudentPortfolio;
}

interface ProfileData {
  avatarUrl?: string;
  title?: string;
  summary?: string;
  heroImages: string[];
}

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));
const composeStyles = (...styleItems: Array<any | undefined | false>) =>
  styleItems.filter(Boolean) as any;

const pickProfileData = (portfolio: StudentPortfolio, blocks: ContentBlock[]): ProfileData => {
  const profileBlock = blocks.find((item) => item.type === 'profile_header');

  const heroImages =
    profileBlock?.data.hero_image_urls && profileBlock.data.hero_image_urls.length > 0
      ? profileBlock.data.hero_image_urls
      : profileBlock?.data.hero_image_url
        ? [profileBlock.data.hero_image_url]
        : portfolio.hero_image_url
          ? [portfolio.hero_image_url]
          : [];

  return {
    avatarUrl: profileBlock?.data.avatar_url || portfolio.avatar_url,
    title: profileBlock?.data.student_title || portfolio.student_title,
    summary: profileBlock?.data.summary_bio || portfolio.summary_bio,
    heroImages,
  };
};

const renderParagraphs = (text: string | undefined, style: any) => {
  if (!text) {
    return null;
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return null;
  }

  return lines.map((line, index) => (
    <Text key={`${line}-${index}`} style={composeStyles(style, index > 0 && { marginTop: 3 })}>
      {line}
    </Text>
  ));
};

const renderParagraphsWithIndent = (text: string | undefined, style: any) => {
  if (!text) {
    return null;
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return null;
  }

  return lines.map((line, index) => (
    <Text key={`${line}-${index}`} style={composeStyles(style, index > 0 && { marginTop: 4 })}>
      {'\u3000\u3000'}
      {line}
    </Text>
  ));
};

const RadarChart: React.FC<{ items: SkillItem[]; theme: PdfTheme }> = ({ items, theme }) => {
  if (items.length < 3) {
    return null;
  }

  const size = 152;
  const center = size / 2;
  const radius = 48;
  const angleStep = (Math.PI * 2) / items.length;

  const getPoint = (value: number, index: number, scale = radius) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (clampPercent(value) / 100) * scale;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  };

  const points = items.map((item, index) => getPoint(item.value, index)).join(' ');

  return (
    <View>
      <View style={{ alignItems: 'center', marginBottom: 6 }}>
        <Svg width={size} height={size}>
          {[25, 50, 75, 100].map((level) => (
            <Polygon
              key={level}
              points={items.map((_, index) => getPoint(level, index)).join(' ')}
              stroke={theme.radarGrid}
              strokeWidth={1}
              fill="none"
            />
          ))}
          {items.map((_, index) => (
            <Line
              key={index}
              x1={center}
              y1={center}
              x2={getPoint(100, index).split(',')[0]}
              y2={getPoint(100, index).split(',')[1]}
              stroke={theme.radarGrid}
              strokeWidth={1}
            />
          ))}
          <Polygon points={points} fill={theme.radarFill} stroke={theme.radarStroke} strokeWidth={2} />
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginRight: -8 }}>
        {items.map((item, index) => (
          <View key={`${item.name}-${index}`} style={{ width: '48%', marginRight: '2%', marginBottom: 4 }}>
            <Text style={{ fontSize: 8, color: theme.muted }}>
              {item.name}: <Text style={{ color: theme.radarStroke, fontWeight: 700 }}>{item.value}{item.unit || '%'}</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const CircleSkill: React.FC<{ item: SkillItem; theme: PdfTheme; styles: ReturnType<typeof createStyles> }> = ({ item, theme, styles }) => {
  const size = 44;
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampPercent(item.value) / 100) * circumference;

  return (
    <View style={styles.circleItem}>
      <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.border} strokeWidth={4} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.accent}
            strokeWidth={4}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            {...({ strokeDashoffset: offset } as any)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <Text
          style={{
            position: 'absolute',
            top: 17,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 8,
            color: theme.accent,
            fontWeight: 700,
          }}
        >
          {item.value}{item.unit || '%'}
        </Text>
      </View>
      <Text style={styles.circleLabel}>{item.name}</Text>
    </View>
  );
};

const renderSkillsCategory = (
  category: SkillCategory,
  theme: PdfTheme,
  styles: ReturnType<typeof createStyles>,
  key: string,
  layoutStyle?: any,
) => {
  if (category.layout === 'radar') {
    return (
      <View key={key} style={composeStyles(styles.skillCategory, layoutStyle)} wrap={false}>
        <Text style={styles.skillCategoryTitle}>⚡ {category.name}</Text>
        <RadarChart items={category.items} theme={theme} />
      </View>
    );
  }

  if (category.layout === 'circle') {
    return (
      <View key={key} style={composeStyles(styles.skillCategory, layoutStyle)} wrap={false}>
        <Text style={styles.skillCategoryTitle}>⚡ {category.name}</Text>
        <View style={styles.circleGrid}>
          {category.items.map((item, index) => (
            <CircleSkill
              key={`${category.name}-${item.name}-${index}`}
              item={item}
              theme={theme}
              styles={styles}
            />
          ))}
        </View>
      </View>
    );
  }

  if (category.layout === 'stat_grid') {
    return (
      <View key={key} style={composeStyles(styles.skillCategory, layoutStyle)} wrap={false}>
        <Text style={styles.skillCategoryTitle}>⚡ {category.name}</Text>
        <View style={styles.statGrid}>
          {category.items.map((item, index) => (
            <View key={`${category.name}-${item.name}-${index}`} style={styles.statItem}>
              <Text style={styles.statValue}>
                {item.value}
                <Text style={{ fontSize: 8, color: theme.muted }}>{item.unit}</Text>
              </Text>
              <Text style={styles.statLabel}>{item.name}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View key={key} style={composeStyles(styles.skillCategory, layoutStyle)} wrap={false}>
      <Text style={styles.skillCategoryTitle}>⚡ {category.name}</Text>
      {category.items.map((item, index) => (
        <View key={`${category.name}-${item.name}-${index}`} style={styles.skillRow}>
          <View style={styles.skillHeader}>
            <Text style={styles.skillName}>{item.name}</Text>
            <Text style={styles.skillValue}>
              {item.value}
              {item.unit || '%'}
            </Text>
          </View>
          <View style={styles.skillTrack}>
            <View style={[styles.skillFill, { width: `${clampPercent(item.value)}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
};

const renderBlock = (
  block: ContentBlock,
  theme: PdfTheme,
  styles: ReturnType<typeof createStyles>,
): React.ReactNode => {
  if (block.type === 'profile_header') {
    return null;
  }

  if (block.type === 'section_heading') {
    return (
      <View key={block.id} style={styles.sectionHeadingWrap} wrap={false}>
        <View style={styles.sectionHeadingLine} />
        <Text style={styles.sectionHeadingText}>{block.data.title || 'Section'}</Text>
      </View>
    );
  }

  if (block.type === 'text') {
    return (
      <View key={block.id} style={styles.section}>
        {block.data.title ? <Text style={styles.sectionTitle}>{block.data.title}</Text> : null}
        {renderParagraphs(block.data.content, styles.textBody)}
      </View>
    );
  }

  if (block.type === 'info_list') {
    return (
      <View key={block.id} style={styles.section} wrap={false}>
        {block.data.title ? <Text style={styles.sectionTitle}>{block.data.title}</Text> : null}
        <View style={styles.infoGrid}>
          {block.data.info_items?.map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.infoItem}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (block.type === 'skills_matrix') {
    const categories = block.data.skills_categories || [];
    const categoryRows: SkillCategory[][] = [];

    for (let index = 0; index < categories.length; index += 2) {
      categoryRows.push(categories.slice(index, index + 2));
    }

    return (
      <View key={block.id} style={styles.section}>
        <Text style={styles.sectionTitle}>{block.data.title || '技能矩阵'}</Text>
        {categoryRows.map((row, rowIndex) => (
          <View
            key={`${block.id}-skills-row-${rowIndex}`}
            style={composeStyles(
              styles.skillsMatrixRow,
              rowIndex === categoryRows.length - 1 && { marginBottom: 0 },
            )}
            wrap={false}
          >
            {row.map((category, colIndex) =>
              renderSkillsCategory(
                category,
                theme,
                styles,
                `${block.id}-${category.name}-${rowIndex}-${colIndex}`,
                composeStyles(
                  styles.skillsMatrixCell,
                  colIndex === row.length - 1 && styles.skillsMatrixCellLast,
                ),
              ),
            )}
            {row.length === 1 ? <View style={styles.skillsMatrixCellPlaceholder} /> : null}
          </View>
        ))}
      </View>
    );
  }

  if (block.type === 'timeline_node') {
    const timelineUrls = block.data.urls || [];

    return (
      <View key={block.id} style={styles.section}>
        <View style={styles.timelineItem}>
          {block.data.date ? <Text style={styles.timelineDate}>{block.data.date}</Text> : null}
          {block.data.title ? <Text style={styles.timelineTitle}>{block.data.title}</Text> : null}
          {renderParagraphs(block.data.content, styles.timelineText)}
          {timelineUrls.length > 0 ? (
            <View style={styles.timelineImageRow}>
              {timelineUrls.map((url, index) => (
                <View
                  key={`${url}-${index}`}
                  style={composeStyles(
                    styles.timelineImageFrame,
                    timelineUrls.length === 1 && { width: '100%', marginRight: 0 },
                    timelineUrls.length === 2 && { width: '49%', marginRight: '2%' },
                    timelineUrls.length === 2 && index === 1 && { marginRight: 0 },
                    timelineUrls.length > 2 && index % 3 === 2 && { marginRight: 0 },
                  )}
                >
                  <Image
                    src={url}
                    style={composeStyles(
                      styles.timelineImage,
                      timelineUrls.length === 1 && { height: 220 },
                      timelineUrls.length === 2 && { height: 170 },
                    )}
                  />
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  if (block.type === 'project_highlight') {
    const starItems = [
      { label: 'S Situation / 背景', content: block.data.star_situation },
      { label: 'T Task / 任务', content: block.data.star_task },
      { label: 'A Action / 行动', content: block.data.star_action },
      { label: 'R Result / 结果', content: block.data.star_result },
    ];

    return (
      <View key={block.id} style={styles.section}>
        <Text style={styles.starTitle}>{block.data.title || 'Project Highlight'}</Text>
        <View style={styles.starGrid}>
          {starItems.map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.starCard}>
              <Text style={styles.starLabel}>{item.label}</Text>
              <Text style={styles.starText}>{item.content || '暂无描述'}</Text>
            </View>
          ))}
        </View>
        {block.data.evidence_urls && block.data.evidence_urls.length > 0 ? (
          <View style={styles.evidenceRow}>
            {block.data.evidence_urls.map((url, index) => (
              <View
                key={`${url}-${index}`}
                style={composeStyles(
                  styles.evidenceImageFrame,
                  block.data.evidence_urls?.length === 1 && { width: '100%', marginRight: 0 },
                  block.data.evidence_urls?.length === 2 && { width: '49%', marginRight: '2%' },
                  block.data.evidence_urls?.length === 2 && index === 1 && { marginRight: 0 },
                  (block.data.evidence_urls?.length || 0) > 2 && index % 3 === 2 && { marginRight: 0 },
                )}
              >
                <Image
                  src={url}
                  style={composeStyles(
                    styles.evidenceImage,
                    block.data.evidence_urls?.length === 1 && { height: 220 },
                    block.data.evidence_urls?.length === 2 && { height: 170 },
                  )}
                />
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  if (block.type === 'table') {
    const columns = block.data.table_columns || [];
    const rows = block.data.table_rows || [];
    const colCount = Math.max(columns.length, 1);
    const colWidth = `${100 / colCount}%`;

    return (
      <View key={block.id} style={styles.section} wrap={false}>
        {block.data.title ? <Text style={styles.sectionTitle}>{block.data.title}</Text> : null}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            {columns.map((column, index) => (
              <View
                key={`${column}-${index}`}
                style={[
                  styles.tableHeaderCell,
                  { width: colWidth, borderRightWidth: index === columns.length - 1 ? 0 : 1 },
                ]}
              >
                <Text style={styles.tableHeaderText}>{column}</Text>
              </View>
            ))}
          </View>

          {rows.map((row, rowIndex) => (
            <View
              key={`${block.id}-row-${rowIndex}`}
              style={composeStyles(
                styles.tableRow,
                rowIndex % 2 === 1 && styles.tableAltRow,
                rowIndex === rows.length - 1 && { borderBottomWidth: 0 },
              )}
            >
              {row.map((cell, cellIndex) => (
                <View
                  key={`${block.id}-cell-${rowIndex}-${cellIndex}`}
                  style={[
                    styles.tableCell,
                    { width: colWidth, borderRightWidth: cellIndex === colCount - 1 ? 0 : 1 },
                  ]}
                >
                  <Text style={styles.tableCellText}>{cell}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (block.type === 'image_grid' && block.data.urls && block.data.urls.length > 0) {
    const urls = block.data.urls;

    const dynamicStyle =
      urls.length === 1
        ? { width: '100%', marginRight: 0 }
        : urls.length === 2
          ? { width: '49%', marginRight: '2%' }
          : undefined;

    const imageStyle =
      urls.length === 1
        ? { height: 280 }
        : urls.length === 2
          ? { height: 220 }
          : { height: 160 };

    return (
      <View key={block.id} style={styles.section}>
        {block.data.title ? <Text style={styles.sectionTitle}>{block.data.title}</Text> : null}
        <View style={styles.imageGrid}>
          {urls.map((url, index) => (
            <View
              key={`${url}-${index}`}
              style={composeStyles(
                styles.imageGridItemFrame,
                dynamicStyle,
                urls.length > 2 && index % 3 === 2 && { marginRight: 0 },
                urls.length === 2 && index === 1 && { marginRight: 0 },
              )}
            >
              <Image src={url} style={composeStyles(styles.imageGridItem, imageStyle)} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return null;
};

export const PortfolioPDF: React.FC<PortfolioPDFProps> = ({ portfolio }) => {
  const themeKey: ThemeKey = portfolio.theme_config?.theme || 'tech_dark';
  const theme = PDF_THEMES[themeKey] || PDF_THEMES.tech_dark;
  const styles = createStyles(theme);

  const blocks = Array.isArray(portfolio.content_blocks) ? portfolio.content_blocks : [];
  const profileData = pickProfileData(portfolio, blocks);
  const coverImages = profileData.heroImages.slice(0, 2);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.coverSection}>
          <View style={styles.coverColumns}>
            <View style={styles.coverLeft}>
              <View style={styles.coverAvatarWrap}>
                {profileData.avatarUrl ? (
                  <Image src={profileData.avatarUrl} style={styles.coverAvatarImage} />
                ) : (
                  <Text style={styles.coverAvatarFallback}>{portfolio.student_name[0] || 'S'}</Text>
                )}
              </View>
              {coverImages.map((url, index) => (
                <Image
                  key={`${url}-${index}`}
                  src={url}
                  style={composeStyles(styles.coverHeroImage, index === coverImages.length - 1 && { marginBottom: 0 })}
                />
              ))}
            </View>

            <View style={styles.coverRight}>
              <Text style={styles.coverBadge}>SparkMinds Portfolio</Text>
              <Text style={styles.coverName}>{portfolio.student_name}</Text>
              <Text style={styles.coverTitle}>{profileData.title || 'Future Innovator & Builder'}</Text>
              {renderParagraphsWithIndent(profileData.summary, styles.coverBio)}
            </View>
          </View>
        </View>

        {blocks.map((block) => renderBlock(block, theme, styles))}

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Generated by SparkMinds Portfolio System | ${new Date().toLocaleDateString('zh-CN')} | ${pageNumber}/${totalPages}`
          }
        />
      </Page>
    </Document>
  );
};
