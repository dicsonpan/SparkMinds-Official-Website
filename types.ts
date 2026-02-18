
export interface CourseLevel {
  id: string;
  level: string;
  age: string;
  title: string;
  description: string;
  skills: string[];
  iconName: string;
  imageUrls?: string[];
  sort_order?: number; // Added for sorting
}

export interface Showcase {
  id?: number; 
  title: string;
  description: string;
  category: string;
  imageUrls: string[];
  sort_order?: number; // Added for sorting
}

export interface PhilosophyPoint {
  id?: number;
  title: string;
  content: string;
  iconName: string;
  sort_order?: number; // Added for sorting
}

export interface PageSection {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  metadata?: {
    highlighted_text?: string;
    cta1?: string;
    cta2?: string;
    [key: string]: any;
  };
  sort_order?: number; // Added for sorting
}

export interface Booking {
  id: number;
  parent_name: string;
  phone: string;
  child_age: string;
  status: 'pending' | 'contacted';
  note?: string;
  created_at: string;
}

export interface SocialProject {
  id?: number;
  title: string;
  subtitle: string;
  quote: string;
  footerNote: string;
  imageUrls: string[];
  sort_order?: number; // Added for sorting
}

// === New Student Portfolio Types ===

export type ContentBlockType = 'header' | 'text' | 'image_grid' | 'video' | 'skills' | 'project_highlight' | 'timeline_node' | 'section_heading' | 'info_list' | 'table';

export type PortfolioTheme = 'tech_dark' | 'academic_light' | 'creative_color';
export type SkillsLayout = 'bar' | 'radar' | 'circle' | 'stat_grid';

// Basic skill item
export interface SkillItem {
  name: string;     // e.g., "Python", "Soldering"
  value: number;    // Float
  unit?: string;    // e.g. "%", "分", or empty
}

// Grouped skill category with its own layout config
export interface SkillCategory {
  name: string; // e.g., "Hardware", "Software"
  layout: SkillsLayout;
  items: SkillItem[];
}

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  data: {
    title?: string;
    content?: string; 
    urls?: string[]; 
    date?: string;
    layout?: 'grid' | 'carousel' | 'single' | 'bento'; 
    tags?: string[]; 
    // STAR Method Fields for Project Highlight
    star_situation?: string;
    star_task?: string;
    star_action?: string;
    star_result?: string;
    evidence_urls?: string[]; // For process sketches/failures
    // Generic Info List (Key-Value pairs)
    info_items?: {
        icon?: string;
        label: string;
        value: string;
    }[];
    // Table Data
    table_columns?: string[];
    table_rows?: string[][];
  };
}

export interface StudentPortfolio {
  id?: number;
  slug: string; 
  student_name: string;
  student_title?: string; 
  summary_bio?: string; // New: Short biography
  hero_image_url?: string; // New: Custom hero background
  avatar_url?: string; // New: Custom avatar image
  access_password: string; 
  content_blocks: ContentBlock[]; 
  skills?: SkillCategory[]; // Refactored to grouped structure
  // Legacy support or global overrides can go here if needed, but we moved layout to SkillCategory
  theme_config?: {
    theme: PortfolioTheme;
    primary_color?: string;
  };
  created_at?: string;
}
