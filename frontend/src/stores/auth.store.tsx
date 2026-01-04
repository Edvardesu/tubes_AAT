import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthState } from '@/types';
import { authService } from '@/services/auth.service';

interface RegisterResult {
  success: boolean;
  error?: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const response = await authService.getProfile();
        if (response.success && response.data) {
          setState({
            user: response.data,
            tokens: {
              accessToken: localStorage.getItem('accessToken') || '',
              refreshToken: localStorage.getItem('refreshToken') || '',
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // Token invalid, clear it
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setState({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
        }
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setState({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const response = await authService.login({ email, password });
    if (response.success && response.data) {
      setState({
        user: response.data.user,
        tokens: response.data.tokens,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    }
    return false;
  };

  const register = async (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }): Promise<RegisterResult> => {
    const response = await authService.register(data);
    if (response.success && response.data) {
      setState({
        user: response.data.user,
        tokens: response.data.tokens,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    }
    // Extract error message from response
    let errorMessage = 'Gagal mendaftar. Silakan coba lagi.';
    if (response.error) {
      if (response.error.details) {
        // Get first validation error
        const firstField = Object.keys(response.error.details)[0];
        if (firstField && response.error.details[firstField]?.[0]) {
          errorMessage = response.error.details[firstField][0];
        }
      } else if (response.error.message) {
        errorMessage = response.error.message;
      }
    }
    return { success: false, error: errorMessage };
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setState({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
  };

  const refreshUser = async (): Promise<void> => {
    const response = await authService.getProfile();
    if (response.success && response.data) {
      setState((prev) => ({ ...prev, user: response.data as User }));
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper to check user roles
export function useHasRole(roleNames: string[]): boolean {
  const { user } = useAuth();
  if (!user || !user.roles) return false;

  // Handle both formats: string[] or UserRole[]
  return user.roles.some((ur) => {
    if (typeof ur === 'string') {
      return roleNames.includes(ur);
    }
    return ur.role && roleNames.includes(ur.role.name);
  });
}

export function useIsAdmin(): boolean {
  return useHasRole(['ADMIN', 'CITY_ADMIN']);
}

export function useIsStaff(): boolean {
  return useHasRole(['ADMIN', 'CITY_ADMIN', 'DEPARTMENT_HEAD', 'STAFF_L1', 'STAFF_L2', 'STAFF_L3']);
}

// Pejabat Muda - can process reports and escalate
export function useIsPejabatMuda(): boolean {
  return useHasRole(['STAFF_L1']);
}

// Pejabat Utama - can monitor performance and handle escalated reports
export function useIsPejabatUtama(): boolean {
  return useHasRole(['STAFF_L2', 'DEPARTMENT_HEAD']);
}

// Get user's staff level for displaying appropriate UI
export function useStaffLevel(): 'admin' | 'pejabat_utama' | 'pejabat_muda' | 'citizen' {
  const isAdmin = useHasRole(['ADMIN', 'CITY_ADMIN']);
  const isPejabatUtama = useHasRole(['STAFF_L2', 'DEPARTMENT_HEAD']);
  const isPejabatMuda = useHasRole(['STAFF_L1']);

  if (isAdmin) return 'admin';
  if (isPejabatUtama) return 'pejabat_utama';
  if (isPejabatMuda) return 'pejabat_muda';
  return 'citizen';
}
