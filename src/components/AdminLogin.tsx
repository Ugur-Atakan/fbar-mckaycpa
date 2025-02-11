import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin/dashboard');
    } catch (error: any) {
      // Provide user-friendly error messages
      switch (error.code) {
        case 'auth/invalid-credential':
          setError('Email veya şifre hatalı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.');
          break;
        case 'auth/invalid-email':
          setError('Geçersiz email adresi. Lütfen doğru bir email adresi girin.');
          break;
        case 'auth/user-disabled':
          setError('Bu hesap devre dışı bırakılmış. Lütfen yönetici ile iletişime geçin.');
          break;
        case 'auth/user-not-found':
          setError('Bu email adresi ile kayıtlı bir hesap bulunamadı.');
          break;
        case 'auth/too-many-requests':
          setError('Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.');
          break;
        default:
          setError('Giriş yapılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFDFC] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <img 
          src="https://mckaycpa.com/wp-content/uploads/2024/04/mckay-logo-1.png" 
          alt="McKay & Co Logo" 
          className="h-12 mx-auto mb-8"
        />
        
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-2xl font-bold text-[#002F4A] mb-6">Admin Login</h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center text-red-800">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#002F4A] focus:border-[#002F4A]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#002F4A] focus:border-[#002F4A]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-[#002F4A] text-white px-4 py-2 rounded-md font-semibold
                       ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-[#00304A]'}
                       transition-colors duration-200`}
            >
              {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}