import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '../firebase';
import { Download, LogOut, Copy, CheckCircle, RefreshCw, ChevronDown, ChevronUp, Clock, Loader2, 
         CheckCircle2, Search, Square, CheckSquare, Trash2, Lock, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Account {
  id: string;
  type: string;
  currency: string;
  accountNumber: string;
  maxValue: number;
  usdValue: number;
  institutionName: string;
  mailingAddress: string;
}

interface Submission {
  id: string;
  companyName: string;
  accounts: Account[];
  submittedAt: { seconds: number; nanoseconds: number };
  status: 'pending' | 'in_progress' | 'completed';
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [deletingSubmission, setDeletingSubmission] = useState<string | null>(null);
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'fbar_submissions')),
      (snapshot) => {
        const submissionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Submission[];
        
        setSubmissions(submissionsData.sort((a, b) => 
          b.submittedAt.seconds - a.submittedAt.seconds
        ));
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching submissions:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setChangingPassword(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        setPasswordError('No user is currently signed in. Please sign in again.');
        return;
      }

      // Validation checks
      if (newPassword !== confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }

      if (newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters long');
        return;
      }

      if (newPassword === currentPassword) {
        setPasswordError('New password must be different from current password');
        return;
      }

      try {
        // First try to reauthenticate
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
      } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
          setPasswordError('Current password is incorrect');
        } else {
          console.error('Reauthentication error:', error);
          setPasswordError('Error verifying current password. Please try again.');
        }
        return;
      }

      // If reauthentication successful, update password
      try {
        await updatePassword(user, newPassword);
        setPasswordSuccess('Password successfully updated');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordChange(false);
          setPasswordSuccess('');
        }, 2000);
      } catch (error: any) {
        console.error('Password update error:', error);
        setPasswordError('Error updating password. Please try again.');
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      setPasswordError('An unexpected error occurred. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const searchLower = searchQuery.toLowerCase();
    return submission && (
      (submission.companyName?.toLowerCase() || '').includes(searchLower) ||
      submission.accounts?.some(account => 
        (account.institutionName?.toLowerCase() || '').includes(searchLower) ||
        (account.accountNumber?.toLowerCase() || '').includes(searchLower)
      )
    );
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const updateSubmissionStatus = async (submissionId: string, newStatus: Submission['status']) => {
    try {
      await updateDoc(doc(db, 'fbar_submissions', submissionId), {
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    if (!window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    setDeletingSubmission(submissionId);
    try {
      await deleteDoc(doc(db, 'fbar_submissions', submissionId));
      setSelectedSubmissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
      setExpandedSubmission(null);
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Failed to delete submission. Please try again.');
    } finally {
      setDeletingSubmission(null);
    }
  };

  const toggleSubmissionSelection = (submissionId: string) => {
    setSelectedSubmissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  const toggleAllSubmissions = () => {
    if (selectedSubmissions.size === filteredSubmissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(filteredSubmissions.map(s => s.id)));
    }
  };

  const exportToExcel = () => {
    if (selectedSubmissions.size === 0) {
      alert('Please select at least one submission to export');
      return;
    }

    const selectedData = submissions
      .filter(submission => selectedSubmissions.has(submission.id))
      .flatMap(submission => {
        return submission.accounts.map(account => ({
          'Company Name': submission.companyName || '',
          'Submission Date': new Date(submission.submittedAt.seconds * 1000).toLocaleString(),
          'Status': submission.status,
          'Account Type': account.type,
          'Institution Name': account.institutionName,
          'Institution Address': account.mailingAddress,
          'Account Number': account.accountNumber,
          'Currency': account.currency,
          'Maximum Value': account.maxValue.toLocaleString(),
          'USD Value': `$${account.usdValue.toLocaleString()}`,
          'Total Accounts': submission.accounts.length
        }));
      });

    const ws = XLSX.utils.json_to_sheet(selectedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'FBAR Submissions');

    const colWidths = Object.keys(selectedData[0] || {}).map(key => ({
      wch: Math.max(key.length, 
        ...selectedData.map(row => String(row[key]).length)
      )
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'fbar_submissions.xlsx');
  };

  return (
    <div className="min-h-screen bg-[#FEFDFC]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <img 
            src="https://mckaycpa.com/wp-content/uploads/2024/04/mckay-logo-1.png" 
            alt="McKay & Co Logo" 
            className="h-12"
          />
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowPasswordChange(true)}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              <Lock className="h-5 w-5 mr-2" />
              Change Password
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Password Change Modal */}
        {showPasswordChange && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-[#002F4A] mb-6">Change Password</h2>
              
              {passwordError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center text-red-800">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>{passwordError}</span>
                  </div>
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center text-green-800">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>{passwordSuccess}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#002F4A] focus:border-[#002F4A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#002F4A] focus:border-[#002F4A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#002F4A] focus:border-[#002F4A]"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordError('');
                      setPasswordSuccess('');
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className={`bg-[#002F4A] text-white px-4 py-2 rounded-md
                              ${changingPassword ? 'opacity-75 cursor-not-allowed' : 'hover:bg-[#00304A]'}
                              transition-colors duration-200`}
                  >
                    {changingPassword ? (
                      <span className="flex items-center">
                        <RefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Changing...
                      </span>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex flex-col space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-[#002F4A]">FBAR Submissions</h1>
                <button
                  onClick={toggleAllSubmissions}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  {selectedSubmissions.size === filteredSubmissions.length ? (
                    <CheckSquare className="h-5 w-5" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                  <span className="text-sm">Select All</span>
                </button>
                <span className="text-sm text-gray-500">
                  {selectedSubmissions.size} selected
                </span>
              </div>
              <button
                onClick={exportToExcel}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  selectedSubmissions.size > 0
                    ? 'bg-[#002F4A] text-white hover:bg-[#00304A]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                disabled={selectedSubmissions.size === 0}
              >
                <Download className="h-5 w-5 mr-2" />
                Export Selected
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by company name, institution, or account number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-[#002F4A] focus:border-[#002F4A]"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#002F4A]" />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {submissions.length === 0 ? 'No submissions found' : 'No results match your search'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <div key={submission.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => toggleSubmissionSelection(submission.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {selectedSubmissions.has(submission.id) ? (
                          <CheckSquare className="h-5 w-5 text-[#002F4A]" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                      <div>
                        <h3 className="font-semibold">
                          {submission.companyName || 'Unnamed Company'}
                          <button 
                            onClick={() => copyToClipboard(submission.companyName || 'Unnamed Company', `name-${submission.id}`)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                          >
                            {copiedField === `name-${submission.id}` ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </h3>
                        <p className="text-sm text-gray-500">
                          Submitted {new Date(submission.submittedAt.seconds * 1000).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <select
                        value={submission.status}
                        onChange={(e) => updateSubmissionStatus(submission.id, e.target.value as Submission['status'])}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          submission.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : submission.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        onClick={() => deleteSubmission(submission.id)}
                        className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors duration-200"
                        disabled={deletingSubmission === submission.id}
                        title="Delete Submission"
                      >
                        {deletingSubmission === submission.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => setExpandedSubmission(
                          expandedSubmission === submission.id ? null : submission.id
                        )}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedSubmission === submission.id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {expandedSubmission === submission.id && (
                    <div className="mt-4 space-y-4">
                      {submission.accounts.map((account, index) => (
                        <div key={index} className="bg-white p-4 rounded-md shadow-sm">
                          <h4 className="font-semibold mb-2">Account #{index + 1}</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Type</p>
                              <p className="font-medium">
                                {account.type}
                                <button 
                                  onClick={() => copyToClipboard(account.type, `type-${submission.id}-${index}`)}
                                  className="ml-2 text-gray-400 hover:text-gray-600"
                                >
                                  {copiedField === `type-${submission.id}-${index}` ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Account Number</p>
                              <p className="font-medium">
                                {account.accountNumber}
                                <button 
                                  onClick={() => copyToClipboard(account.accountNumber, `account-${submission.id}-${index}`)}
                                  className="ml-2 text-gray-400 hover:text-gray-600"
                                >
                                  {copiedField === `account-${submission.id}-${index}` ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Maximum Value</p>
                              <p className="font-medium">
                                {account.maxValue.toLocaleString()} {account.currency}
                                <button 
                                  onClick={() => copyToClipboard(`${account.maxValue.toLocaleString()} ${account.currency}`, `value-${submission.id}-${index}`)}
                                  className="ml-2 text-gray-400 hover:text-gray-600"
                                >
                                  {copiedField === `value-${submission.id}-${index}` ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">USD Value</p>
                              <p className="font-medium">
                                ${account.usdValue.toLocaleString()}
                                <button 
                                  onClick={() => copyToClipboard(`$${account.usdValue.toLocaleString()}`, `usd-${submission.id}-${index}`)}
                                  className="ml-2 text-gray-400 hover:text-gray-600"
                                >
                                  {copiedField === `usd-${submission.id}-${index}` ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-gray-500">Institution</p>
                              <p className="font-medium">
                                {account.institutionName}
                                <button 
                                  onClick={() => copyToClipboard(account.institutionName, `institution-${submission.id}-${index}`)}
                                  className="ml-2 text-gray-400 hover:text-gray-600"
                                >
                                  {copiedField === `institution-${submission.id}-${index}` ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-gray-500">Address</p>
                              <p className="font-medium">
                                {account.mailingAddress}
                                <button 
                                  onClick={() => copyToClipboard(account.mailingAddress, `address-${submission.id}-${index}`)}
                                  className="ml-2 text-gray-400 hover:text-gray-600"
                                >
                                  {copiedField === `address-${submission.id}-${index}` ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;