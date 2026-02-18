import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { StudentPortfolio, ContentBlock, SkillItem } from '../types';

// Register the Microsoft YaHei font located in the public folder to support Chinese characters
Font.register({
  family: 'Microsoft YaHei',
  src: '/microsoft yahei.ttf'
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Microsoft YaHei',
    backgroundColor: '#ffffff',
    color: '#334155', // Slate 700
    fontSize: 10,
    lineHeight: 1.5
  },
  // === Header ===
  header: {
    flexDirection: 'row',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb', // Blue 600
    paddingBottom: 20,
    alignItems: 'center'
  },
  headerAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f1f5f9',
    marginRight: 20,
    objectFit: 'cover'
  },
  headerContent: {
    flex: 1
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a', // Slate 900
    marginBottom: 4
  },
  studentTitle: {
    fontSize: 12,
    color: '#2563eb', // Blue 600
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  studentBio: {
    fontSize: 9,
    color: '#64748b',
    lineHeight: 1.4
  },

  // === Section Defaults ===
  section: {
    marginBottom: 20,
    width: '100%'
  },
  
  // === Section Heading ===
  sectionHeadingContainer: {
    marginTop: 10,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 5
  },
  sectionHeadingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 1
  },

  // === Info List (Grid) ===
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  infoItem: {
    width: '30%', // 3 columns
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  infoLabel: {
    fontSize: 8,
    color: '#94a3b8',
    fontWeight: 'bold',
    marginBottom: 2,
    textTransform: 'uppercase'
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
    flexWrap: 'wrap'
  },

  // === Skills (Progress Bars) ===
  skillCategory: {
    marginBottom: 10
  },
  skillCategoryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#475569'
  },
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15
  },
  skillItem: {
    width: '45%', // 2 columns
    marginBottom: 5
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  skillName: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#334155'
  },
  skillScore: {
    fontSize: 9,
    color: '#2563eb'
  },
  skillTrack: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden'
  },
  skillFill: {
    height: '100%',
    backgroundColor: '#2563eb'
  },

  // === Timeline ===
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 15
  },
  timelineLeft: {
    width: '20%',
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0'
  },
  timelineRight: {
    width: '80%',
    paddingLeft: 10
  },
  timelineDate: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'right'
  },
  timelineTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
    flexWrap: 'wrap'
  },
  timelineDesc: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
    flexWrap: 'wrap'
  },
  timelineImages: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 6
  },
  timelineImg: {
    width: 60,
    height: 40,
    borderRadius: 2,
    objectFit: 'cover'
  },

  // === STAR Project ===
  starContainer: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden'
  },
  starHeader: {
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
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
    borderBottomColor: '#f1f5f9',
    flexDirection: 'column'
  },
  starLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4
  },
  starText: {
    fontSize: 9,
    color: '#334155',
    flexWrap: 'wrap'
  },
  starEvidence: {
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
  },

  // === Image Grid ===
  imageGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  imageGridItem: {
    width: '31%', // 3 columns
    height: 100,
    borderRadius: 4,
    objectFit: 'cover',
    backgroundColor: '#f1f5f9'
  },

  // === Text Block ===
  textBlock: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#334155',
    flexWrap: 'wrap'
  },

  // === Table ===
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 5
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  tableHeaderCell: {
    padding: 6,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
    flexDirection: 'column', // Important for wrapping
    flexGrow: 1
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
    color: '#334155',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    flexDirection: 'column', // Important for wrapping
    flexGrow: 1
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

export const PortfolioPDF: React.FC<PortfolioPDFProps> = ({ portfolio }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* === 1. Profile Header (Main) === */}
        {/* We assume the first block might be a profile header, or we use top-level data */}
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
          
          // Note: We skip 'profile_header' here if it's redundant with the top header, 
          // or we can render it as a section if it has specific data different from main.
          // For this implementation, let's treat 'profile_header' blocks inside content as secondary intros or skip if identical.
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

          // === 2. Skills Matrix ===
          if (block.type === 'skills_matrix') {
            return (
              <View key={block.id} style={styles.section} wrap={false}>
                {block.data.skills_categories?.map((cat, idx) => (
                  <View key={idx} style={styles.skillCategory}>
                    <Text style={styles.skillCategoryTitle}>{cat.name}</Text>
                    <View style={styles.skillRow}>
                      {cat.items.map((skill, sIdx) => (
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
                  </View>
                ))}
              </View>
            );
          }

          // === 3. Timeline Node ===
          if (block.type === 'timeline_node') {
             return (
               <View key={block.id} style={[styles.section, styles.timelineRow]} wrap={false}>
                  <View style={styles.timelineLeft}>
                     <Text style={styles.timelineDate}>{block.data.date}</Text>
                  </View>
                  <View style={styles.timelineRight}>
                     <Text style={styles.timelineTitle}>{block.data.title}</Text>
                     <Text style={styles.timelineDesc}>{block.data.content}</Text>
                     {block.data.urls && block.data.urls.length > 0 && (
                        <View style={styles.timelineImages}>
                           {block.data.urls.slice(0, 3).map((url, i) => (
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
                        <Text style={{fontSize: 8, fontWeight: 'bold', marginBottom: 4, color: '#64748b'}}>EVIDENCE</Text>
                        <View style={{flexDirection: 'row', gap: 5}}>
                           {block.data.evidence_urls.slice(0, 4).map((url, i) => (
                              <Image key={i} src={url} style={{width: 50, height: 30, borderRadius: 2, objectFit: 'cover'}} />
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
             return (
               <View key={block.id} style={styles.section} wrap={false}>
                  {block.data.title && <Text style={{fontSize: 12, fontWeight: 'bold', marginBottom: 8}}>{block.data.title}</Text>}
                  <View style={styles.imageGridContainer}>
                     {block.data.urls.slice(0, 6).map((url, idx) => (
                        <Image key={idx} src={url} style={styles.imageGridItem} />
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