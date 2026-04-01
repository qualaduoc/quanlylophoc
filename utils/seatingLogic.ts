import { Student, SeatingChart, GroupSettings, Group } from '../types';

export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const calculateShortNames = (students: Student[]): Student[] => {
  const shortNameCounts = new Map<string, number>();
  
  students.forEach(s => {
      const nameParts = s.fullName.trim().split(' ');
      const baseShortName = nameParts[nameParts.length - 1];
      const currentCount = shortNameCounts.get(baseShortName) || 0;
      shortNameCounts.set(baseShortName, currentCount + 1);
  });

  const assignedCounts = new Map<string, number>();
  
  return students.map(student => {
    const nameParts = student.fullName.trim().split(' ');
    const baseShortName = nameParts[nameParts.length - 1];
    
    const total = shortNameCounts.get(baseShortName) || 0;
    
    if (total > 1) {
        const assigned = assignedCounts.get(baseShortName) || 0;
        assignedCounts.set(baseShortName, assigned + 1);
        return { ...student, shortName: `${baseShortName} ${String.fromCharCode(64 + assigned + 1)}` };
    }
    return { ...student, shortName: baseShortName };
  });
};
