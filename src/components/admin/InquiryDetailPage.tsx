import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminFetch, hasAdminKey } from '../../lib/adminApi';
import type { InquiryRow } from '../../types/admin';
import { ArrowLeft, Trash2 } from 'lucide-react';

export function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<InquiryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminFetch(`/api/admin/inquiries/${id}`)
      .then((res) => {
        if (res.status === 401) {
          setError('請設定 VITE_ADMIN_API_KEY 以檢視詳情');
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (!json) return;
        if (json.success && json.data) {
          setItem(json.data);
          setAdminReply(json.data.admin_reply ?? '');
          setStatus(json.data.status ?? 'pending');
          setError(null);
        } else setError(json.message || '載入失敗');
      })
      .catch(() => setError('載入失敗'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    adminFetch(`/api/admin/inquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        admin_reply: adminReply.trim(),
        status,
        ...(adminReply.trim() ? { replied_at: new Date().toISOString() } : {}),
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && item) {
          setItem({ ...item, admin_reply: adminReply.trim(), status, replied_at: new Date().toISOString() });
        } else setError(json.message || '更新失敗');
      })
      .catch(() => setError('更新失敗'))
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    if (!id) return;
    adminFetch(`/api/admin/inquiries/${id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) navigate('/admin/inquiries');
        else setError(json.message || '刪除失敗');
      })
      .catch(() => setError('刪除失敗'));
  };

  if (loading) return <p className="text-gray-500">載入中...</p>;
  if (error && !item) return <div className="text-red-600">{error}</div>;
  if (!item) return null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/admin/inquiries')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          返回列表
        </button>
        {hasAdminKey() && (
          <div className="flex items-center gap-2">
            {deleteConfirm ? (
              <>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  確認刪除
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50"
              >
                <Trash2 size={18} />
                刪除
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">洽詢內容</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">機關名稱</dt>
              <dd className="text-gray-900">{item.organization}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">聯絡人</dt>
              <dd className="text-gray-900">{item.contact_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">電話</dt>
              <dd className="text-gray-900">{item.phone}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="text-gray-900">{item.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">洽詢類型</dt>
              <dd className="text-gray-900">{item.inquiry_type}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">建立時間</dt>
              <dd className="text-gray-500">{item.created_at}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">訊息內容</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-3 text-gray-900">{item.message}</dd>
            </div>
          </dl>
        </div>

        {hasAdminKey() && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">回覆與狀態</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="admin_reply" className="block text-sm font-medium text-gray-700 mb-1">
                  回覆內容
                </label>
                <textarea
                  id="admin_reply"
                  rows={6}
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="輸入回覆內容..."
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  狀態
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  <option value="pending">待處理</option>
                  <option value="replied">已回覆</option>
                  <option value="closed">已結案</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? '儲存中...' : '儲存'}
              </button>
            </form>
            {item.replied_at && (
              <p className="mt-3 text-sm text-gray-500">上次回覆時間：{item.replied_at}</p>
            )}
          </div>
        )}

        {!hasAdminKey() && item.admin_reply && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">回覆內容</h2>
            <p className="whitespace-pre-wrap text-gray-700">{item.admin_reply}</p>
            {item.replied_at && (
              <p className="mt-3 text-sm text-gray-500">回覆時間：{item.replied_at}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
