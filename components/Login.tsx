import React, { useState } from 'react';
import { Stethoscope, Lock, User, Key, ShieldCheck, Activity } from 'lucide-react';

interface LoginProps {
  onLogin: (user: { name: string; sip: string; role: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [sip, setSip] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock Authentication Logic
    // In a real SIMRS, this would validate against a backend API
    setTimeout(() => {
      if (sip && password) {
        onLogin({
          name: "Dr. Budi Santoso, Sp.PD",
          sip: sip,
          role: "Dokter Spesialis Penyakit Dalam"
        });
      } else {
        alert("Mohon lengkapi NIP/SIP dan Password");
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* Left Side: Branding */}
        <div className="md:w-1/2 bg-medical-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
                    <Stethoscope className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">MedChain<span className="font-light opacity-80">System</span></h1>
            </div>
            <h2 className="text-3xl font-bold mb-4">Sistem Informasi Rekam Medis Terintegrasi</h2>
            <p className="text-medical-100 leading-relaxed">
              Platform rekam medis elektronik standar nasional dengan keamanan Blockchain dan analisis AI.
            </p>
          </div>

          <div className="relative z-10 mt-12 space-y-4">
             <div className="flex items-center gap-3 text-sm text-medical-100">
                <ShieldCheck className="w-5 h-5" />
                <span>Enkripsi End-to-End</span>
             </div>
             <div className="flex items-center gap-3 text-sm text-medical-100">
                <Activity className="w-5 h-5" />
                <span>Real-time Monitoring</span>
             </div>
          </div>

          {/* Abstract Background Shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-800">Login Petugas Medis</h3>
            <p className="text-slate-500 text-sm mt-2">Silahkan masuk menggunakan kredensial SIMRS Anda</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">NIP / No. SIP</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={sip}
                  onChange={(e) => setSip(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-transparent outline-none transition-all"
                  placeholder="Masukkan Nomor SIP"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password / PIN</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-slate-300 text-medical-600 focus:ring-medical-500" />
                    <span className="text-slate-600">Ingat Saya</span>
                </label>
                <a href="#" className="text-medical-600 hover:text-medical-700 font-medium">Lupa Password?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-medical-600 hover:bg-medical-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                </>
              ) : (
                <>
                    <Lock className="w-5 h-5" />
                    <span>Masuk ke Sistem</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
                &copy; {new Date().getFullYear()} Kementerian Kesehatan Republik Indonesia / RSUD Digital
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
