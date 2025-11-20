import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

/**
 * LoginSnippet Component
 * 
 * A stylish button/link to navigate back to the main landing page.
 * Place this in your SignIn/Login component (e.g., top-left or below the form).
 */
const LoginSnippet = () => {
  return (
    <a 
      href="/landing/index.html" 
      className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 group z-50"
      aria-label="Back to Project Presentation"
    >
      <div className="p-1.5 rounded-full bg-background/50 border border-border group-hover:border-primary/50 group-hover:bg-primary/10 transition-all">
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
      </div>
      <span className="font-medium">Back to Project Info</span>
    </a>
  );
};

export default LoginSnippet;
