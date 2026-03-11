import { Link } from 'react-router-dom';
import { List, Inbox } from 'lucide-react';

export function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">儀表板</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/admin/inquiry-types"
          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="rounded-full bg-primary-100 p-3">
            <List className="text-primary-600" size={28} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">洽詢內容選項</h2>
            <p className="text-sm text-gray-500">管理聯絡表單下拉選單項目</p>
          </div>
        </Link>
        <Link
          to="/admin/inquiries"
          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="rounded-full bg-primary-100 p-3">
            <Inbox className="text-primary-600" size={28} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">表單回覆</h2>
            <p className="text-sm text-gray-500">檢視與回覆民眾洽詢</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
