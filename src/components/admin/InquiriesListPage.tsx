import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminFetch } from '../../lib/adminApi';
import type { InquiryRow } from '../../types/admin';

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待處理' },
  { value: 'replied', label: '已回覆' },
  { value: 'closed', label: '已結案' },
];

export function InquiriesListPage() {
  const [data, setData] = useState<InquiryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter) params.set('status', statusFilter);
    adminFetch(`/api/admin/inquiries?${params}`)
      .then((res) => {
        if (res.status === 401) {
          setError('請設定 VITE_ADMIN_API_KEY 以檢視列表');
          return res.json().then(() => {});
        }
        return res.json();
      })
      .then((json) => {
        if (json && json.success) {
          setData(json.data || []);
          setTotal(json.total ?? 0);
          setError(null);
        } else if (json && !json.success) setError(json.message || '載入失敗');
      })
      .catch(() => setError('載入失敗'))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">聯絡我們回覆</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="status" className="text-sm text-gray-600">狀態</label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">載入中...</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">機關</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">聯絡人</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">洽詢內容</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">狀態</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">建立時間</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{row.organization}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.contact_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.inquiry_type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.status === 'replied'
                            ? 'bg-green-100 text-green-800'
                            : row.status === 'closed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {row.status === 'replied' ? '已回覆' : row.status === 'closed' ? '已結案' : '待處理'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{row.created_at}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/inquiries/${row.id}`}
                        className="text-primary-600 hover:underline text-sm"
                      >
                        檢視
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length === 0 && (
              <p className="px-4 py-8 text-center text-gray-500">尚無洽詢資料</p>
            )}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                上一頁
              </button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                {page} / {totalPages}（共 {total} 筆）
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                下一頁
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
