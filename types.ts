export interface CourseLevel {
  id: string;
  level: string;
  age: string;
  title: string;
  description: string;
  skills: string[];
  iconName: string;
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