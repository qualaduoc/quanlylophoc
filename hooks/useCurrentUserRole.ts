import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { UserRole } from '../types';

export function useCurrentUserRole(isLoggedIn: boolean) {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loadingRole, setLoadingRole] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadRole() {
      if (!isLoggedIn) {
        if (isMounted) {
            setUserRole(null);
            setLoadingRole(false);
        }
        return;
      }

      try {
        setLoadingRole(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session?.user) {
            if (isMounted) setUserRole(null);
            return;
        }

        // Fetch User Roles manually from the database
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (roleError) {
          console.error("Error fetching user_roles:", roleError);
        }

        if (isMounted) {
            if (roleData) {
                setUserRole(roleData as UserRole);
            } else {
                // SECURITY PATCH: ONLY fallback to admin if the email is precisely the original admin account.
                // Otherwise, the user has been revoked or has no rights.
                if (session.user.email === 'admin@muongthanh.edu.vn') {
                    const fallbackRole: UserRole = {
                        id: session.user.id,
                        username: 'admin',
                        role: 'admin',
                        class_id: null,
                        group_id: null
                    };
                    setUserRole(fallbackRole);
                    
                    supabase.from('user_roles').insert(fallbackRole).then(({ error }) => {
                        if(error && error.code !== '23505') console.warn("Could not insert fallback role:", error);
                    });
                } else {
                    // Cấm truy cập nếu tài khoản vừa tạo nhưng chưa gán role, hoặc bị thu hồi role
                    setUserRole({
                      id: session.user.id,
                      username: session.user.email?.split('@')[0] || 'unknown',
                      role: 'guest' as any, // Not an official role, will be blocked by UI
                      class_id: null,
                      group_id: null
                    });
                }
            }
        }
      } catch (err) {
        console.error("Critical error in useCurrentUserRole:", err);
      } finally {
        if (isMounted) setLoadingRole(false);
      }
    }

    loadRole();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  return { userRole, loadingRole };
}
