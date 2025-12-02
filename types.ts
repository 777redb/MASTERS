
export interface Module {
  id: string;
  title: string;
  description: string;
  topics: string[];
  isCompleted: boolean;
  content?: string; // Markdown content
}

export interface Course {
  id: string;
  title: string;
  level: 'Undergraduate' | 'Masters' | 'PhD';
  description: string;
  modules: Module[];
  progress: number;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ResearchResult {
  text: string;
  sources: GroundingChunk[];
}

export type ViewState = 'dashboard' | 'course-generator' | 'course-view' | 'lesson-view';

export interface DisplaySettings {
  fontFamily: 'serif' | 'sans' | 'mono';
  maxWidth: 'narrow' | 'medium' | 'wide';
  theme: 'light' | 'dark' | 'sepia';
  zoom: number; // Percentage, e.g., 100
}
