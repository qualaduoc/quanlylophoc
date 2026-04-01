import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { ClassData } from '../types';

export function useClasses(isLoggedIn: boolean) {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [activeClassId, setActiveClassId] = useState<string | null>(() => {
    return localStorage.getItem('seatflow_active_class') || null;
  });
  const [loadingClasses, setLoadingClasses] = useState(true);

  // Auto save active class to storage
  useEffect(() => {
    if (activeClassId) {
      localStorage.setItem('seatflow_active_class', activeClassId);
    } else {
      localStorage.removeItem('seatflow_active_class');
    }
  }, [activeClassId]);

  const fetchClasses = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoadingClasses(true);
    
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: true });

      if (data) {
        setClasses(data);
        if (data.length > 0 && !activeClassId) {
          setActiveClassId(data[0].id);
        }
      } else if (error) {
        console.error("Error fetching classes:", error);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoadingClasses(false);
    }
  }, [isLoggedIn, activeClassId]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const addClass = async (name: string, schoolYear: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('classes')
        .insert({ name, school_year: schoolYear, teacher_id: user?.id })
        .select()
        .single();
        
      if (error) {
        console.error("Supabase error:", error);
        alert(`Không thể thêm lớp. Lỗi từ máy chủ: ${error.message} (Mã lỗi: ${error.code})`);
        return false;
      }
      
      if (data) {
        setClasses(prev => [...prev, data]);
        setActiveClassId(data.id);
        return true;
      }
    } catch(err: any) {
       console.error(err);
       alert(`Lỗi hệ thống: ${err.message}`);
    }
    return false;
  };

  return { classes, activeClassId, setActiveClassId, addClass, loadingClasses };
}
