import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CURRICULUM, PHILOSOPHY, SHOWCASES } from '../constants';
import { CourseLevel, PhilosophyPoint, Showcase } from '../types';

export const useContent = () => {
  const [curriculum, setCurriculum] = useState<CourseLevel[]>(CURRICULUM);
  const [philosophy, setPhilosophy] = useState<PhilosophyPoint[]>(PHILOSOPHY);
  const [showcases, setShowcases] = useState<Showcase[]>(SHOWCASES);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Curriculum
      const { data: currData, error: currError } = await supabase
        .from('curriculum')
        .select('*')
        .order('id', { ascending: true });
      
      if (!currError && currData && currData.length > 0) {
        setCurriculum(currData);
      }

      // Fetch Philosophy
      const { data: philData, error: philError } = await supabase
        .from('philosophy')
        .select('*')
        .order('created_at', { ascending: true });

      if (!philError && philData && philData.length > 0) {
        setPhilosophy(philData);
      }

      // Fetch Showcases
      const { data: showData, error: showError } = await supabase
        .from('showcases')
        .select('*')
        .order('created_at', { ascending: true });

      if (!showError && showData && showData.length > 0) {
        // Map snake_case database fields to camelCase if necessary, 
        // assuming DB uses camelCase or we map it here.
        // For simplicity, let's assume we create tables with matching column names or mapping below.
        // Actually, Supabase returns what is in DB. We should ensure DB columns match types or map them.
        // Let's map them to be safe.
        const mappedShowcases = showData.map((item: any) => ({
            title: item.title,
            description: item.description,
            category: item.category,
            imageAlt: item.image_alt || item.imageAlt
        }));
        setShowcases(mappedShowcases);
      }
      
    } catch (error) {
      console.warn('Supabase fetch failed, falling back to constants.', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { curriculum, philosophy, showcases, loading, refresh: fetchData };
};