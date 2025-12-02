
import React from 'react';
import { X, Type, Monitor, Moon, Sun, ZoomIn } from 'lucide-react';
import { DisplaySettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DisplaySettings;
  onUpdateSettings: (newSettings: DisplaySettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative transition-colors duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
           <Type className="text-blue-500" /> Display Settings
        </h2>

        <div className="space-y-8">
          
          {/* Theme / Mode */}
          <div>
            <label className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 block flex items-center gap-2">
              <Sun size={14} /> Appearance Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  settings.theme === 'light' 
                    ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-400' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Sun size={18} /> Light
              </button>
              <button
                onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  settings.theme === 'dark' 
                    ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-400' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Moon size={18} /> Dark
              </button>
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 block">Typeface</label>
            <div className="grid grid-cols-3 gap-3">
              {(['serif', 'sans', 'mono'] as const).map((font) => (
                <button
                  key={font}
                  onClick={() => onUpdateSettings({ ...settings, fontFamily: font })}
                  className={`p-3 rounded-xl border text-lg flex flex-col items-center justify-center gap-1 transition-all ${
                    settings.fontFamily === font 
                      ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-400' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className={
                    font === 'serif' ? 'font-serif' : font === 'mono' ? 'font-mono' : 'font-sans'
                  }>Ag</span>
                  <span className="text-[10px] uppercase tracking-wider font-sans font-medium opacity-70">{font}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Zoom Level */}
          <div>
             <div className="flex justify-between items-center mb-3">
               <label className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                 <ZoomIn size={14} /> Zoom Level
               </label>
               <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                 {settings.zoom}%
               </span>
             </div>
             <input 
                type="range" 
                min="75" 
                max="150" 
                step="5" 
                value={settings.zoom}
                onChange={(e) => onUpdateSettings({...settings, zoom: parseInt(e.target.value)})}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
             />
             <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>75%</span>
                <span>100%</span>
                <span>150%</span>
             </div>
          </div>

           {/* Width */}
           <div>
            <label className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 block flex items-center gap-2">
              <Monitor size={14} /> Page Width
            </label>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
              {(['narrow', 'medium', 'wide'] as const).map((width) => (
                <button
                  key={width}
                  onClick={() => onUpdateSettings({ ...settings, maxWidth: width })}
                  className={`flex-1 py-1.5 rounded-md transition-all text-sm capitalize ${
                    settings.maxWidth === width 
                      ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {width}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
