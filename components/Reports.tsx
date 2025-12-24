import React, { useState, useEffect, useMemo } from 'react';
import { Block, MedicalRecordData } from '../types';
import { decryptText } from '../utils/encryptionUtils';
import { Printer, FileSpreadsheet, Search, Calendar, Filter, Loader2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface ReportsProps {
  chain: Block[];
}

interface DecryptedRow extends MedicalRecordData {
  originalIndex: number;
}

const ITEMS_PER_PAGE = 10;

const Reports: React.FC<ReportsProps> = ({ chain }) => {
  // Default to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [reportData, setReportData] = useState<DecryptedRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter blocks based on date range first to minimize decryption work
  const filteredBlocks = useMemo(() => {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);

    return chain
      .filter(block => block.index !== 0) // Skip genesis
      .filter(block => {
        const ts = block.data.timestamp;
        return ts >= start && ts <= end;
      })
      .sort((a, b) => b.timestamp - a.timestamp); // Newest first
  }, [chain, startDate, endDate]);

  // Handle Decryption of filtered results
  useEffect(() => {
    const processRecords = async () => {
      setIsLoading(true);
      const rows: DecryptedRow[] = [];

      for (const block of filteredBlocks) {
        const data = { ...block.data };
        
        if (data.isEncrypted) {
            try {
                data.diagnosis = await decryptText(data.diagnosis);
                data.treatment = await decryptText(data.treatment);
                data.symptoms = await decryptText(data.symptoms);
            } catch (e) {
                console.error("Decryption error in report", e);
                data.diagnosis = "[Gagal Dekripsi]";
            }
        }

        // Apply search filter AFTER decryption
        const searchLower = searchTerm.toLowerCase();
        const matches = 
            data.patientName.toLowerCase().includes(searchLower) ||
            data.patientId.toLowerCase().includes(searchLower) ||
            data.diagnosis.toLowerCase().includes(searchLower) ||
            data.department?.toLowerCase().includes(searchLower) ||
            data.doctorName.toLowerCase().includes(searchLower);

        if (matches) {
            rows.push({
                ...data,
                originalIndex: block.index
            });
        }
      }
      setReportData(rows);
      setCurrentPage(1); // Reset to first page on filter change
      setIsLoading(false);
    };

    const timer = setTimeout(() => {
        processRecords();
    }, 500);

    return () => clearTimeout(timer);
  }, [filteredBlocks, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(reportData.length / ITEMS_PER_PAGE);
  const currentData = reportData.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls - Hidden when printing */}
      <div className="flex flex-col gap-4 print:hidden">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-medical-600" />
                    Laporan Data Rekam Pasien
                </h2>
                <p className="text-slate-500 text-xs">Menu Laporan &gt; Rekam Medis Pasien</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-sm font-medium"
                >
                    <Printer className="w-4 h-4" />
                    Cetak
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors shadow-sm font-medium">
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel
                </button>
            </div>
        </div>

        {/* Filter Bar (Styled like VMedis Toolbar) */}
        <div className="bg-medical-50 p-3 rounded border border-medical-100 flex flex-col lg:flex-row gap-3 items-end lg:items-center">
            <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-slate-600 w-16">Periode:</span>
                 <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-medical-500"
                 />
                 <span className="text-xs text-slate-500">s/d</span>
                 <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-medical-500"
                 />
            </div>
            
            <div className="flex-1 w-full relative">
                 <Search className="w-4 h-4 text-slate-400 absolute left-2 top-1.5" />
                 <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari No. RM, Pasien, Diagnosa..."
                    className="w-full pl-8 pr-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-medical-500"
                 />
            </div>
            
            <button className="px-4 py-1 bg-medical-600 text-white text-sm rounded hover:bg-medical-700 transition-colors flex items-center gap-1 font-medium shadow-sm">
                <Filter className="w-3 h-3" />
                Filter Data
            </button>
        </div>
      </div>

      {/* Report Table Area */}
      <div className="bg-white rounded border border-slate-300 shadow-sm overflow-hidden print:shadow-none print:border-0 min-h-[500px] flex flex-col">
        {/* Print Only Header */}
        <div className="hidden print:block p-6 pb-2 text-center">
            <h1 className="text-xl font-bold text-black uppercase tracking-wider">Klinik Sehat MedChain</h1>
            <p className="text-xs text-black mb-4">Jl. Digital No. 1, Jakarta | Telp: (021) 555-0123</p>
            <div className="border-t-2 border-black border-double pt-4 mb-4">
                <h2 className="text-lg font-bold uppercase">Laporan Rekam Medis Pasien</h2>
                <p className="text-xs mt-1">Periode: {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}</p>
            </div>
        </div>

        {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-medical-500" />
                <p className="text-sm">Memuat data...</p>
            </div>
        ) : (
            <>
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-800 print:bg-transparent">
                        <tr>
                            <th className="px-3 py-2 border border-slate-300 text-xs font-bold text-center w-10">No</th>
                            <th className="px-3 py-2 border border-slate-300 text-xs font-bold w-24">Tanggal</th>
                            <th className="px-3 py-2 border border-slate-300 text-xs font-bold w-24">No. RM</th>
                            <th className="px-3 py-2 border border-slate-300 text-xs font-bold w-40">Nama Pasien</th>
                            <th className="px-3 py-2 border border-slate-300 text-xs font-bold w-24">Poli</th>
                            <th className="px-3 py-2 border border-slate-300 text-xs font-bold">Anamnesa</th>
                            <th className="px-3 py-2 border border-slate-300 text-xs font-bold">Diagnosa</th>
                            <th className="px-3 py-2 border border-slate-300 text-xs font-bold">Terapi</th>
                            <th className="px-3 py-2 border border-slate-300 text-xs font-bold w-32">Dokter</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.length > 0 ? (
                            currentData.map((row, index) => (
                                <tr key={index} className="hover:bg-blue-50 print:hover:bg-transparent odd:bg-white even:bg-slate-50 print:even:bg-transparent">
                                    <td className="px-3 py-2 border border-slate-300 text-xs text-center text-slate-600 print:text-black">
                                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                    </td>
                                    <td className="px-3 py-2 border border-slate-300 text-xs whitespace-nowrap text-slate-700 print:text-black">
                                        {new Date(row.timestamp).toLocaleDateString('id-ID')}
                                        <div className="text-[10px] text-slate-400 print:hidden">{new Date(row.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</div>
                                    </td>
                                    <td className="px-3 py-2 border border-slate-300 text-xs font-mono font-semibold text-slate-800 print:text-black">
                                        {row.patientId}
                                    </td>
                                    <td className="px-3 py-2 border border-slate-300 text-xs font-medium text-slate-900 print:text-black uppercase">
                                        {row.patientName}
                                    </td>
                                    <td className="px-3 py-2 border border-slate-300 text-xs text-slate-700 print:text-black">
                                        {row.department || '-'}
                                    </td>
                                    <td className="px-3 py-2 border border-slate-300 text-xs text-slate-600 print:text-black">
                                        {row.symptoms}
                                    </td>
                                    <td className="px-3 py-2 border border-slate-300 text-xs font-medium text-black">
                                        {row.diagnosis}
                                    </td>
                                    <td className="px-3 py-2 border border-slate-300 text-xs text-slate-600 print:text-black">
                                        {row.treatment}
                                    </td>
                                    <td className="px-3 py-2 border border-slate-300 text-xs text-slate-600 print:text-black">
                                        {row.doctorName}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} className="px-6 py-12 text-center text-slate-400 italic">
                                    Tidak ada data ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls - Hidden on Print */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
                <div className="text-xs text-slate-500">
                    Menampilkan {currentData.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, reportData.length)} dari {reportData.length} data
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium px-2">Halaman {currentPage}</span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
            </>
        )}
      </div>

      {/* Print Signature Area */}
      <div className="hidden print:flex justify-end mt-8 pr-12">
          <div className="text-center">
              <p className="text-xs mb-12">Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="text-xs font-bold border-b border-black inline-block min-w-[150px] pb-1">Admin Medis</p>
          </div>
      </div>

      <style>{`
        @media print {
            @page {
                size: landscape;
                margin: 10mm;
            }
            body {
                font-family: 'Times New Roman', serif;
                font-size: 10pt;
                background: white;
            }
            table {
                width: 100%;
                border-collapse: collapse;
            }
            th, td {
                border: 1px solid black !important;
                padding: 4px 6px;
            }
            thead {
                background-color: #f0f0f0 !important;
                -webkit-print-color-adjust: exact;
            }
        }
      `}</style>
    </div>
  );
};

export default Reports;