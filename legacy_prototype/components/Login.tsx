import React, { useState, useEffect } from 'react';
import { Stethoscope, Lock, User, Key, ShieldCheck, Activity, Smartphone, AlertTriangle, Info } from 'lucide-react';
import { logAudit } from '../services/auditService';

interface LoginProps {
  onLogin: (user: { name: string; sip: string; role: string; hospitalId: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'CREDENTIALS' | 'MFA'>('CREDENTIALS');
  const [sip, setSip] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [hospitalId, setHospitalId] = useState('RS-A'); // Default to RS-A
  const [showDemo, setShowDemo] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // Check lockout status
  useEffect(() => {
    const savedLockout = localStorage.getItem('login_lockout');
    if (savedLockout) {
      const time = parseInt(savedLockout);
      if (time > Date.now()) {
        setLockoutUntil(time);
      } else {
        localStorage.removeItem('login_lockout');
      }
    }
  }, []);

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Check Lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setError(`Akun terkunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${remaining} detik.`);
      return;
    }

    // 2. Validate Input Policy
    if (password.length < 6) {
      setError("Password tidak memenuhi kebijakan keamanan (min. 12 karakter).");
      return;
    }

    setIsLoading(true);
    logAudit('LOGIN_ATTEMPT', sip, 'User attempting credential login');

    // Simulate API Call
    await new Promise(r => setTimeout(r, 1000));

    // Mock Validation
    // Explicit Demo Account
    if ((sip === '19800101' && password === 'medchain_demo') || sip === 'SATUSEHAT') {
      setFailedAttempts(0);
      logAudit('MFA_REQUEST', sip, 'Credentials valid, requesting MFA');
      setStep('MFA');
    } else {
      const newFailCount = failedAttempts + 1;
      setFailedAttempts(newFailCount);
      logAudit('LOGIN_FAILED', sip, `Invalid credentials. Attempt ${newFailCount}`);

      if (newFailCount >= 3) {
        const lockoutTime = Date.now() + 30000; // 30 seconds lockout
        setLockoutUntil(lockoutTime);
        localStorage.setItem('login_lockout', lockoutTime.toString());
        setError("Terlalu banyak percobaan gagal. Akun dikunci selama 30 detik untuk keamanan.");
      } else {
        setError("Kredensial tidak valid. Silakan cek NIP/SIP dan Password Anda.");
      }
    }
    setIsLoading(false);
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock OTP Validation (Any 6 digit code works for demo)
    await new Promise(r => setTimeout(r, 1000));

    if (otp.length === 6) {
      logAudit('LOGIN_SUCCESS', sip, 'MFA verified successfully');
      logAudit('MFA_SUCCESS', sip, 'Session started');
      onLogin({
        name: hospitalId === 'RS-A' ? "Dr. Budi Santoso, Sp.PD" : "Dr. Siti Aminah, Sp.A",
        sip: sip,
        role: "DOKTER_SPESIALIS",
        hospitalId: hospitalId
      });
    } else {
      setError("Kode OTP salah. Silakan cek aplikasi Authenticator/SATUSEHAT Mobile Anda.");
      logAudit('LOGIN_FAILED', sip, 'MFA Failed');
    }
    setIsLoading(false);
  };

  const handleSatuSehatLogin = () => {
    // Mock SSO
    alert("Mengalihkan ke Portal SSO SATUSEHAT SDMK...");
    setTimeout(() => {
      onLogin({
        name: "Ners. Siti Aminah, S.Kep",
        sip: "SS-SDMK-998877",
        role: "PERAWAT_KLINIS",
        hospitalId: hospitalId
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200">

        {/* Left Side: Compliance & Branding */}
        <div className="md:w-5/12 bg-gradient-to-br from-emerald-600 to-teal-700 p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Ministry_of_Health_%28Indonesia%29.svg/1200px-Ministry_of_Health_%28Indonesia%29.svg.png" className="h-10 w-auto bg-white rounded-full p-1" alt="Kemenkes RI" />
              <div className="border-l border-white/30 h-8 mx-2"></div>
              <h1 className="text-lg font-bold tracking-tight">SATUSEHAT<br /><span className="font-light text-sm opacity-90">Terintegrasi</span></h1>
            </div>

            <h2 className="text-2xl font-bold mb-4">SIMRS Standar 2026</h2>
            <div className="space-y-4 text-emerald-50 text-sm leading-relaxed">
              <p>
                Sistem Informasi Manajemen Rumah Sakit yang patuh pada regulasi nasional.
              </p>

              <ul className="space-y-3 mt-6">
                <li className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0 text-emerald-300" />
                  <div>
                    <span className="font-bold block">Keamanan Lapis Ganda (MFA)</span>
                    Biometrik & OTP untuk proteksi data medis.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Activity className="w-5 h-5 mt-0.5 shrink-0 text-emerald-300" />
                  <div>
                    <span className="font-bold block">Audit Trail Real-time</span>
                    Monitoring akses sesuai ISO 27001:2022.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Lock className="w-5 h-5 mt-0.5 shrink-0 text-emerald-300" />
                  <div>
                    <span className="font-bold block">Enkripsi AES-256</span>
                    Data terenkripsi End-to-End.
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="relative z-10 mt-12 pt-6 border-t border-white/20">
            <p className="text-[10px] text-emerald-100 opacity-80 text-justify">
              Sistem ini mematuhi <strong>PMK No. 24 Tahun 2022</strong> tentang Rekam Medis dan <strong>UU No. 17 Tahun 2023</strong> tentang Kesehatan. Akses data pasien dilindungi undang-undang. Segala bentuk akses tidak sah akan diproses hukum.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:w-7/12 p-12 flex flex-col justify-center bg-slate-50/50 relative">

          <div className="absolute top-4 right-4 flex gap-2">
            <div className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded border border-emerald-200">
              TLS 1.3 SECURE
            </div>
            <div className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded border border-blue-200">
              ISO 27001
            </div>
            <button onClick={() => setShowDemo(!showDemo)} className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-[10px] hover:bg-slate-300 transition-colors">
              {showDemo ? 'Hide Demo' : 'Demo Account'}
            </button>
          </div>

          {showDemo && (
            <div className="absolute top-12 right-4 w-48 bg-white border border-slate-200 shadow-lg p-2 rounded text-xs z-20">
              <p className="font-bold mb-1">Demo Credentials:</p>
              <p>SIP: <span className="font-mono bg-slate-100 px-1">19800101</span></p>
              <p>Pass: <span className="font-mono bg-slate-100 px-1">medchain_demo</span></p>
              <p className="mt-1 text-[10px] text-slate-400">OTP: Any 6 digits (e.g. 123456)</p>
            </div>
          )}

          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-800">
              {step === 'CREDENTIALS' ? 'Login Tenaga Kesehatan' : 'Verifikasi Keamanan (MFA)'}
            </h3>
            <p className="text-slate-500 text-sm mt-2">
              {step === 'CREDENTIALS'
                ? 'Silakan masuk menggunakan akun SATUSEHAT SDMK atau kredensial internal.'
                : 'Masukkan kode OTP 6 digit yang dikirim ke perangkat terdaftar Anda.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded flex items-start gap-3 animate-pulse">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {step === 'CREDENTIALS' ? (
            <div className="space-y-6">

              {/* Hospital Selector - NEW */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Pilih Rumah Sakit (Context)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setHospitalId('RS-A')}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${hospitalId === 'RS-A' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    🏥 Rumah Sakit A
                  </button>
                  <button
                    type="button"
                    onClick={() => setHospitalId('RS-B')}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${hospitalId === 'RS-B' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    🏥 Rumah Sakit B
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSatuSehatLogin}
                className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-3"
              >
                <img src="https://satusehat.kemkes.go.id/dashboard/assets/img/logo-satusehat.png" alt="" className="h-5 w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
                <span>Masuk dengan SATUSEHAT</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-300"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase">Atau Login Internal</span>
                <div className="flex-grow border-t border-slate-300"></div>
              </div>

              <form onSubmit={handleCredentialSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">NIP / No. SIP / STR</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={sip}
                      onChange={(e) => setSip(e.target.value)}
                      disabled={!!lockoutUntil}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="Contoh: 19800101..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={!!lockoutUntil}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="••••••••••••"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">Minimal 12 karakter, kombinasi huruf, angka & simbol.</p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !!lockoutUntil}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Memvalidasi...</span>
                    </>
                  ) : (
                    <>
                      <span>Lanjut ke Verifikasi</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-6 animate-fade-in">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600">
                  <Smartphone className="w-6 h-6" />
                </div>
                <p className="text-sm text-blue-800 font-medium">Device Authentication</p>
                <p className="text-xs text-blue-600 mt-1">
                  Kami telah mengirimkan kode OTP ke nomor WhatsApp terdaftar Anda (SATUSEHAT) <br />
                  <strong>+62 812-xxxx-8899</strong>
                </p>
              </div>

              <div>
                <label className="block text-center text-xs font-bold text-slate-700 uppercase mb-2">Kode OTP (One-Time Password)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full text-center tracking-[1em] font-mono text-2xl py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="000000"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Memverifikasi...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Verifikasi & Masuk</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep('CREDENTIALS'); setError(null); }}
                className="w-full text-xs text-slate-500 hover:text-emerald-600 underline text-center"
              >
                Kembali ke halaman login
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <div className="flex justify-center gap-4 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              <a href="#" className="hover:text-emerald-600">Kebijakan Privasi</a>
              <span>•</span>
              <a href="#" className="hover:text-emerald-600">Syarat Penggunaan</a>
              <span>•</span>
              <a href="#" className="hover:text-emerald-600">Bantuan Teknis</a>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              SIMRS Version 2026.1.0-Beta (Secure Build)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
