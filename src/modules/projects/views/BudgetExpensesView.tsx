import React, { useState, useEffect } from 'react';
import { ProjectInvoiceItem } from '../../../types';
import { projectManagementService } from '../../../services/projectManagementService';
import { DollarSign, FileText, Plus } from 'lucide-react';

export const BudgetExpensesView: React.FC = () => {
  const [invoices, setInvoices] = useState<ProjectInvoiceItem[]>([]);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await projectManagementService.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvoiceStatus = async (id: string, status: string) => {
    try {
      await projectManagementService.updateInvoiceStatus(id, status);
      await loadInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Financial Budgeting, Expense Claims & Invoicing
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                CapEx / OpEx / Invoices
              </span>
            </h3>
            <p className="text-xs text-slate-400">Track visual budget ceilings, log supplier expenses & execute billing generation</p>
          </div>
        </div>

        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Generate Client Invoice
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">CapEx & OpEx Budget Ceiling</span>
          <div className="text-2xl font-bold text-slate-100">$45,000.00</div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-emerald-500 h-full w-[65%]" />
          </div>
          <p className="text-[11px] font-mono text-slate-400">$29,250 Incurred (65% ceiling)</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">Supplier & Third-Party Expenses</span>
          <div className="text-2xl font-bold text-amber-400">$8,450.00</div>
          <p className="text-[11px] font-mono text-slate-400">12 Approved Supplier Invoices</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">Billed Revenue Generated</span>
          <div className="text-2xl font-bold text-indigo-400">$22,550.00</div>
          <p className="text-[11px] font-mono text-emerald-400">+$13,750 Pending Collection</p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Client Invoices & Billing Lifecycle</h4>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            {invoices.length} Invoices Active
          </span>
        </div>

        <div className="space-y-3">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-100">{inv.invoiceNumber}</h5>
                  <p className="text-xs font-mono text-slate-400">Due: {inv.dueDate} • {inv.notes}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 font-mono text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Grand Total</span>
                  <span className="text-slate-100 font-bold">${inv.totalAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">State</span>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                      inv.status === 'paid'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                        : inv.status === 'accepted'
                        ? 'bg-blue-950/80 text-blue-300 border-blue-800/60'
                        : 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              </div>

              {/* Status transition controls */}
              <div className="flex items-center gap-2 font-mono text-xs">
                {inv.status === 'requested' && (
                  <button
                    onClick={() => handleInvoiceStatus(inv.id, 'accepted')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all"
                  >
                    Mark Accepted
                  </button>
                )}
                {inv.status === 'accepted' && (
                  <button
                    onClick={() => handleInvoiceStatus(inv.id, 'paid')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all"
                  >
                    Mark Paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
