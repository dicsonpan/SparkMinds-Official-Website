import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font, Svg, Polygon, Line, Circle } from '@react-pdf/renderer';
import { StudentPortfolio, ContentBlock, SkillCategory, SkillItem } from '../types';

// Register the Microsoft YaHei font located in the public folder to support Chinese characters
Font.register({
  family: 'Microsoft YaHei',
  src: '/microsoft yahei.ttf'
});

// 【关键修复】注册断行回调函数
// 解决中文被视为一个长单词而不换行的问题
Font.registerHyphenationCallback(word => {
  // 只有当单词长度大于1时才处理（避免处理单个字符）
  if (word.length === 1) return [word];
  
  // 将字符串拆分为字符数组，告诉引擎可以在任意字符之间断行
  return Array.from(word);
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Microsoft YaHei',
    backgroundColor: '#ffffff',
    color: '#334155', // Slate 700
    fontSize: 10,
    lineHeight: 1.6
  },
  // === Header ===
  header: {
    flexDirection: 'row',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#2563eb', // Blue 600
    paddingBottom: 20,
    alignItems: 'flex-start' 
  },
  headerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    marginRight: 20,
    objectFit: 'cover'
  },
  headerContent: {
    flex: 1,
    flexDirection: 'column'
  },
  studentName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a', // Slate 900
    marginBottom: 4
  },
  studentTitle: {
    fontSize: 12,
    color: '#2563eb', // Blue 600
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  studentBio: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 1.5,
    textAlign: 'justify'
  },

  // === Section Defaults ===
  section: {
    marginBottom: 15,
    width: '100%'
  },
  
  // === Section Heading ===
  sectionHeadingContainer: {
    marginTop: 15,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: '#f1f5f9'
  },
  sectionHeadingTitle: {
    fontSize: 16,
    fontWeight: 'heavy',
    color: '#0f172a',
    textTransform: 'uppercase'
  },

  // === Info List (Grid) ===
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5
  },
  infoItem: {
    width: '32%', // 3 columns with gap
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  infoLabel: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a'
  },

  // === Skills (Progress Bars) ===
  skillCategory: {
    marginBottom: 10,
    width: '100%'
  },
  skillCategoryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#475569',
    backgroundColor: '#f1f5f9',
    padding: '4 8',
    borderRadius: 4
  },
  // -- Bar Layout --
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  skillItem: {
    width: '48%', // 2 columns
    marginBottom: 6
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3
  },
  skillName: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#334155'
  },
  skillScore: {
    fontSize: 9,
    color: '#2563eb',
    fontWeight: 'bold'
  },
  skillTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden'
  },
  skillFill: {
    height: '100%',
    backgroundColor: '#2563eb'
  },
  // -- Stat Grid Layout --
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  statItem: {
    width: '32%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    marginBottom: 6
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 2
  },
  statLabel: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  // -- Circle Layout --
  circleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start'
  },
  circleItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 10
  },

  // === Timeline ===
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 15,
    borderLeftWidth: 2,
    borderLeftColor: '#e2e8f0',
    paddingLeft: 15,
    marginLeft: 5
  },
  timelineContent: {
    flex: 1
  },
  timelineDate: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 2,
    backgroundColor: '#eff6ff',
    padding: '2 6',
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4
  },
  timelineDesc: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.5,
    textAlign: 'justify'
  },
  timelineImages: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  timelineImg: {
    width: 140,  // Increased size
    height: 90,
    borderRadius: 4,
    objectFit: 'cover',
    backgroundColor: '#f1f5f9'
  },

  // === STAR Project ===
  starContainer: {
    marginTop: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    overflow: 'hidden'
  },
  starHeader: {
    padding: '8 12',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1'
  },
  starTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  starGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  starBox: {
    width: '50%', // 2x2 Grid
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  starLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
    opacity: 0.8
  },
  starText: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 1.4
  },
  starEvidence: {
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },

  // === Image Grid ===
  imageGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  // Default Style (3 cols)
  imageGridItem: {
    width: '31%', 
    height: 120,
    borderRadius: 4,
    objectFit: 'cover',
    backgroundColor: '#f1f5f9',
    marginBottom: 8
  },

  // === Text Block ===
  textBlock: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#334155',
    textAlign: 'justify'
  },

  // === Table ===
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 5
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    alignItems: 'center'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    minHeight: 24,
    alignItems: 'center'
  },
  tableHeaderCell: {
    padding: 8,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
    textAlign: 'left'
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
    color: '#334155',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    textAlign: 'left'
  },

  // === Footer ===
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    textAlign: 'center',
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10
  }
});

interface PortfolioPDFProps {
  portfolio: StudentPortfolio;
}

// === Chart Helpers ===

// Helper: Radar Chart
const RadarChart = ({ items }: { items: SkillItem[] }) => {
    const size = 180;
    const center = size / 2;
    const radius = 60;
    const angleStep = (Math.PI * 2) / items.length;

    const getPoint = (value: number, index: number, rScale = radius) => {
        const angle = index * angleStep - Math.PI / 2;
        const r = (value / 100) * rScale;
        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    };

    const dataPoints = items.map((item, i) => getPoint(item.value, i)).join(' ');

    return (
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <Svg width={size} height={size}>
                {/* Grid Background */}
                {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                    <Polygon
                        key={i}
                        points={items.map((_, idx) => getPoint(100 * scale, idx)).join(' ')}
                        stroke="#cbd5e1"
                        strokeWidth={1}
                        fill="none"
                    />
                ))}
                {/* Axes */}
                {items.map((_, i) => (
                    <Line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={getPoint(100, i).split(',')[0]}
                        y2={getPoint(100, i).split(',')[1]}
                        stroke="#cbd5e1"
                        strokeWidth={1}
                    />
                ))}
                {/* Data Shape */}
                <Polygon
                    points={dataPoints}
                    fill="rgba(37, 99, 235, 0.1)"
                    stroke="#2563eb"
                    strokeWidth={2}
                />
                {/* Labels at vertices */}
                {items.map((item, i) => {
                    // Position label slightly outside the last grid ring
                    const [x, y] = getPoint(100, i, radius + 15).split(',').map(Number);
                    // Simple offset adjustment to center text approximately
                    const adjX = x > center ? 0 : x < center ? -20 : -10;
                    const adjY = y > center ? 5 : -5;
                    return (
                        <Text
                            key={i}
                            x={x + adjX}
                            y={y + adjY}
                            style={{ fontSize: 8, fill: '#334155', fontFamily: 'Microsoft YaHei' }}
                        >
                            {item.name}
                        </Text>
                    );
                })}
            </Svg>
            {/* Legend for exact values */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: -20 }}>
                {items.map((item, i) => (
                    <Text key={i} style={{ fontSize: 8, color: '#64748b' }}>
                        {item.name}: <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>{item.value}%</Text>
                    </Text>
                ))}
            </View>
        </View>
    );
};

// Helper: Circle Chart
const CircleChart = ({ item }: { item: SkillItem }) => {
    const size = 50;
    const r = 20;
    const c = 2 * Math.PI * r;
    const offset = c - (Math.min(100, Math.max(0, item.value)) / 100) * c;

    return (
        <View style={styles.circleItem}>
            <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Svg width={size} height={size}>
                    <Circle cx={size/2} cy={size/2} r={r} stroke="#e2e8f0" strokeWidth={4} fill="none" />
                    <Circle 
                        cx={size/2} 
                        cy={size/2} 
                        r={r} 
                        stroke="#2563eb" 
                        strokeWidth={4} 
                        fill="none" 
                        strokeDasharray={`${c} ${c}`}
                        {...({ strokeDashoffset: offset } as any)}
                        transform={`rotate(-90 ${size/2} ${size/2})`}
                    />
                </Svg>
                <Text style={{ position: 'absolute', fontSize: 10, fontWeight: 'bold', color: '#2563eb', top: 19, left: 0, right: 0, textAlign: 'center' }}>
                    {item.value}%
                </Text>
            </View>
            <Text style={{ fontSize: 8, fontWeight: 'bold', marginTop: 4, textAlign: 'center', color: '#334155' }}>
                {item.name}
            </Text>
        </View>
    );
};

// Helper: Stat Grid
const StatBox = ({ item }: { item: SkillItem }) => (
    <View style={styles.statItem}>
        <Text style={styles.statValue}>
            {item.value}<Text style={{ fontSize: 10, color: '#64748b', fontWeight: 'normal' }}>{item.unit}</Text>
        </Text>
        <Text style={styles.statLabel}>{item.name}</Text>
    </View>
);


export const PortfolioPDF: React.FC<PortfolioPDFProps> = ({ portfolio }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* === 1. Profile Header (Main) === */}
        <View style={styles.header}>
          {portfolio.avatar_url && (
             <Image src={portfolio.avatar_url} style={styles.headerAvatar} />
          )}
          <View style={styles.headerContent}>
            <Text style={styles.studentName}>{portfolio.student_name}</Text>
            {portfolio.student_title && <Text style={styles.studentTitle}>{portfolio.student_title}</Text>}
            {portfolio.summary_bio && <Text style={styles.studentBio}>{portfolio.summary_bio}</Text>}
          </View>
        </View>

        {/* Content Blocks Loop */}
        {portfolio.content_blocks.map((block, index) => {
          
          if (block.type === 'profile_header') return null; 

          // === 5. Section Heading ===
          if (block.type === 'section_heading') {
            return (
              <View key={block.id} style={styles.sectionHeadingContainer} wrap={false}>
                <Text style={styles.sectionHeadingTitle}>{block.data.title}</Text>
              </View>
            );
          }

          // === 7. Info List ===
          if (block.type === 'info_list') {
            return (
              <View key={block.id} style={styles.section} wrap={false}>
                {block.data.title && <Text style={{fontSize: 12, fontWeight: 'bold', marginBottom: 8}}>{block.data.title}</Text>}
                <View style={styles.infoGrid}>
                  {block.data.info_items?.map((item, idx) => (
                    <View key={idx} style={styles.infoItem}>
                      <Text style={styles.infoLabel}>{item.label}</Text>
                      <Text style={styles.infoValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          }

          // === 2. Skills Matrix (UPDATED) ===
          if (block.type === 'skills_matrix') {
            return (
              <View key={block.id} style={styles.section} wrap={false}>
                {block.data.skills_categories?.map((cat: SkillCategory, idx: number) => (
                  <View key={idx} style={styles.skillCategory}>
                    <Text style={styles.skillCategoryTitle}>{cat.name}</Text>
                    
                    {/* Render based on layout type */}
                    {cat.layout === 'radar' ? (
                        <RadarChart items={cat.items} />
                    ) : cat.layout === 'circle' ? (
                        <View style={styles.circleGrid}>
                            {cat.items.map((skill, sIdx) => (
                                <CircleChart key={sIdx} item={skill} />
                            ))}
                        </View>
                    ) : cat.layout === 'stat_grid' ? (
                        <View style={styles.statGrid}>
                            {cat.items.map((skill, sIdx) => (
                                <StatBox key={sIdx} item={skill} />
                            ))}
                        </View>
                    ) : (
                        // Default 'bar' layout
                        <View style={styles.skillRow}>
                            {cat.items.map((skill: SkillItem, sIdx: number) => (
                                <View key={sIdx} style={styles.skillItem}>
                                    <View style={styles.skillHeader}>
                                        <Text style={styles.skillName}>{skill.name}</Text>
                                        <Text style={styles.skillScore}>{skill.value}{skill.unit || '%'}</Text>
                                    </View>
                                    <View style={styles.skillTrack}>
                                        <View style={[styles.skillFill, { width: `${Math.min(100, Math.max(0, skill.value))}%` }]} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                  </View>
                ))}
              </View>
            );
          }

          // === 3. Timeline Node ===
          if (block.type === 'timeline_node') {
             return (
               <View key={block.id} style={[styles.section, styles.timelineRow]} wrap={false}>
                  <View style={styles.timelineContent}>
                     <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4}}>
                        <Text style={styles.timelineDate}>{block.data.date}</Text>
                        <Text style={styles.timelineTitle}>{block.data.title}</Text>
                     </View>
                     <Text style={styles.timelineDesc}>{block.data.content}</Text>
                     {block.data.urls && block.data.urls.length > 0 && (
                        <View style={styles.timelineImages}>
                           {block.data.urls.map((url, i) => (
                              <Image key={i} src={url} style={styles.timelineImg} />
                           ))}
                        </View>
                     )}
                  </View>
               </View>
             )
          }

          // === 4. STAR Project ===
          if (block.type === 'project_highlight') {
            return (
              <View key={block.id} style={styles.section} wrap={false}>
                <View style={styles.starContainer}>
                  <View style={styles.starHeader}>
                    <Text style={styles.starTitle}>{block.data.title || 'Project Highlight'}</Text>
                  </View>
                  <View style={styles.starGrid}>
                    <View style={styles.starBox}>
                      <Text style={styles.starLabel}>SITUATION (背景)</Text>
                      <Text style={styles.starText}>{block.data.star_situation}</Text>
                    </View>
                    <View style={[styles.starBox, { borderRightWidth: 0 }]}>
                      <Text style={styles.starLabel}>TASK (任务)</Text>
                      <Text style={styles.starText}>{block.data.star_task}</Text>
                    </View>
                    <View style={[styles.starBox, { borderBottomWidth: 0 }]}>
                      <Text style={styles.starLabel}>ACTION (行动)</Text>
                      <Text style={styles.starText}>{block.data.star_action}</Text>
                    </View>
                    <View style={[styles.starBox, { borderRightWidth: 0, borderBottomWidth: 0 }]}>
                      <Text style={styles.starLabel}>RESULT (结果)</Text>
                      <Text style={styles.starText}>{block.data.star_result}</Text>
                    </View>
                  </View>
                  {block.data.evidence_urls && block.data.evidence_urls.length > 0 && (
                    <View style={styles.starEvidence}>
                        <Text style={{fontSize: 8, fontWeight: 'bold', marginBottom: 6, color: '#64748b'}}>EVIDENCE</Text>
                        <View style={{flexDirection: 'row', gap: 8, flexWrap: 'wrap'}}>
                           {block.data.evidence_urls.map((url, i) => (
                              <Image key={i} src={url} style={{width: 100, height: 60, borderRadius: 4, objectFit: 'cover'}} />
                           ))}
                        </View>
                    </View>
                  )}
                </View>
              </View>
            );
          }

          // === 8. Table ===
          if (block.type === 'table') {
             const colCount = block.data.table_columns?.length || 1;
             const colWidth = `${100 / colCount}%`;
             
             return (
               <View key={block.id} style={styles.section} wrap={false}>
                  {block.data.title && <Text style={{fontSize: 12, fontWeight: 'bold', marginBottom: 5}}>{block.data.title}</Text>}
                  <View style={styles.table}>
                     {/* Header */}
                     <View style={styles.tableHeaderRow}>
                        {block.data.table_columns?.map((col, i) => (
                           <View key={i} style={[styles.tableHeaderCell, { width: colWidth, borderRightWidth: i === colCount - 1 ? 0 : 1 }]}>
                              <Text>{col}</Text>
                           </View>
                        ))}
                     </View>
                     {/* Rows */}
                     {block.data.table_rows?.map((row, rIdx) => (
                        <View key={rIdx} style={[styles.tableRow, { backgroundColor: rIdx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottomWidth: rIdx === (block.data.table_rows?.length || 0) - 1 ? 0 : 1 }]}>
                           {row.map((cell, cIdx) => (
                              <View key={cIdx} style={[styles.tableCell, { width: colWidth, borderRightWidth: cIdx === colCount - 1 ? 0 : 1 }]}>
                                 <Text>{cell}</Text>
                              </View>
                           ))}
                        </View>
                     ))}
                  </View>
               </View>
             )
          }

          // === 6. Image Grid ===
          if (block.type === 'image_grid' && block.data.urls && block.data.urls.length > 0) {
             const urls = block.data.urls;
             
             // Dynamic styling based on count
             let dynamicStyle = {};
             if (urls.length === 1) {
                 dynamicStyle = { width: '100%', height: 300 }; // Full width for 1 image
             } else if (urls.length === 2) {
                 dynamicStyle = { width: '48%', height: 200 }; // Half width for 2 images
             } else {
                 dynamicStyle = styles.imageGridItem; // Default 31% for 3+
             }

             return (
               <View key={block.id} style={styles.section} wrap={false}>
                  {block.data.title && <Text style={{fontSize: 12, fontWeight: 'bold', marginBottom: 8}}>{block.data.title}</Text>}
                  <View style={styles.imageGridContainer}>
                     {urls.map((url, idx) => (
                        <Image key={idx} src={url} style={[styles.imageGridItem, dynamicStyle]} />
                     ))}
                  </View>
               </View>
             )
          }

          // === Text (Default) ===
          if (block.type === 'text') {
            return (
              <View key={block.id} style={styles.section}>
                {block.data.title && <Text style={{fontSize: 12, fontWeight: 'bold', marginBottom: 6}}>{block.data.title}</Text>}
                <Text style={styles.textBlock}>{block.data.content}</Text>
              </View>
            );
          }

          return null;
        })}

        <Text style={styles.footer}>
          Generated by SparkMinds Lab | {new Date().toLocaleDateString()} | sparkminds.edu
        </Text>
      </Page>
    </Document>
  );
};