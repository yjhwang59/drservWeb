import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Key, Loader2, AlertCircle } from 'lucide-react';
import { hasAdminKey, setAdminApiKey, verifyAdminKey } from '../../lib/adminApi';

export function AdminLoginPage() {
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasAdminKey()) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError('請輸入 API 金鑰');
      return;
    }
    setError(null);
    setLoading(true);
    setAdminApiKey(trimmed);
    const result = await verifyAdminKey();
    setLoading(false);
    if (result.ok) {
      navigate('/admin', { replace: true });
    } else {
      setError(result.message);
    }
  };

  if (hasAdminKey()) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <Key className="h-6 w-6 text-primary-600" />
          </div>
        </div>
        <h1 className="text-center text-xl font-semibold text-gray-800">
          捨得資訊後台登入
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          請輸入與 Cloudflare Worker 環境變數 ADMIN_API_KEY 相同的金鑰
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-api-key"
              className="block text-sm font-medium text-gray-700"
            >
              API 金鑰
            </label>
            <input
              id="admin-api-key"
              type="password"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError(null);
              }}
              placeholder="請輸入金鑰"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              autoComplete="off"
              disabled={loading}
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                驗證中...
              </>
            ) : (
              '登入'
            )}
          </button>
        </form>
        <p className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-primary-600"
          >
            返回首頁
          </Link>
        </p>
      </div>
    </div>
  );
}
