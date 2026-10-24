import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface BrandingBootstrapErrorProps {
  onRetry: () => void;
  error?: Error | null;
}

export const BrandingBootstrapError: React.FC<BrandingBootstrapErrorProps> = ({ onRetry }) => {
  return (
    <div
      className="min-h-screen bg-app flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden"
      data-testid="branding-bootstrap-error"
    >
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-rose-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-rose-600/5 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl bg-surface border border-theme p-8 sm:p-10 shadow-2xl text-center z-10 animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto mb-5 shadow-xs">
          <AlertCircle className="w-7 h-7" />
        </div>

        <h2 className="text-lg sm:text-xl font-bold font-serif-luxury text-primary tracking-wide mb-2">
          Configuration Unavailable
        </h2>

        <p className="text-xs text-muted leading-relaxed mb-6">
          Unable to establish a secure connection to load the platform branding configuration. Please verify your network connection and backend service availability.
        </p>

        <Button
          variant="primary"
          size="md"
          className="w-full justify-center"
          onClick={onRetry}
          leftIcon={<RotateCcw className="w-4 h-4" />}
        >
          Retry Connection
        </Button>
      </div>
    </div>
  );
};
