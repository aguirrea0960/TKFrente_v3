export const PROJECT_NAME = 
  (typeof process !== 'undefined' && process?.env?.REACT_APP_PROJECT_NAME) || 
  (import.meta as any).env?.VITE_APP_PROJECT_NAME || 
  'React Water Control';

export const PROJECT_PATH = 
  (typeof process !== 'undefined' && process?.env?.REACT_APP_PROJECT_PATH) || 
  (import.meta as any).env?.VITE_APP_PROJECT_PATH || 
  'project';

