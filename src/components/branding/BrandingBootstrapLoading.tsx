import React from 'react';
import { Loader2 } from 'lucide-react';

export const BrandingBootstrapLoading: React.FC = () => {
  return (
    <div
      className="min-h-screen bg-app flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none"
      data-testid="branding-bootstrap-loading"
    >
      {/* Subtle Background Ambience */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-600/5 blur-3xl pointer-events-none" />

      <div className="flex flex-col items-center gap-4 text-center z-10 animate-in fade-in duration-300">
        <div className="w-12 h-12 rounded-2xl bg-surface border border-theme flex items-center justify-center shadow-lg">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-widest font-mono text-muted">
            Initializing Administration Console
          </p>
          <div className="w-28 h-1 bg-surface-subtle border border-theme rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-amber-500/60 rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
};
