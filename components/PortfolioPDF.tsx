import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font, Svg, Polygon, Line, Circle } from '@react-pdf/renderer';
import { StudentPortfolio, ContentBlock, SkillCategory, SkillItem } from '../types';

// Register a Chinese font from a reliable CDN
Font.register({
  family: 'Noto Sans SC',
  src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.0.12/files/noto-sans-sc-chinese-simplified-400-normal.woff'
});

// Hyphenation callback to fix Chinese wrapping
Font.registerHyphenationCallback((word) => {
  if (word.length === 1) return [word];
  return Array.from(word).map(char => [char, '']).reduce((arr, current) => {
      arr.push(...current);
      return arr;
  }, [] as string[]);
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontFamily: 'Noto Sans SC',
    backgroundColor: '#ffffff',
    color: '#334155', // Slate 700
    fontSize: 10,
    lineHeight: 1.5
  },
  // === 1. Header Section ===
  headerContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 20
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 20,
    backgroundColor: '#f1f5f9',
    objectFit: 'cover'
  },
  headerInfo: {
    flex: 1
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'heavy', // 'heavy' works better for bold in some fonts
    color: '#0f172a', // Slate 900
    marginBottom: 4
  },
  studentTitle: {
    fontSize: 12,
    color: '#2563eb', // Blue 600
    textTransform: 'uppercase',
    marginBottom: 6,
    fontWeight: 'bold'
  },
  bio: {
    fontSize: 9,
    color: '#64748b',
    lineHeight: 1.4,
    textAlign: 'justify'
  },
  headerImages: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    height: 80,
    overflow: 'hidden'
  },
  headerHeroImg: {
    flex: 1,
    height: '100%',
    borderRadius: 4,
    objectFit: 'cover',
    backgroundColor: '#f8fafc'
  },

  // === General Blocks ===
  sectionContainer: {
    marginBottom: 20,
    width: '100%'
  },
  
  // === Section Heading ===
  sectionHeadingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 15,
    textTransform: 'uppercase'
  },

  // === STAR Project ===
  starContainer: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#ffffff'
  },
  starHeader: {
    padding: '8 12',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  starTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  // The 2x2 Grid
  starGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  starCell: {
    width: '50%',
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  starLabel: {
    fontSize: 8,
    color: '#2563eb', // Blue Accent
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  starText: {
    fontSize: 9,
    color: '#334155'
  },
  // Evidence Section
  starEvidenceContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
  },
  evidenceLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  evidenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },

  // === Timeline ===
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#e2e8f0'
  },
  timelineDateBox: {
    width: 70,
    marginRight: 10
  },
  timelineDate: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    padding: '2 6',
    borderRadius: 4,
    textAlign: 'center'
  },
  timelineContent: {
    flex: 1
  },
  timelineTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2
  },
  timelineDesc: {
    fontSize: 9,
    color: '#475569'
  },
  timelineImages: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6
  },
  timelineImg: {
    width: 80,
    height: 50,
    borderRadius: 2,
    objectFit: 'cover'
  },

  // === Skills ===
  skillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15
  },
  skillGroup: {
    width: '47%', // 2 cols
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 6
  },
  skillGroupTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    alignItems: 'center'
  },
  skillName: {
    fontSize: 9,
    color: '#334155'
  },
  skillBarContainer: {
    width: '50%',
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginLeft: 5
  },
  skillBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 2
  },

  // === Info List ===
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  infoItem: {
    width: '31%',
    marginBottom: 6
  },
  infoLabel: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 1
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a'
  },

  // === Image Grid ===
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },

  // === Table ===
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  tableCellHeader: {
    padding: 6,
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0'
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
    color: '#334155',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0'
  },

  // === Footer ===
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#cbd5e1',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10
  }
});

// --- Chart Components ---

const RadarChart = ({ items }: { items: SkillItem[] }) => {
    if (!items || items.length < 3) return null; // Need at least 3 points
    const size = 150;
    const center = size / 2;
    const radius = 50;
    const angleStep = (Math.PI * 2) / items.length;

    const getPoint = (value: number, index: number, rScale = radius) => {
        const angle = index * angleStep - Math.PI / 2;
        const r = (value / 100) * rScale;
        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    };

    const dataPoints = items.map((item, i) => getPoint(item.value, i)).join(' ');

    return (
        <View style={{ alignItems: 'center', marginVertical: 10 }}>
            <Svg width={size} height={size}>
                {/* Background Grid */}
                {[0.5, 1].map((scale, i) => (
                    <Polygon key={i} points={items.map((_, idx) => getPoint(100 * scale, idx)).join(' ')} stroke="#cbd5e1" strokeWidth={1} fill="none" />
                ))}
                {/* Axes */}
                {items.map((_, i) => (
                    <Line key={i} x1={center} y1={center} x2={getPoint(100, i).split(',')[0]} y2={getPoint(100, i).split(',')[1]} stroke="#cbd5e1" strokeWidth={1} />
                ))}
                {/* Data */}
                <Polygon points={dataPoints} fill="rgba(37, 99, 235, 0.1)" stroke="#2563eb" strokeWidth={2} />
                {/* Labels */}
                {items.map((item, i) => {
                    const [x, y] = getPoint(100, i, radius + 15).split(',').map(Number);
                    return <Text key={i} x={x - 10} y={y} style={{ fontSize: 8, fill: '#334155' }}>{item.name}</Text>;
                })}
            </Svg>
        </View>
    );
};

// --- Main Document Component ---

export const PortfolioPDF: React.FC<{ portfolio: StudentPortfolio }> = ({ portfolio }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* === 1. Profile Header === */}
        {portfolio.content_blocks
          .filter(b => b.type === 'profile_header')
          .map(block => (
            <View key={block.id} style={styles.headerContainer}>
              <View style={styles.headerTopRow}>
                {block.data.avatar_url && (
                  <Image src={block.data.avatar_url} style={styles.avatar} />
                )}
                <View style={styles.headerInfo}>
                  <Text style={styles.studentName}>{portfolio.student_name}</Text>
                  {block.data.student_title && <Text style={styles.studentTitle}>{block.data.student_title}</Text>}
                  {block.data.summary_bio && <Text style={styles.bio}>{block.data.summary_bio}</Text>}
                </View>
              </View>
              {/* Hero Images Strip */}
              {block.data.hero_image_urls && block.data.hero_image_urls.length > 0 && (
                <View style={styles.headerImages}>
                  {block.data.hero_image_urls.slice(0, 4).map((url, i) => (
                    <Image key={i} src={url} style={styles.headerHeroImg} />
                  ))}
                </View>
              )}
            </View>
        ))}

        {/* === Other Blocks === */}
        {portfolio.content_blocks.map((block) => {
          if (block.type === 'profile_header') return null;

          // -- Section Heading --
          if (block.type === 'section_heading') {
            return <Text key={block.id} style={styles.sectionHeadingTitle}>{block.data.title}</Text>;
          }

          // -- Text --
          if (block.type === 'text') {
            return (
              <View key={block.id} style={styles.sectionContainer}>
                {block.data.title && <Text style={{fontSize: 12, fontWeight: 'bold', marginBottom: 5}}>{block.data.title}</Text>}
                <Text style={{fontSize: 10, lineHeight: 1.5, textAlign: 'justify'}}>{block.data.content}</Text>
              </View>
            );
          }

          // -- STAR Project --
          if (block.type === 'project_highlight') {
            return (
              <View key={block.id} style={styles.sectionContainer}>
                <View style={styles.starContainer}>
                  <View style={styles.starHeader}>
                    <Text style={styles.starTitle}>{block.data.title || 'Project Highlight'}</Text>
                  </View>
                  <View style={styles.starGrid}>
                    <View style={styles.starCell}><Text style={styles.starLabel}>SITUATION (背景)</Text><Text style={styles.starText}>{block.data.star_situation}</Text></View>
                    <View style={[styles.starCell, {borderRightWidth: 0}]}><Text style={styles.starLabel}>TASK (任务)</Text><Text style={styles.starText}>{block.data.star_task}</Text></View>
                    <View style={[styles.starCell, {borderBottomWidth: 0}]}><Text style={styles.starLabel}>ACTION (行动)</Text><Text style={styles.starText}>{block.data.star_action}</Text></View>
                    <View style={[styles.starCell, {borderRightWidth: 0, borderBottomWidth: 0}]}><Text style={styles.starLabel}>RESULT (结果)</Text><Text style={styles.starText}>{block.data.star_result}</Text></View>
                  </View>
                  {/* Dynamic Evidence Grid */}
                  {block.data.evidence_urls && block.data.evidence_urls.length > 0 && (
                    <View style={styles.starEvidenceContainer}>
                      <Text style={styles.evidenceLabel}>Project Evidence</Text>
                      <View style={styles.evidenceGrid}>
                        {block.data.evidence_urls.map((url, i) => {
                           const count = block.data.evidence_urls!.length;
                           // Dynamic Sizing Logic for PDF
                           let imgStyle = { borderRadius: 4, objectFit: 'cover' as any, backgroundColor: '#f1f5f9' };
                           if (count === 1) {
                               Object.assign(imgStyle, { width: '100%', height: 250 });
                           } else if (count === 2) {
                               Object.assign(imgStyle, { width: '48%', height: 150 });
                           } else {
                               Object.assign(imgStyle, { width: '31%', height: 100 });
                           }
                           return <Image key={i} src={url} style={imgStyle} />;
                        })}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          }

          // -- Timeline --
          if (block.type === 'timeline_node') {
            return (
              <View key={block.id} style={styles.timelineItem} wrap={false}>
                <View style={styles.timelineDateBox}>
                  <Text style={styles.timelineDate}>{block.data.date}</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{block.data.title}</Text>
                  <Text style={styles.timelineDesc}>{block.data.content}</Text>
                  {block.data.urls && (
                    <View style={styles.timelineImages}>
                      {block.data.urls.map((url, i) => <Image key={i} src={url} style={styles.timelineImg} />)}
                    </View>
                  )}
                </View>
              </View>
            );
          }

          // -- Skills Matrix --
          if (block.type === 'skills_matrix') {
            return (
              <View key={block.id} style={styles.sectionContainer} wrap={false}>
                <View style={styles.skillContainer}>
                  {block.data.skills_categories?.map((cat, i) => (
                    <View key={i} style={[styles.skillGroup, cat.layout === 'radar' ? {width: '100%'} : {}]}>
                      <Text style={styles.skillGroupTitle}>{cat.name}</Text>
                      {cat.layout === 'radar' ? (
                        <RadarChart items={cat.items} />
                      ) : (
                        cat.items.map((skill, si) => (
                          <View key={si} style={styles.skillRow}>
                            <Text style={styles.skillName}>{skill.name}</Text>
                            <View style={styles.skillBarContainer}>
                              <View style={[styles.skillBarFill, { width: `${Math.min(100, Math.max(0, skill.value))}%` }]} />
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  ))}
                </View>
              </View>
            );
          }

          // -- Info List --
          if (block.type === 'info_list') {
            return (
              <View key={block.id} style={styles.sectionContainer}>
                {block.data.title && <Text style={{fontSize: 12, fontWeight: 'bold', marginBottom: 5}}>{block.data.title}</Text>}
                <View style={styles.infoGrid}>
                  {block.data.info_items?.map((item, i) => (
                    <View key={i} style={styles.infoItem}>
                      <Text style={styles.infoLabel}>{item.label}</Text>
                      <Text style={styles.infoValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          }

          // -- Image Grid --
          if (block.type === 'image_grid') {
             return (
               <View key={block.id} style={styles.sectionContainer} wrap={false}>
                  {block.data.title && <Text style={{fontSize: 12, fontWeight: 'bold', marginBottom: 8}}>{block.data.title}</Text>}
                  <View style={styles.galleryGrid}>
                     {block.data.urls?.map((url, i) => (
                        <Image key={i} src={url} style={{width: '31%', height: 100, borderRadius: 4, objectFit: 'cover'}} />
                     ))}
                  </View>
               </View>
             );
          }

          // -- Table --
          if (block.type === 'table') {
             const colWidth = `${100 / (block.data.table_columns?.length || 1)}%`;
             return (
               <View key={block.id} style={styles.sectionContainer} wrap={false}>
                  {block.data.title && <Text style={{fontSize: 12, fontWeight: 'bold', marginBottom: 5}}>{block.data.title}</Text>}
                  <View style={styles.table}>
                     <View style={styles.tableRow}>
                        {block.data.table_columns?.map((col, i) => (
                           <View key={i} style={[styles.tableCellHeader, {width: colWidth, borderRightWidth: i === block.data.table_columns!.length-1 ? 0 : 1}]}><Text>{col}</Text></View>
                        ))}
                     </View>
                     {block.data.table_rows?.map((row, rIdx) => (
                        <View key={rIdx} style={[styles.tableRow, {borderBottomWidth: rIdx === block.data.table_rows!.length-1 ? 0 : 1}]}>
                           {row.map((cell, cIdx) => (
                              <View key={cIdx} style={[styles.tableCell, {width: colWidth, borderRightWidth: cIdx === row.length-1 ? 0 : 1}]}><Text>{cell}</Text></View>
                           ))}
                        </View>
                     ))}
                  </View>
               </View>
             );
          }

          return null;
        })}

        <Text style={styles.footer}>
          Generated by SparkMinds Lab | {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  );
};