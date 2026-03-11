import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Mail,
  List,
  Inbox,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Key,
  type LucideIcon,
} from 'lucide-react';
import type { MenuItemNode } from '../../types/admin';
import { hasAdminKey, setAdminApiKey } from '../../lib/adminApi';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Mail,
  List,
  Inbox,
};

function MenuIcon({ name }: { name: string | null }) {
  const Icon = name ? iconMap[name] ?? null : null;
  if (!Icon) return <span className="w-5" />;
  return <Icon size={20} className="shrink-0" />;
}

function MenuItem({ item, depth = 0 }: { item: MenuItemNode; depth?: number }) {
  const location = useLocation();
  const isDropdown = item.menu_type === 'dropdown';
  const [open, setOpen] = useState(() => {
    if (!isDropdown) return false;
    const path = location.pathname;
    return item.children.some((c: MenuItemNode) => c.menu_url && path.startsWith(c.menu_url));
  });
  const hasChildren = item.children && item.children.length > 0;
  const isActive = !isDropdown && item.menu_url !== '#' && location.pathname === item.menu_url;

  if (item.menu_type === 'divider') {
    return <div className="my-1 border-t border-gray-200" />;
  }
  if (item.menu_type === 'header') {
    return (
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {item.menu_name}
      </div>
    );
  }

  if (isDropdown && hasChildren) {
    return (
      <div className="mb-1">
        <button
          type="button"
          onClick={() => setOpen((o: boolean) => !o)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-gray-700 hover:bg-gray-100"
          style={{ paddingLeft: 12 + depth * 12 }}
        >
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <MenuIcon name={item.menu_icon} />
          <span>{item.menu_name}</span>
        </button>
        {open && (
          <ul className="ml-2 space-y-0.5">
            {item.children.map((child: MenuItemNode) => (
              <li key={child.id}>
                <MenuItem item={child} depth={depth + 1} />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.menu_url}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 ${
        isActive ? 'bg-primary-100 text-primary-700 font-medium' : ''
      }`}
      style={{ paddingLeft: 12 + depth * 12 }}
    >
      <MenuIcon name={item.menu_icon} />
      <span>{item.menu_name}</span>
    </Link>
  );
}

function AdminKeyBanner({ onSet }: { onSet: () => void }) {
  const [key, setKey] = useState('');
  const [collapsed, setCollapsed] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = key.trim();
    if (!v) return;
    setAdminApiKey(v);
    onSet();
  };

  return (
    <div className="flex flex-1 flex-wrap items-center gap-2 py-2">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="inline-flex items-center gap-1.5 font-medium"
        >
          <Key size={16} />
          {collapsed ? '後台未設定 API 金鑰，按此設定' : '取消'}
        </button>
      </div>
      {!collapsed && (
        <form onSubmit={handleSubmit} className="inline-flex flex-wrap items-center gap-2">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="請輸入與後端 ADMIN_API_KEY 相同的金鑰"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm min-w-[200px]"
            autoComplete="off"
          />
          <button
            type="submit"
            className="rounded bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700"
          >
            設定並重新載入
          </button>
        </form>
      )}
    </div>
  );
}

export function AdminLayout() {
  const [menu, setMenu] = useState<MenuItemNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetch('/api/menu')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.menu)) setMenu(data.menu);
      })
      .catch(() => setMenu([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 bg-white transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0'
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
          <Link to="/admin" className="font-semibold text-gray-800">
            捨得資訊後台
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="關閉選單"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="text-sm text-gray-500">載入選單...</div>
          ) : (
            <ul id="menu-list" className="space-y-0.5">
              {menu.map((item) => (
                <li key={item.id}>
                  <MenuItem item={item} />
                </li>
              ))}
            </ul>
          )}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-label="關閉"
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            aria-label="開啟選單"
          >
            <Menu size={24} />
          </button>
          {!hasAdminKey() && <AdminKeyBanner onSet={() => window.location.reload()} />}
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
