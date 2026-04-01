
export interface ClassData {
  id: string;
  name: string;
  teacher_id?: string;
  school_year?: string;
}

export interface BehaviorRecord {
  id: string;
  type: 'bonus' | 'penalty' | 'info';
  description: string;
  score: number;
  timestamp: number;
}

export interface Student {
  id: string;
  fullName: string;
  shortName: string;
  currentSeatAssignedTimestamp: number | null;
  parentPhone?: string;
  address?: string;
  weight?: string;
  height?: string;
  isNearsighted?: boolean; // Cận thị
  isSpecialNeeds?: boolean; // Đặc biệt (Khiếm thính, tâm lý...)
  behaviorRecords: BehaviorRecord[];
}

export type Table = Student[];
export type Row = Table[];
export type SeatingChart = Row[];

export type ViewMode = '2d' | '3d';

export type GroupArrangement = 'horizontal' | 'vertical' | 'cluster';

export interface GroupSettings {
  enabled: boolean;
  groupSizes: number[];
  arrangement: GroupArrangement;
}

export interface SystemSettingsData {
  id: number;
  app_name: string;
  school_name: string;
  author_name: string;
  address: string;
  version: string;
  project_title: string;
  project_description: string;
}

export type Group = {
  rowIndex: number;
  colIndex: number;
}[];

export type ArrangementMode = 'automatic' | 'manual';
