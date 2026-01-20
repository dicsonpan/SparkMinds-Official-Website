import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CURRICULUM, PHILOSOPHY, SHOWCASES, PAGE_SECTIONS_DEFAULT, SOCIAL_PROJECTS } from '../constants';
import { CourseLevel, PhilosophyPoint, Showcase, PageSection, SocialProject } from '../types';

export const useContent = () => {
  const [curriculum, setCurriculum] = useState<CourseLevel[]>(CURRICULUM);
  const [philosophy, setPhilosophy] = useState<PhilosophyPoint[]>(PHILOSOPHY);
  const [showcases, setShowcases] = useState<Showcase[]>(SHOWCASES);
  const [socialProjects, setSocialProjects] = useState<SocialProject[]>(SOCIAL_PROJECTS);
  const [pageSections, setPageSections] = useState<Record<string, PageSection>>({});
  const [loading, setLoading] = useState(true);

  // Helper to convert array to object for easier access
  const mapSections = (sections: PageSection[]) => {
    const map: Record<string, PageSection> = {};
    sections.forEach(s => map[s.id] = s);
    return map;
  };

  // Initialize with defaults
  useEffect(() => {
    setPageSections(mapSections(PAGE_SECTIONS_DEFAULT));
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Curriculum
      const { data: currData } = await supabase.from('curriculum').select('*').order('id', { ascending: true });
      if (currData && currData.length > 0) {
        const mappedCurriculum = currData.map((item: any) => ({
          id: item.id,
          level: item.level,
          age: item.age,
          title: item.title,
          description: item.description,
          skills: item.skills,
          iconName: item.icon_name, 
          imageUrls: item.image_urls || [] // Map image_urls array
        }));
        setCurriculum(mappedCurriculum);
      }

      // Fetch Philosophy
      const { data: philData } = await supabase.from('philosophy').select('*').order('created_at', { ascending: true });
      if (philData && philData.length > 0) {
        const mappedPhilosophy = philData.map((item: any) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          iconName: item.icon_name 
        }));
        setPhilosophy(mappedPhilosophy);
      }

      // Fetch Showcases
      const { data: showData } = await supabase.from('showcases').select('*').order('created_at', { ascending: true });
      if (showData && showData.length > 0) {
        const mappedShowcases = showData.map((item: any) => ({
            id: item.id, // Keep ID for admin mapping
            title: item.title,
            description: item.description,
            category: item.category,
            imageUrls: item.image_urls || [] // Map array
        }));
        setShowcases(mappedShowcases);
      }

      // Fetch Social Projects
      const { data: socData } = await supabase.from('social_projects').select('*').order('created_at', { ascending: true });
      if (socData && socData.length > 0) {
        const mappedProjects = socData.map((item: any) => ({
            id: item.id,
            title: item.title,
            subtitle: item.subtitle,
            quote: item.quote,
            footerNote: item.footer_note,
            imageUrls: item.image_urls || [] // Map image_urls array
        }));
        setSocialProjects(mappedProjects);
      }

      // Fetch Page Sections
      const { data: secData } = await supabase.from('page_sections').select('*');
      if (secData && secData.length > 0) {
        setPageSections(mapSections(secData));
      }
      
    } catch (error) {
      console.warn('Supabase fetch failed, using defaults.', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { curriculum, philosophy, showcases, socialProjects, pageSections, loading, refresh: fetchData };
};