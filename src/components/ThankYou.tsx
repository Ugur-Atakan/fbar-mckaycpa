import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function ThankYou() {
  return (
    <div className="min-h-screen bg-[#FEFDFC] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <img 
          src="https://mckaycpa.com/wp-content/uploads/2024/04/mckay-logo-1.png" 
          alt="McKay & Co Logo" 
          className="h-12 mx-auto mb-8"
        />
        
        <div className="bg-white rounded-lg shadow-xl p-8 md:p-12">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-[#002F4A] mb-4">
            Thank You for Your Submission
          </h1>
          
          <p className="text-gray-600 mb-8">
            Your FBAR information has been successfully received. Our team will review 
            your submission and contact you if any additional information is needed.
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h2 className="font-semibold text-[#002F4A] mb-2">What's Next?</h2>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Our team will review your submission</li>
                <li>• We'll prepare your FBAR filing</li>
                <li>• You'll receive a confirmation once filed</li>
              </ul>
            </div>
            
            <Link 
              to="/"
              className="inline-block bg-[#002F4A] text-white px-6 py-3 rounded-lg 
                       font-semibold hover:bg-[#00304A] transition-colors duration-200"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}