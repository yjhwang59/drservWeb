import { Navigate, Outlet } from 'react-router-dom';
import { hasAdminKey } from '../../lib/adminApi';

/**
 * 保護後台子路由：未設定 API 金鑰時導向 /admin/login。
 * 僅用於包住 /admin 下除 login 以外的子路由。
 */
export function RequireAdminKey() {
  if (!hasAdminKey()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}
