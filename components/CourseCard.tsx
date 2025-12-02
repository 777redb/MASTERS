
import React from 'react';
import { Book, ChevronRight, BarChart } from 'lucide-react';
import { Course } from '../types';

interface CourseCardProps {
  course: Course;
  onClick: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
  const completedModules = course.modules.filter(m => m.isCompleted).length;
  const totalModules = course.modules.length;
  const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div 
      onClick={onClick}
      className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-blue-500 dark:text-blue-400">
          <Book size={24} />
        </div>
        <span className="text-xs font-mono py-1 px-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
          {course.level}
        </span>
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {course.title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-6 h-10">
        {course.description}
      </p>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-slate-500 dark:text-slate-400 space-x-2">
          <BarChart size={16} />
          <span>{progressPercent}% Complete</span>
        </div>
        <ChevronRight className="text-slate-400 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" size={20} />
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-700">
        <div 
          className="h-full bg-blue-500 transition-all duration-500" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
