import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBranding } from '@/context/BrandingContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { FormField } from '@/components/forms/FormField';
import { Lock, Mail, Shield, AlertCircle } from 'lucide-react';
import { parseApiError, clearFieldError, getFieldError } from '@/lib/apiErrors';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { branding } = useBranding();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});

    const clientErrors: Record<string, string[]> = {};
    if (!email.trim()) {
      clientErrors.email = ['Email address is required.'];
    }
    if (!password) {
      clientErrors.password = ['Password is required.'];
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    try {
      setIsLoading(true);
      await login({ email: email.trim(), password });
      toast.success('Authenticated successfully. Welcome back.');
      navigate(from, { replace: true });
    } catch (err: any) {
      const parsed = parseApiError(err, 'Authentication failed. Please check backend connectivity.');
      if (parsed.errorCode === 'ERR_INVALID_CREDENTIALS') {
        setErrorMessage('Invalid credentials. Please verify your email and password.');
      } else if (parsed.errorCode === 'ERR_ACCOUNT_DEACTIVATED') {
        setErrorMessage('This administrative account has been deactivated.');
      } else if (parsed.errorCode === 'ERR_AUTH_RATE_LIMIT' || parsed.statusCode === 429) {
        setErrorMessage('Too many login attempts. Please wait 15 minutes before retrying.');
      } else if (parsed.isValidationError && Object.keys(parsed.fieldErrors).length > 0) {
        setFieldErrors(parsed.fieldErrors);
        if (parsed.generalErrors.length > 0) {
          setErrorMessage(parsed.generalErrors.join(', '));
        }
      } else {
        setErrorMessage(parsed.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-600/5 blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-surface border border-theme p-8 sm:p-10 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-amber-500/40 flex items-center justify-center mb-4 shadow-md overflow-hidden p-2">
            {branding.logoDarkUrl || branding.logoUrl ? (
              <img
                src={branding.logoDarkUrl || branding.logoUrl!}
                alt={branding.platformName || 'Platform Logo'}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="font-serif-luxury font-bold text-amber-500 text-2xl">
                {branding.platformShortName || (branding.platformName ? branding.platformName.trim().slice(0, 2).toUpperCase() : 'AV')}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif-luxury text-primary tracking-wide">
            {(branding.platformName || 'Atelier Valenti Milano').toUpperCase()}
          </h2>
          <p className="text-xs text-muted uppercase tracking-widest font-mono mt-1">
            Executive Administration Console
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-start gap-2.5 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Staff Email" required error={getFieldError(fieldErrors, 'email')}>
            <Input
              type="email"
              placeholder="admin@ateliervalenti.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => clearFieldError(prev, 'email'));
                setErrorMessage('');
              }}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />
          </FormField>

          <FormField label="Security Key / Password" required error={getFieldError(fieldErrors, 'password')}>
            <Input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => clearFieldError(prev, 'password'));
                setErrorMessage('');
              }}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              required
            />
          </FormField>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center"
              isLoading={isLoading}
              leftIcon={<Shield className="w-4 h-4" />}
            >
              Authorize & Enter Atelier
            </Button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-8 pt-6 border-t border-theme text-center">
          <p className="text-[11px] text-muted leading-relaxed">
            Protected internal console with encrypted JWT session rotation. Unauthorized access attempts are monitored and logged.
          </p>
        </div>
      </div>
    </div>
  );
};
