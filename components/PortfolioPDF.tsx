import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { StudentPortfolio, ContentBlock, SkillItem } from '../types';

// NOTE: Chinese font loading from public CDNs is unreliable and often causes CORS or 404 errors.
// For production, you MUST download a font like "SourceHanSansCN-Regular.ttf", place it in your 'public' folder,
// and reference it relatively like `/fonts/SourceHanSansCN-Regular.ttf`.
// Falling back to standard Helvetica to ensure PDF generation works, though Chinese characters may not render correctly without the custom font.

// Uncomment and adjust path if you have a local font file:
// Font.register({
//   family: 'SourceHanSans',
//   src: '/fonts/SourceHanSansCN-Regular.ttf'
// });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    // fontFamily: 'SourceHanSans', // Switch back to this if you have the font
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: '#1e293b'
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerLeft: {
    flexDirection: 'column'
  },
  studentName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#0f172a'
  },
  studentTitle: {
    fontSize: 14,
    color: '#64748b'
  },
  headerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9'
  },
  section: {
    marginBottom: 25
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2563eb',
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
    paddingLeft: 8
  },
  text: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#334155',
    marginBottom: 5
  },
  bold: {
    fontWeight: 'bold',
    color: '#0f172a'
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  infoItem: {
    width: '48%',
    flexDirection: 'row',
    marginBottom: 8,
    padding: 5,
    backgroundColor: '#f8fafc',
    borderRadius: 4
  },
  infoLabel: {
    width: 60,
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: 'bold'
  },
  infoValue: {
    flex: 1,
    fontSize: 9,
    color: '#334155'
  },
  skillCategory: {
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 6
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
    gap: 8
  },
  skillBadge: {
    fontSize: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    borderRadius: 10
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  imageWrapper: {
    width: '30%',
    height: 100,
    marginBottom: 10,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9'
  },
  projectCard: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0f172a'
  },
  projectSection: {
    marginBottom: 6
  },
  projectLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 2
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    textAlign: 'center',
    color: '#cbd5e1',
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Note: Chinese characters might not render with Helvetica */}
            <Text style={styles.studentName}>{portfolio.student_name}</Text>
            <Text style={styles.studentTitle}>SparkMinds Portfolio</Text>
          </View>
          {portfolio.avatar_url && (
             <Image src={portfolio.avatar_url} style={styles.headerAvatar} />
          )}
        </View>

        {/* Warning about Chinese characters */}
        <View style={{marginBottom: 10, padding: 10, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fdba74'}}>
            <Text style={{fontSize: 10, color: '#c2410c'}}>
                Note: Chinese characters may not display correctly because a custom Chinese font file was not found. 
                Please configure a local font file in 'components/PortfolioPDF.tsx' for full support.
            </Text>
        </View>

        {/* Content Blocks */}
        {portfolio.content_blocks.map((block, index) => {
          // Profile Header
          if (block.type === 'profile_header') {
            return (
              <View key={block.id} style={styles.section}>
                {block.data.student_title && <Text style={{fontSize: 12, color: '#2563eb', marginBottom: 5}}>{block.data.student_title}</Text>}
                {block.data.summary_bio && <Text style={styles.text}>{block.data.summary_bio}</Text>}
              </View>
            );
          }

          // Info List
          if (block.type === 'info_list') {
            return (
              <View key={block.id} style={styles.section}>
                {block.data.title && <Text style={styles.sectionTitle}>{block.data.title}</Text>}
                <View style={styles.row}>
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

          // Skills
          if (block.type === 'skills_matrix') {
            return (
              <View key={block.id} style={styles.section}>
                <Text style={styles.sectionTitle}>Skills Matrix</Text>
                {block.data.skills_categories?.map((cat, idx) => (
                  <View key={idx} style={styles.skillCategory}>
                    <Text style={styles.skillCategoryTitle}>{cat.name}</Text>
                    <View style={styles.skillRow}>
                      {cat.items.map((skill, sIdx) => (
                        <Text key={sIdx} style={styles.skillBadge}>
                          {skill.name} {skill.value}{skill.unit || '%'}
                        </Text>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            );
          }

          // Project (STAR)
          if (block.type === 'project_highlight') {
            return (
              <View key={block.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{block.data.title || 'Project Highlight'}</Text>
                <View style={styles.projectCard}>
                  <View style={styles.projectSection}>
                    <Text style={styles.projectLabel}>SITUATION</Text>
                    <Text style={styles.text}>{block.data.star_situation}</Text>
                  </View>
                  <View style={styles.projectSection}>
                    <Text style={styles.projectLabel}>TASK</Text>
                    <Text style={styles.text}>{block.data.star_task}</Text>
                  </View>
                  <View style={styles.projectSection}>
                    <Text style={styles.projectLabel}>ACTION</Text>
                    <Text style={styles.text}>{block.data.star_action}</Text>
                  </View>
                  <View style={styles.projectSection}>
                    <Text style={styles.projectLabel}>RESULT</Text>
                    <Text style={styles.text}>{block.data.star_result}</Text>
                  </View>
                </View>
              </View>
            );
          }

          // Timeline
          if (block.type === 'timeline_node') {
             return (
               <View key={block.id} style={styles.section}>
                  <Text style={styles.sectionTitle}>Timeline Event</Text>
                  <View style={{flexDirection: 'row', marginBottom: 5}}>
                     <Text style={{fontSize: 10, fontWeight: 'bold', width: 80, color: '#2563eb'}}>{block.data.date}</Text>
                     <View style={{flex: 1}}>
                        <Text style={{fontSize: 12, fontWeight: 'bold', marginBottom: 4}}>{block.data.title}</Text>
                        <Text style={styles.text}>{block.data.content}</Text>
                     </View>
                  </View>
               </View>
             )
          }

          // Text
          if (block.type === 'text') {
            return (
              <View key={block.id} style={styles.section}>
                {block.data.title && <Text style={styles.sectionTitle}>{block.data.title}</Text>}
                <Text style={styles.text}>{block.data.content}</Text>
              </View>
            );
          }

          // Image Grid
          if (block.type === 'image_grid' && block.data.urls && block.data.urls.length > 0) {
             return (
               <View key={block.id} style={styles.section}>
                  {block.data.title && <Text style={styles.sectionTitle}>{block.data.title}</Text>}
                  <View style={styles.imageGrid}>
                     {block.data.urls.slice(0, 6).map((url, idx) => (
                        <Image key={idx} src={url} style={styles.imageWrapper} />
                     ))}
                  </View>
               </View>
             )
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
