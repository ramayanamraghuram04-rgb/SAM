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
    'ENGLISH COMMUNICATION',
    'ENGG MATHEMATICS',
    'ENGG PHYSICS',
    'ENGG CHEMISTRY',
    'PYTHON PROGRAMMING',
    'CODING FUNDAMENTALS',
  ],
  '3rd': [
    'DATA STRUCTURES THROUGH PYTHON',
    'DATABASE MANAGEMENT SYSTEMS',
    'OPERATING SYSTEMS',
    'ENGINEERING MATHEMATICS II',
    'DIGITAL ELECTRONICS',
    'COMPUTER ORGANIZATION',
  ],
  '4th': [
    'Software Engineering',
    'Web Technologies',
    'Computer Organization And Microprocessors',
    'OOP through Java',
    'Computer Networks & Cyber Security',
  ],
  '5th': [
    'Industrial Management and Entrepreneurship',
    'Big Data & Cloud Computing',
    'Android Programming',
    'Internet Of Things',
    'Python programming',
  ],
};
