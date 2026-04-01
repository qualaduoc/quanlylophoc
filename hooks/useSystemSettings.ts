import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { SystemSettingsData } from '../types';

const defaultSettings: SystemSettingsData = {
  id: 1,
  app_name: 'SeatFlow',
  school_name: 'THCS Nguyễn Hồng Ánh',
  author_name: 'Khầy Được',
  address: 'Việt Nam',
  version: '1.0.0',
  project_title: 'Sản phẩm dự thi',
  project_description: 'Sơ đồ lớp học thông minh ứng dụng AI trong quản lý lớp học'
};

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettingsData>(defaultSettings);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (data) {
        setSettings({ ...defaultSettings, ...data });
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<SystemSettingsData>) => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .upsert({ id: 1, ...updates })
        .select()
        .single();

      if (data) {
        setSettings(data);
        return true;
      }
    } catch(err) {
      console.error("Error saving system settings:", err);
    }
    return false;
  };

  return { settings, updateSettings, loadingConfig, fetchSettings };
}
