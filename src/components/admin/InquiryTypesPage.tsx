import { useState, useEffect } from 'react';
import { adminFetch, hasAdminKey } from '../../lib/adminApi';
import type { InquiryTypeItem } from '../../types/admin';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export function InquiryTypesPage() {
  const [items, setItems] = useState<InquiryTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    // 有金鑰時用 admin API（須帶 Authorization），無金鑰時用公開 API 讀取列表
    const url = hasAdminKey() ? '/api/admin/inquiry-types' : '/api/inquiry-types';
    const doFetch = hasAdminKey() ? adminFetch : fetch;
    doFetch(url)
      .then((res) => {
        if (res.status === 501) {
          setError('後端尚未設定 ADMIN_API_KEY。請在 Cloudflare Worker 的 Variables 中新增 ADMIN_API_KEY，並在後台上方輸入相同金鑰。');
          return null;
        }
        if (res.status === 401) {
          setError('金鑰錯誤或已過期，請重新在後台上方設定 API 金鑰。');
          return res.json().then(() => null);
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.success && data.items) setItems(data.items);
        else setError(data?.message || '載入失敗。若為正式環境，請確認已執行 D1 migrations（0002、0003）並已設定後端 ADMIN_API_KEY。');
      })
      .catch(() => setError('無法連線，請確認網路與後端服務。'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormLabel('');
    setFormSortOrder(items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 10 : 0);
    setShowForm(true);
  };

  const openEdit = (item: InquiryTypeItem) => {
    setEditingId(item.id);
    setFormLabel(item.label);
    setFormSortOrder(item.sort_order);
    setShowForm(true);
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) return;
    setSaving(true);
    if (editingId !== null) {
      adminFetch(`/api/admin/inquiry-types/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({ label: formLabel.trim(), sort_order: formSortOrder }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setShowForm(false);
            load();
          } else setError(data.message || '更新失敗');
        })
        .catch(() => setError('更新失敗'))
        .finally(() => setSaving(false));
    } else {
      adminFetch('/api/admin/inquiry-types', {
        method: 'POST',
        body: JSON.stringify({ label: formLabel.trim(), sort_order: formSortOrder }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setShowForm(false);
            load();
          } else setError(data.message || '新增失敗');
        })
        .catch(() => setError('新增失敗'))
        .finally(() => setSaving(false));
    }
  };

  const doDelete = (id: number) => {
    adminFetch(`/api/admin/inquiry-types/${id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDeleteConfirm(null);
          load();
        } else setError(data.message || '刪除失敗');
      })
      .catch(() => setError('刪除失敗'));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">洽詢內容選項</h1>
        {hasAdminKey() && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
          >
            <Plus size={20} />
            新增
          </button>
        )}
      </div>

      {!hasAdminKey() && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          若尚未設定金鑰，請在頁面上方「後台未設定 API 金鑰」處輸入與後端 ADMIN_API_KEY 相同的金鑰，即可啟用新增／編輯／刪除。
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={submitForm} className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">{editingId !== null ? '編輯' : '新增'}選項</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                顯示名稱
              </label>
              <input
                id="label"
                type="text"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="例如：系統維運評估"
                required
              />
            </div>
            <div>
              <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700 mb-1">
                排序
              </label>
              <input
                id="sort_order"
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? '儲存中...' : '儲存'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">載入中...</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">排序</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">顯示名稱</th>
                {hasAdminKey() && (
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">操作</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.sort_order}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.label}</td>
                  {hasAdminKey() && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="p-2 text-gray-500 hover:text-primary-600"
                        aria-label="編輯"
                      >
                        <Pencil size={18} />
                      </button>
                      {deleteConfirm === item.id ? (
                        <span className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => doDelete(item.id)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            確認刪除
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(null)}
                            className="text-sm text-gray-600 hover:underline"
                          >
                            取消
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(item.id)}
                          className="p-2 text-gray-500 hover:text-red-600"
                          aria-label="刪除"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="px-4 py-8 text-center text-gray-500">尚無選項</p>
          )}
        </div>
      )}
    </div>
  );
}
