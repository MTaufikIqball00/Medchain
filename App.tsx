import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Database, 
  Stethoscope,
  Menu,
  X,
  Users,
  Power,
  ShieldCheck,
  Cpu,
  Lock,
  Network,
  ClipboardList,
  LogOut
} from 'lucide-react';
import { AppView, Block, MedicalRecordData } from './types';
import { createGenesisBlock, createNewBlock, verifyChain } from './utils/blockchainUtils';
import Dashboard from './components/Dashboard';
import RecordForm from './components/RecordForm';
import BlockchainViewer from './components/BlockchainViewer';
import PatientList from './components/PatientList';
import PatientDetail from './components/PatientDetail';
import Reports from './components/Reports';
import Login from './components/Login';

interface UserData {
  name: string;
  sip: string;
  role: string;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [blockchain, setBlockchain] = useState<Block[]>([]);
  const [isChainValid, setIsChainValid] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for Patient Navigation
  const [selectedPatient, setSelectedPatient] = useState<{id: string, name: string} | null>(null);

  // Check Login Session
  useEffect(() => {
    const session = localStorage.getItem('medchain_user');
    if (session) {
      setCurrentUser(JSON.parse(session));
    }
  }, []);

  const handleLogin = (user: UserData) => {
    localStorage.setItem('medchain_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('medchain_user');
    setCurrentUser(null);
  };

  // Load from Persistence or wait for Initialization
  useEffect(() => {
    const loadChain = async () => {
      const savedChain = localStorage.getItem('medchain_ledger');
      if (savedChain) {
        try {
          const parsedChain = JSON.parse(savedChain);
          if (Array.isArray(parsedChain) && parsedChain.length > 0) {
            setBlockchain(parsedChain);
            setIsInitialized(true);
            const isValid = await verifyChain(parsedChain);
            setIsChainValid(isValid);
          }
        } catch (e) {
          console.error("Failed to parse local chain", e);
          localStorage.removeItem('medchain_ledger');
        }
      }
      setIsLoading(false);
    };
    loadChain();
  }, []);

  // Persistence Effect
  useEffect(() => {
    if (blockchain.length > 0) {
      localStorage.setItem('medchain_ledger', JSON.stringify(blockchain));
    }
  }, [blockchain]);

  const handleInitializeGenesis = async () => {
    setIsLoading(true);
    // Simulate network delay for effect
    await new Promise(resolve => setTimeout(resolve, 1500));
    const genesis = await createGenesisBlock();
    setBlockchain([genesis]);
    setIsInitialized(true);
    setIsLoading(false);
  };

  const handleAddRecord = async (data: MedicalRecordData) => {
    const latestBlock = blockchain[blockchain.length - 1];
    const newBlock = await createNewBlock(latestBlock, data);
    
    const newChain = [...blockchain, newBlock];
    setBlockchain(newChain);
    
    const isValid = await verifyChain(newChain);
    setIsChainValid(isValid);
    
    // Navigation logic
    if (selectedPatient) {
        setCurrentView(AppView.PATIENT_DETAIL);
    } else {
        setSelectedPatient({ id: data.patientId, name: data.patientName });
        setCurrentView(AppView.PATIENT_DETAIL);
    }
  };

  const handleResetSystem = () => {
    if(confirm("Are you sure you want to purge the blockchain node? All local data will be lost.")) {
      localStorage.removeItem('medchain_ledger');
      setBlockchain([]);
      setIsInitialized(false);
      setSelectedPatient(null);
      setCurrentView(AppView.DASHBOARD);
    }
  }

  const handlePatientSelect = (patientId: string) => {
     setSelectedPatient({ id: patientId, name: '' }); 
     setCurrentView(AppView.PATIENT_DETAIL);
  };

  const handleAddNewPatient = () => {
    setSelectedPatient(null);
    setCurrentView(AppView.ADD_RECORD);
  }

  const handleAddRecordForPatient = (id: string, name: string) => {
    setSelectedPatient({ id, name });
    setCurrentView(AppView.ADD_RECORD);
  }

  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setSelectedPatient(null);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        (currentView === view || (view === AppView.PATIENTS_LIST && currentView === AppView.PATIENT_DETAIL))
          ? 'bg-medical-50 text-medical-600 font-semibold border-r-4 border-medical-600' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  // --- LOGIN GUARD ---
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // --- INITIALIZATION SCREEN (THE FIRST STEP) ---
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-medical-600 p-8 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">MedChain Node</h1>
            <p className="text-medical-100 text-sm">Decentralized Medical Record System</p>
          </div>
          
          <div className="p-8">
            {isLoading ? (
              <div className="text-center space-y-4">
                 <div className="w-12 h-12 border-4 border-medical-200 border-t-medical-600 rounded-full animate-spin mx-auto"></div>
                 <p className="text-slate-600 font-medium">Synchronizing Ledger...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-medical-500" /> System Status
                  </h3>
                  <p className="text-sm text-slate-500">Node initialized. No active blockchain found in local storage.</p>
                </div>
                
                <div className="space-y-2">
                   <p className="text-center text-slate-600 text-sm">To begin, you must mint the <span className="font-bold text-slate-800">Genesis Block</span>.</p>
                   <p className="text-center text-xs text-slate-400">This is the first immutable record in the chain.</p>
                </div>

                <button 
                  onClick={handleInitializeGenesis}
                  className="w-full bg-gradient-to-r from-medical-600 to-medical-500 hover:from-medical-700 hover:to-medical-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Power className="w-5 h-5" />
                  Initialize Blockchain
                </button>
              </div>
            )}
          </div>
          
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
               <ShieldCheck className="w-3 h-3" /> Protected by SHA-256 Encryption
             </p>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP ---
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out print:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2 text-medical-600">
              <div className="p-2 bg-medical-600 rounded-lg text-white">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-800">MedChain</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 bg-slate-50 border-b border-slate-100">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-medical-100 flex items-center justify-center text-medical-700 font-bold border border-medical-200">
                    {currentUser.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser.role}</p>
                </div>
             </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
            <NavItem view={AppView.PATIENTS_LIST} icon={Users} label="Data Pasien" />
            <NavItem view={AppView.ADD_RECORD} icon={PlusCircle} label="Tambah Rekam Medis" />
            <NavItem view={AppView.REPORTS} icon={ClipboardList} label="Laporan Rekam Medis" />
            <NavItem view={AppView.BLOCKCHAIN} icon={Database} label="Blockchain Ledger" />
          </nav>

          <div className="p-4 border-t border-slate-100 space-y-2">
             <button 
               onClick={handleResetSystem}
               className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
             >
               <Power className="w-3 h-3" /> Reset Node Data
             </button>

             <button
               onClick={handleLogout}
               className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
             >
               <LogOut className="w-3 h-3" /> Logout
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-slate-800">
              {currentView === AppView.DASHBOARD && 'Overview'}
              {currentView === AppView.ADD_RECORD && 'Input Rekam Medis'}
              {currentView === AppView.BLOCKCHAIN && 'Ledger Explorer'}
              {currentView === AppView.PATIENTS_LIST && 'Direktori Pasien'}
              {currentView === AppView.PATIENT_DETAIL && 'Riwayat Pasien'}
              {currentView === AppView.REPORTS && 'Laporan & Statistik'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Network Indicator */}
             <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100 text-xs font-medium text-amber-700" title="Data stored locally in browser">
               <Lock className="w-3 h-3" />
               Private Local Node
             </div>
             
             <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

             <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               Node Active
             </div>
             <div className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded border border-indigo-100">
               {currentUser.sip}
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 print:p-0 print:overflow-visible">
          {currentView === AppView.DASHBOARD && (
            <Dashboard chain={blockchain} />
          )}
          
          {currentView === AppView.ADD_RECORD && (
            <RecordForm 
              onAddRecord={handleAddRecord} 
              initialData={selectedPatient ? { patientId: selectedPatient.id, patientName: selectedPatient.name } : null}
              doctorName={currentUser.name}
            />
          )}

          {currentView === AppView.BLOCKCHAIN && (
            <BlockchainViewer chain={blockchain} isValid={isChainValid} />
          )}

          {currentView === AppView.PATIENTS_LIST && (
            <PatientList 
              chain={blockchain} 
              onSelectPatient={handlePatientSelect}
              onAddNew={handleAddNewPatient}
            />
          )}

          {currentView === AppView.PATIENT_DETAIL && selectedPatient && (
            <PatientDetail 
              patientId={selectedPatient.id} 
              chain={blockchain}
              onBack={() => setCurrentView(AppView.PATIENTS_LIST)}
              onAddRecord={handleAddRecordForPatient}
            />
          )}

          {currentView === AppView.REPORTS && (
            <Reports chain={blockchain} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
