export interface CourseLevel {
  id: string;
  level: string;
  age: string;
  title: string;
  description: string;
  skills: string[];
  iconName: string;
  imageUrls?: string[]; // Changed from single string to string array
}

export interface Showcase {
  id?: number; // Added optional ID for frontend management
  title: string;
  description: string;
  category: string;
  imageAlt: string;
}

export interface PhilosophyPoint {
  id?: number;
  title: string;
  content: string;
  iconName: string;
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
  imageUrl?: string;
}