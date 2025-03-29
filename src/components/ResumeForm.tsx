import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

export default function ResumeForm() {
  const navigate = useNavigate();
  const [resumeCode, setResumeCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const draftQuery = query(
        collection(db, 'fbar_drafts'), 
        where('resumeCode', '==', resumeCode)
      );
      
      const querySnapshot = await getDocs(draftQuery);
      
      if (querySnapshot.empty) {
        setError('Invalid code. Please check your code and try again.');
        return;
      }

      const draftDoc = querySnapshot.docs[0];
      const draftData = draftDoc.data();

      navigate('/form', { 
        state: { 
          resumeData: {
            ...draftData,
            id: draftDoc.id
          }
        }
      });

    } catch (error) {
      console.error('Error checking resume code:', error);
      setError('An error occurred. Please try again.');
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
          <h1 className="text-2xl font-bold text-[#002F4A] mb-2">Continue Your Form</h1>
          <p className="text-gray-600 mb-6">
            Enter your 4-digit code to continue where you left off.
          </p>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center text-red-800">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resume Code
              </label>
              <input
                type="text"
                maxLength={4}
                value={resumeCode}
                onChange={(e) => setResumeCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full px-4 py-2 text-2xl tracking-wider font-mono text-center border border-gray-300 rounded-md focus:ring-[#002F4A] focus:border-[#002F4A]"
                placeholder="0000"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || resumeCode.length !== 4}
              className={`w-full flex items-center justify-center bg-[#002F4A] text-white px-4 py-3 rounded-lg font-semibold
                       ${(isLoading || resumeCode.length !== 4) ? 'opacity-75 cursor-not-allowed' : 'hover:bg-[#00304A]'}
                       transition-colors duration-200`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <RefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Checking...
                </span>
              ) : (
                <span className="flex items-center">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Continue Form
                </span>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                Back to Home
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}