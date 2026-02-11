
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

export type ContentBlockType = 'header' | 'text' | 'image_grid' | 'video';

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  data: {
    title?: string;
    content?: string; // For text or description
    urls?: string[]; // For images or single video URL
    date?: string;
    layout?: 'grid' | 'carousel' | 'single'; // For images
  };
}

export interface StudentPortfolio {
  id?: number;
  slug: string; // e.g., 'jaydenyip'
  student_name: string;
  access_password: string; // Stored simply for this use case
  content_blocks: ContentBlock[]; // JSONB in DB
  created_at?: string;
}
