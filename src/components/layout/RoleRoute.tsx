import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AdminRole } from '@/types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface RoleRouteProps {
  allowedRoles: AdminRole[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { hasRole, user } = useAuth();

  if (!hasRole(allowedRoles)) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-serif-luxury text-primary mb-2">
          Access Restricted
        </h2>
        <p className="text-sm text-muted leading-relaxed mb-6">
          Your administrative role (<strong className="text-primary">{user?.role}</strong>) does not
          have the permissions required to access this section of the atelier console.
        </p>
        <Link to="/">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return <Outlet />;
};
