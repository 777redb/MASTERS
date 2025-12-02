
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { DisplaySettings } from '../types';

interface MarkdownRendererProps {
  content: string;
  settings: DisplaySettings;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, settings }) => {
  // Map settings to CSS classes
  const maxWidthClass = {
    narrow: 'max-w-2xl',
    medium: 'max-w-3xl',
    wide: 'max-w-5xl'
  }[settings.maxWidth];

  const fontFamilyClass = {
    serif: 'font-serif-text',
    sans: 'font-sans',
    mono: 'font-mono',
  }[settings.fontFamily];

  // Calculate base font size from zoom percentage
  const zoomStyle = {
    fontSize: `${settings.zoom / 100}rem` 
  };

  return (
    <article 
      className={`
        ${maxWidthClass} mx-auto px-8 py-12 
        bg-white dark:bg-[#131b2e] 
        shadow-xl dark:shadow-2xl 
        rounded-sm 
        border border-slate-200 dark:border-transparent
        border-l-4 border-l-slate-200 dark:border-l-slate-700/50 
        md:border-t-0 my-8 transition-all duration-300
      `}
      style={zoomStyle}
    >
      <div className={`
        prose dark:prose-invert max-w-none ${fontFamilyClass} leading-loose
        
        /* Heading Styles */
        prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight 
        prose-headings:text-slate-900 dark:prose-headings:text-slate-100
        
        prose-h1:text-[2.5em] prose-h1:border-b prose-h1:border-slate-200 dark:prose-h1:border-slate-800 prose-h1:pb-[0.5em] prose-h1:mb-[1em]
        prose-h2:text-indigo-600 dark:prose-h2:text-indigo-400 prose-h2:mt-[2em] prose-h2:mb-[1em] prose-h2:border-l-4 prose-h2:border-indigo-500 prose-h2:pl-4
        prose-h3:text-slate-800 dark:prose-h3:text-slate-200 prose-h3:mt-[1.5em] prose-h3:mb-[0.5em]
        
        /* Paragraph Styles */
        prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:mb-[1.5em]
        
        /* Blockquote Styles */
        prose-blockquote:border-l-4 prose-blockquote:border-blue-500 
        prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-slate-800/30 
        prose-blockquote:py-6 prose-blockquote:px-8 prose-blockquote:rounded-r-xl 
        prose-blockquote:not-italic prose-blockquote:text-slate-700 dark:prose-blockquote:text-slate-300 
        prose-blockquote:my-[2em]
        
        /* Code Styles */
        prose-code:text-indigo-600 dark:prose-code:text-indigo-300 
        prose-code:bg-slate-100 dark:prose-code:bg-slate-900 
        prose-code:px-2 prose-code:py-1 prose-code:rounded-md 
        prose-code:font-mono prose-code:text-[0.9em] 
        prose-code:before:content-none prose-code:after:content-none
        
        /* Strong/List/HR */
        prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-semibold
        prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2 prose-ul:mb-[2em]
        prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2 prose-ol:mb-[2em]
        prose-li:marker:text-slate-400 prose-li:text-slate-700 dark:prose-li:text-slate-300
        prose-hr:border-slate-200 dark:prose-hr:border-slate-800 prose-hr:my-[3em]
        `}
      >
        <ReactMarkdown
          components={{
            code({node, className, children, ...props}) {
              const match = /language-(\w+)/.exec(className || '')
              return match ? (
                <div className="relative group my-[2em] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">{match[1]}</span>
                    <div className="flex space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 dark:bg-red-500/20 border border-red-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 dark:bg-yellow-500/20 border border-yellow-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 dark:bg-green-500/20 border border-green-500/50"></div>
                    </div>
                  </div>
                  <code className={`${className} block p-6 overflow-x-auto bg-white dark:bg-[#0b1120] text-sm leading-relaxed`} {...props}>
                    {children}
                  </code>
                </div>
              ) : (
                <code className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20 font-mono text-[0.9em]" {...props}>
                  {children}
                </code>
              )
            },
            blockquote({node, children, ...props}) {
              return (
                <blockquote className="relative my-[2em] pl-8 pr-6 py-6 border-l-4 border-indigo-500 bg-slate-50 dark:bg-slate-800/20 rounded-r-lg" {...props}>
                  <div className="absolute -left-2.5 top-6 w-5 h-5 bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  </div>
                  {children}
                </blockquote>
              );
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </article>
  );
};
