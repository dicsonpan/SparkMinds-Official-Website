export interface CourseLevel {
  id: string;
  level: string;
  age: string;
  title: string;
  description: string;
  skills: string[];
  iconName: string;
  imageUrl?: string;
}

export interface Showcase {
  title: string;
  description: string;
  category: string;
  imageAlt: string;
}

export interface PhilosophyPoint {
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