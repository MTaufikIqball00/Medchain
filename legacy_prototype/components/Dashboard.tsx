import React from 'react';
import { Block } from '../types';
import { Activity, Users, FileCheck, AlertCircle, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  chain: Block[];
}

const Dashboard: React.FC<DashboardProps> = ({ chain }) => {
  // Calculate simple stats from the chain
  const totalRecords = chain.length - 1; // Exclude Genesis
  const uniquePatients = new Set(chain.slice(1).map(b => b.data.patientId)).size;
  
  // Calculate diagnosis distribution
  const diagnosisCounts: Record<string, number> = {};
  chain.slice(1).forEach(block => {
      let diag = block.data.diagnosis || "Unknown";
      if (block.data.isEncrypted) {
          diag = "Protected Record (Encrypted)";
      }
      diagnosisCounts[diag] = (diagnosisCounts[diag] || 0) + 1;
  });

  const chartData = Object.keys(diagnosisCounts).map(key => ({
      name: key,
      count: diagnosisCounts[key]
  })).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5

  const stats = [
    { title: 'Total Blocks', value: chain.length, icon: <Activity className="w-5 h-5" />, color: 'bg-blue-500' },
    { title: 'Medical Records', value: totalRecords, icon: <FileCheck className="w-5 h-5" />, color: 'bg-green-500' },
    { title: 'Unique Patients', value: uniquePatients, icon: <Users className="w-5 h-5" />, color: 'bg-purple-500' },
    { title: 'System Status', value: 'Active', icon: <AlertCircle className="w-5 h-5" />, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
            </div>
            <div className={`${stat.color} p-3 rounded-lg text-white shadow-md bg-opacity-90`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Recent Diagnosis Distribution</h3>
          <div className="h-64">
             {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} />
                        <YAxis allowDecimals={false} />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.name.includes('Encrypted') ? '#f59e0b' : ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899'][index % 4]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                    No data available. Add records to see analytics.
                </div>
             )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="text-lg font-semibold text-slate-800 mb-4">Latest Activity</h3>
           <div className="space-y-4">
               {chain.slice().reverse().slice(0, 4).map((block) => (
                   <div key={block.hash} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                       <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${block.data.isEncrypted ? 'bg-amber-500' : 'bg-medical-500'}`}></div>
                       <div>
                           <div className="flex items-center gap-2">
                             <p className="text-sm font-medium text-slate-800">
                                 {block.index === 0 ? "Genesis Block Created" : `Record Added: ${block.data.patientName}`}
                             </p>
                             {block.data.isEncrypted && <Lock className="w-3 h-3 text-amber-500" />}
                           </div>
                           <p className="text-xs text-slate-500 mt-0.5">
                               {new Date(block.timestamp).toLocaleTimeString()} • Block #{block.index}
                           </p>
                       </div>
                   </div>
               ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;