import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { TAMIL_DISTRICTS } from '../constants/tamilData.ts';
import { X, Lock, Mail, User as UserIcon, MapPin, AlertCircle, Loader2 } from 'lucide-react';

interface AuthModalProps {
  onShowToast: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onShowToast }) => {
  const { isAuthModalOpen, authModalTab, closeAuthModal, openAuthModal, login, register } = useAuth();

  const [tab, setTab] = useState<'login' | 'register' | 'recover'>(authModalTab);

  // Login fields
  const [credential, setCredential] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  // Register fields
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [district, setDistrict] = useState<string>('மதுரை');
  const [village, setVillage] = useState<string>('');
  const [bio, setBio] = useState<string>('');

  // Recover fields
  const [recoverEmail, setRecoverEmail] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential || !loginPassword) {
      setErrorMessage('பயனர் பெயர் மற்றும் கடவுச்சொல்லை உள்ளிடவும்.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(credential, loginPassword);
      onShowToast('வெற்றிகரமாக உள்நுழைந்தீர்கள்!');
    } catch (err: any) {
      setErrorMessage(err.message || 'உள்நுழைவு தோல்வியடைந்தது.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !email || !regPassword) {
      setErrorMessage('அனைத்துக் கட்டாய விவரங்களையும் உள்ளிடவும்.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('கடவுச்சொல் குறைந்தது 6 எழுத்துகள் கொண்டிருக்க வேண்டும்.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await register({
        name,
        username,
        email,
        password: regPassword,
        district,
        village,
        bio
      });
      onShowToast('உங்கள் பயனர் கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது!');
    } catch (err: any) {
      setErrorMessage(err.message || 'பதிவு செய்வதில் பிழை.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoverEmail) {
      setErrorMessage('மின்னஞ்சல் முகவரியை உள்ளிடவும்.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.recoverPassword(recoverEmail);
      onShowToast(res.message);
      setTab('login');
    } catch (err: any) {
      setErrorMessage(err.message || 'மீட்பு வழிமுறை அனுப்புவதில் பிழை.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1F2421]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF6EE] border border-[#E8DEC8] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#E2D9CE] text-[#5C5346] transition-colors"
          title="மூடு"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab switchers */}
        <div className="flex border-b border-[#E8DEC8] mb-6">
          <button
            onClick={() => {
              setTab('login');
              setErrorMessage(null);
            }}
            className={`pb-2.5 px-4 text-sm font-bold border-b-2 transition-colors ${
              tab === 'login'
                ? 'border-[#7B1113] text-[#7B1113]'
                : 'border-transparent text-[#786C5E] hover:text-[#1F2421]'
            }`}
          >
            உள்நுழை
          </button>
          <button
            onClick={() => {
              setTab('register');
              setErrorMessage(null);
            }}
            className={`pb-2.5 px-4 text-sm font-bold border-b-2 transition-colors ${
              tab === 'register'
                ? 'border-[#7B1113] text-[#7B1113]'
                : 'border-transparent text-[#786C5E] hover:text-[#1F2421]'
            }`}
          >
            புதிய கணக்கு
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1">
                பயனர் பெயர் அல்லது மின்னஞ்சல்
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#786C5E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={credential}
                  onChange={e => setCredential(e.target.value)}
                  placeholder="பயனர் பெயர் அல்லது மின்னஞ்சல்"
                  className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#7B1113] uppercase tracking-wider">
                  கடவுச்சொல்
                </label>
                <button
                  type="button"
                  onClick={() => setTab('recover')}
                  className="text-xs text-[#C5A059] hover:underline font-semibold"
                >
                  கடவுச்சொல் மறந்ததா?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#786C5E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="கடவுச்சொல்"
                  className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#7B1113] hover:bg-[#600E10] text-[#FDFBF7] rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 mt-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>உள்நுழைக</span>
            </button>
          </form>
        )}

        {/* 2. Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1">
                முழுப் பெயர் *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="எ.கா. பாண்டியன் தமிழன்"
                className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl px-3 py-2 text-sm text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1">
                  பயனர் பெயர் *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="pandian_t"
                  className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl px-3 py-2 text-sm text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1">
                  மாவட்டம்
                </label>
                <select
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl px-2 py-2 text-xs text-[#1F2421] focus:outline-none focus:border-[#7B1113]"
                >
                  {TAMIL_DISTRICTS.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1">
                மின்னஞ்சல் *
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="yourname@domain.com"
                className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl px-3 py-2 text-sm text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1">
                கடவுச்சொல் (குறைந்தது 6 எழுத்துகள்) *
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl px-3 py-2 text-sm text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1">
                சுயவிவரக் குறிப்பு (சுருக்கமாக)
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="நாட்டுப்புறக் கதைகள் மற்றும் கிராமிய வரலாற்றில் ஆர்வம் உள்ளவர்..."
                className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl px-3 py-2 text-xs text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#7B1113] hover:bg-[#600E10] text-[#FDFBF7] rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 mt-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>கணக்கை உருவாக்கு</span>
            </button>
          </form>
        )}

        {/* 3. Password Recovery */}
        {tab === 'recover' && (
          <form onSubmit={handleRecoverSubmit} className="space-y-4">
            <p className="text-xs text-[#5C5346] leading-relaxed">
              உங்கள் பதிவுசெய்த மின்னஞ்சல் முகவரியை உள்ளிடவும். கடவுச்சொல் மீட்டெடுப்பதற்கான வழிமுறைகள் உங்களுக்கு அனுப்பப்படும்.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1">
                மின்னஞ்சல் முகவரி
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#786C5E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={recoverEmail}
                  onChange={e => setRecoverEmail(e.target.value)}
                  placeholder="yourname@domain.com"
                  className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTab('login')}
                className="px-4 py-2 border border-[#E2D9CE] rounded-xl text-xs font-semibold text-[#5C5346]"
              >
                பின்செல்
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 bg-[#7B1113] hover:bg-[#600E10] text-[#FDFBF7] rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isLoading ? 'அனுப்பப்படுகிறது...' : 'மீட்பு வழிமுறை அனுப்புக'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
