import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@googlemaps/js-api-loader';
import { PlusCircle, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

interface BankAccount {
  id: string;
  type: string;
  currency: string;
  accountNumber: string;
  maxValue: number;
  usdValue: number;
  institutionName: string;
  mailingAddress: string;
}

const accountTypes = [
  {
    value: 'bank',
    label: 'Bank Account',
    description: 'A bank account held at a financial institution.'
  },
  {
    value: 'securities',
    label: 'Securities Account',
    description: 'An account holding securities, stocks, bonds, or other investment instruments.'
  }
];

const exchangeRates = {
  'EUR': 0.924,  // Euro
  'USD': 1.000,  // US Dollar
  'GBP': 0.783,  // British Pound
  'MXN': 18.330, // Mexican Peso
  'TRY': 32.867, // Turkish Lira
  'AED': 3.673,  // UAE Dirham
  'CAD': 1.370   // Canadian Dollar
};

const currencies = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'CAD', name: 'Canadian Dollar' }
];

const convertTurkishToEnglish = (text: string): string => {
  const turkishChars: { [key: string]: string } = {
    'ı': 'i', 'İ': 'I', 'ğ': 'g', 'Ğ': 'G',
    'ü': 'u', 'Ü': 'U', 'ş': 's', 'Ş': 'S',
    'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C'
  };
  
  return text.replace(/[ıİğĞüÜşŞöÖçÇ]/g, letter => turkishChars[letter] || letter);
};

function FBARForm() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [accounts, setAccounts] = useState<BankAccount[]>([{
    id: Date.now().toString(),
    type: '',
    currency: '',
    accountNumber: '',
    maxValue: 0,
    usdValue: 0,
    institutionName: '',
    mailingAddress: ''
  }]);
  const [mapsError, setMapsError] = useState<string>('');
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const formatNumber = (value: string): string => {
    const cleanValue = value.replace(/[^\d.]/g, '');
    const [integerPart, decimalPart] = cleanValue.split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  };

  const handleMaxValueChange = (id: string, value: string) => {
    const numericValue = parseFloat(value.replace(/,/g, '')) || 0;
    updateAccount(id, 'maxValue', numericValue);
  };

  const calculateUSDValue = (amount: number, currency: string): number => {
    const rate = exchangeRates[currency] || 1;
    return amount / rate;
  };

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setMapsError('Google Maps API key is missing. Please enter institution details manually.');
      setIsManualEntry(true);
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places']
    });

    loader.load().then(() => {
      setMapsError('');
      accounts.forEach(account => {
        const input = inputRefs.current[account.id];
        if (input) {
          try {
            const options = {
              types: ['establishment'],
              fields: ['name', 'formatted_address']
            };
            
            const autocompleteInstance = new google.maps.places.Autocomplete(input, options);
            autocompleteInstance.addListener('place_changed', () => {
              const place = autocompleteInstance.getPlace();
              if (place.formatted_address) {
                setAccounts(prevAccounts => 
                  prevAccounts.map(prevAccount => 
                    prevAccount.id === account.id 
                      ? { 
                          ...prevAccount, 
                          institutionName: convertTurkishToEnglish(place.name || ''),
                          mailingAddress: convertTurkishToEnglish(place.formatted_address || '')
                        }
                      : prevAccount
                  )
                );
              }
            });
          } catch (error) {
            console.error('Error initializing Places Autocomplete:', error);
            setMapsError('Error initializing address search. Please enter details manually.');
            setIsManualEntry(true);
          }
        }
      });
    }).catch(error => {
      console.error('Error loading Google Maps API:', error);
      setMapsError('Unable to load address search. Please enter institution details manually.');
      setIsManualEntry(true);
    });
  }, [accounts.length]);

  const addNewAccount = () => {
    setAccounts([...accounts, {
      id: Date.now().toString(),
      type: '',
      currency: '',
      accountNumber: '',
      maxValue: 0,
      usdValue: 0,
      institutionName: '',
      mailingAddress: ''
    }]);
  };

  const removeAccount = (id: string) => {
    if (accounts.length > 1) {
      setAccounts(accounts.filter(account => account.id !== id));
    }
  };

  const updateAccount = (id: string, field: keyof BankAccount, value: string | number) => {
    setAccounts(accounts.map(account => {
      if (account.id === id) {
        const updatedAccount = { ...account, [field]: value };
        
        if (field === 'maxValue' || field === 'currency') {
          updatedAccount.usdValue = calculateUSDValue(
            updatedAccount.maxValue,
            updatedAccount.currency
          );
        }
        
        if (field === 'institutionName' || field === 'mailingAddress') {
          updatedAccount[field] = convertTurkishToEnglish(value as string);
        }
        
        return updatedAccount;
      }
      return account;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!companyName.trim()) {
      setError('Please enter the company name.');
      setIsSubmitting(false);
      return;
    }

    try {
      const submissionData = {
        companyName: convertTurkishToEnglish(companyName),
        accounts: accounts.map(account => ({
          ...account,
          institutionName: convertTurkishToEnglish(account.institutionName),
          mailingAddress: convertTurkishToEnglish(account.mailingAddress)
        })),
        submittedAt: new Date(),
        status: 'pending'
      };

      await addDoc(collection(db, 'fbar_submissions'), submissionData);
      navigate('/thank-you');
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('An error occurred while submitting the form. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <img 
          src="https://mckaycpa.com/wp-content/uploads/2024/04/mckay-logo-1.png" 
          alt="McKay & Co Logo" 
          className="h-12 mx-auto mb-8"
        />
        
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-[#002F4A] mb-6">FBAR Information Form</h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#111828] mb-4">Company Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#002F4A] focus:border-[#002F4A]"
                required
              />
            </div>
          </div>

          {mapsError && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center text-yellow-800">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{mapsError}</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <h2 className="text-xl font-semibold text-[#111828]">Bank Accounts</h2>
          </div>
            
          {accounts.map((account, index) => (
            <div key={account.id} className="mb-8 p-6 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#002F4A]">
                  Account #{index + 1}
                </h3>
                {accounts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAccount(account.id)}
                    className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors duration-200"
                    title="Remove Account"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type of Account
                  </label>
                  <select
                    value={account.type}
                    onChange={(e) => updateAccount(account.id, 'type', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#002F4A] focus:border-[#002F4A]"
                    required
                  >
                    <option value="">Select account type</option>
                    {accountTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {account.type && (
                    <p className="mt-1 text-sm text-gray-500">
                      {accountTypes.find(t => t.value === account.type)?.description}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={account.currency}
                      onChange={(e) => updateAccount(account.id, 'currency', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#002F4A] focus:border-[#002F4A]"
                      required
                    >
                      <option value="">Select currency</option>
                      {currencies.map(currency => (
                        <option key={currency.code} value={currency.code}>
                          {currency.name} ({currency.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={account.accountNumber}
                      onChange={(e) => updateAccount(account.id, 'accountNumber', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#002F4A] focus:border-[#002F4A]"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Value (in selected currency)
                    </label>
                    <input
                      type="text"
                      value={account.maxValue ? formatNumber(account.maxValue.toString()) : ''}
                      onChange={(e) => handleMaxValueChange(account.id, e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#002F4A] focus:border-[#002F4A]"
                      placeholder="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      USD Value
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={account.usdValue ? formatNumber(account.usdValue.toFixed(2)) : '0'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name of Institution
                  </label>
                  <input
                    ref={el => inputRefs.current[account.id] = el}
                    type="text"
                    value={account.institutionName}
                    onChange={(e) => updateAccount(account.id, 'institutionName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#002F4A] focus:border-[#002F4A]"
                    placeholder={isManualEntry ? "Enter institution name" : "Start typing to search..."}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mailing Address
                  </label>
                  <input
                    type="text"
                    value={account.mailingAddress}
                    onChange={(e) => updateAccount(account.id, 'mailingAddress', e.target.value)}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-md ${isManualEntry ? 'focus:ring-[#002F4A] focus:border-[#002F4A]' : 'bg-gray-100'}`}
                    placeholder={isManualEntry ? "Enter institution address" : "Address will be filled automatically"}
                    disabled={!isManualEntry}
                    required
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addNewAccount}
            className="group relative w-full flex items-center justify-center px-6 py-4 bg-[#002F4A] text-white rounded-lg 
                     hover:bg-[#00304A] transition-all duration-200 shadow-lg hover:shadow-xl 
                     transform hover:-translate-y-0.5"
          >
            <PlusCircle className="mr-2 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-semibold">Add Another Account</span>
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center text-red-800">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="text-center mt-8">
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`bg-[#002F4A] text-white px-8 py-4 rounded-lg font-semibold 
                      text-lg transition-colors duration-200 
                      shadow-lg hover:shadow-xl
                      ${isSubmitting 
                        ? 'opacity-75 cursor-not-allowed' 
                        : 'hover:bg-[#00304A]'}`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <RefreshCw className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Submitting...
                </span>
              ) : (
                'Submit FBAR Information'
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default FBARForm;