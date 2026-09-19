import { Semester, Department } from '../types';

export const APP_NAME = 'SAM — Smart Assignment Manager';
export const DEPARTMENT: Department = 'CSE';
export const DEPARTMENT_FULL = 'Computer Science & Engineering';

export const SUPPORTED_SEMESTERS: { id: Semester; label: string; year: string }[] = [
  { id: '1st', label: '1st Semester', year: '1st Year' },
  { id: '3rd', label: '3rd Semester', year: '2nd Year' },
  { id: '4th', label: '4th Semester', year: '2nd Year' },
  { id: '5th', label: '5th Semester', year: '3rd Year' },
];

export const DEFAULT_MAX_MARKS = 10;

// Common CSE Diploma Curricular Subjects for quick auto-complete / suggestions
export const SUGGESTED_SUBJECTS: Record<Semester, string[]> = {
  '1st': [
    'Programming Fundamentals',
    'Basics of Electrical & Electronics',
    'Engineering Mathematics',
    'Computer Concepts',
  ],
  '3rd': [
    'C Programming',
    'Data Structures using C',
    'Digital Electronics',
    'Computer Organization',
  ],
  '4th': [
    'Java Programming',
    'Database Management Systems',
    'Operating Systems',
    'Computer Networks',
  ],
  '5th': [
    'Web Technology',
    'Software Engineering',
    'Mobile Application Development',
    'Project Work',
  ],
};
