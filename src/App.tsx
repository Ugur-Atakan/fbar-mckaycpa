import { Routes, Route, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import FBARForm from './components/FBARForm';
import ThankYou from './components/ThankYou';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ResumeForm from './components/ResumeForm';

function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FEFDFC]">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col items-start max-w-6xl mx-auto">
          <img 
            src="https://mckaycpa.com/wp-content/uploads/2024/04/mckay-logo-1.png" 
            alt="McKay & Co Logo" 
            className="h-12 sm:h-16 mb-8 sm:mb-12 mx-auto sm:mx-0"
          />

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 w-full">
            <div className="order-2 lg:order-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#002F4A] mb-4 sm:mb-6 text-center sm:text-left">
                FBAR Filing Made Simple
              </h1>
              
              <p className="text-base sm:text-lg text-gray-700 mb-6 sm:mb-8 text-center sm:text-left">
                As a part of McKay & Co's commitment to compliance and transparency, 
                we've made it easier for you to securely provide the necessary information 
                for filing your <strong>Foreign Bank and Financial Accounts Report (FBAR)</strong>.
              </p>

              <div className="bg-[#00304A]/5 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-[#00304A] mb-3 sm:mb-4 flex items-center justify-center sm:justify-start">
                  <Shield className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> What is FBAR?
                </h2>
                <p className="text-gray-700 text-center sm:text-left">
                  FBAR is a mandatory filing requirement for individuals and entities 
                  with foreign financial accounts exceeding $10,000 at any point during 
                  the year. Submitting this information ensures compliance with U.S. 
                  financial regulations.
                </p>
              </div>

              <div className="bg-[#FEFDFC] p-4 sm:p-6 rounded-lg border border-gray-200 mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-[#002F4A] mb-3 sm:mb-4 text-center sm:text-left">
                  Why It's Important
                </h2>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="text-[#002F4A] mt-1 mr-2 flex-shrink-0 h-5 w-5" />
                    <span>Stay compliant with federal regulations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-[#002F4A] mt-1 mr-2 flex-shrink-0 h-5 w-5" />
                    <span>Avoid potential penalties for late or incomplete filings</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-[#002F4A] mt-1 mr-2 flex-shrink-0 h-5 w-5" />
                    <span>Ensure accurate and timely reporting of your financial information</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 lg:sticky lg:top-8">
                <h2 className="text-xl sm:text-2xl font-semibold text-[#002F4A] mb-4 sm:mb-6 text-center sm:text-left">
                  Ready to Submit Your FBAR Information?
                </h2>

                <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                  <div>
                    <h3 className="font-semibold text-[#002F4A] mb-2 text-center sm:text-left">How It Works</h3>
                    <ol className="space-y-2 sm:space-y-3 list-decimal list-inside text-gray-700">
                      <li>Fill out the secure online form</li>
                      <li>Review your information for accuracy</li>
                      <li>Submit and let us handle the rest</li>
                    </ol>
                  </div>

                  <div className="bg-[#00304A]/5 rounded-lg p-4">
                    <div className="flex items-center text-[#00304A] mb-2 justify-center sm:justify-start">
                      <AlertCircle className="mr-2 h-5 w-5" />
                      <p className="font-medium">Important Notice</p>
                    </div>
                    <p className="text-gray-700 text-center sm:text-left">
                      All information submitted through this form is encrypted and secure. 
                      We take your privacy and data security seriously.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => navigate('/form')}
                    className="w-full bg-[#002F4A] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold 
                              text-base sm:text-lg hover:bg-[#00304A] transition-colors duration-200 
                              shadow-lg hover:shadow-xl"
                  >
                    Start Now
                  </button>

                  <button 
                    onClick={() => navigate('/resume')}
                    className="w-full bg-white border-2 border-[#002F4A] text-[#002F4A] px-6 sm:px-8 py-3 sm:py-4 
                              rounded-lg font-semibold text-base sm:text-lg hover:bg-gray-50 
                              transition-colors duration-200 shadow-lg hover:shadow-xl 
                              flex items-center justify-center"
                  >
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Continue Saved Form
                  </button>
                </div>

                <p className="mt-3 sm:mt-4 text-sm text-gray-600 text-center">
                  Estimated completion time: 10-15 minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-[#FEFDFC]">
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/form" element={<FBARForm />} />
        <Route path="/resume" element={<ResumeForm />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}

export default App;