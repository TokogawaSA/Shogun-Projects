import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Clock, 
  FolderKanban, 
  X, 
  Loader2, 
  RefreshCw
} from 'lucide-react';
import { useFinancials } from '../hooks/useFinancials';
import { ExpenseCategory } from '../../../types';

export const ExpenseManager: React.FC = () => {
  const { 
    projects, 
    expenses, 
    createExpense, 
    updateExpenseStatus, 
    deleteExpense, 
    loading, 
    refresh 
  } = useFinancials();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [newProjectId, setNewProjectId] = useState<string>('');
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('software');
  const [newAmount, setNewAmount] = useState<number>(0);
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newDescription, setNewDescription] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const projectMap = new Map<string, string>();
  projects.forEach((p) => projectMap.set(p.id, p.title));

  const filteredExpenses = expenses.filter((exp) => {
    const pTitle = projectMap.get(exp.projectId) || '';
    const matchesSearch =
      exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.approvedBy || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
    const matchesProject = projectFilter === 'all' || exp.projectId === projectFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesProject;
  });

  const handleOpenAddModal = () => {
    setNewProjectId(projects[0]?.id || '');
    setNewCategory('software');
    setNewAmount(0);
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewDescription('');
    setIsModalOpen(true);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectId || newAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await createExpense({
        projectId: newProjectId,
        category: newCategory,
        amount: Number(newAmount),
        incurredDate: newDate,
        status: 'pending',
      });
      setIsModalOpen(false);
      setActionSuccessMsg('Expense logged successfully and queued for approval!');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (expenseId: string) => {
    try {
      await updateExpenseStatus(expenseId, 'approved');
      setActionSuccessMsg('Expense entry approved.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (expenseId: string) => {
    try {
      await updateExpenseStatus(expenseId, 'rejected');
      setActionSuccessMsg('Expense entry rejected.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      try {
        await deleteExpense(expenseId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Metrics
  const totalAmount = expenses.reduce((a, e) => a + Number(e.amount || 0), 0);
  const pendingCount = expenses.filter((e) => e.status === 'pending').length;
  const approvedTotal = expenses
    .filter((e) => e.status === 'approved')
    .reduce((a, e) => a + Number(e.amount || 0), 0);
  const pendingTotal = expenses
    .filter((e) => e.status === 'pending')
    .reduce((a, e) => a + Number(e.amount || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const categoryBadgeColors: Record<ExpenseCategory, string> = {
    labor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    software: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    hardware: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    travel: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    other: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Expense Entry & Manager Approval System
            </h1>
            <p className="text-xs text-slate-400">
              Audit CapEx & OpEx claims, track manager authorizations & enforce cost discipline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Log New Expense
          </button>
          <button
            onClick={() => refresh()}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Refresh Expenses"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Expense KPI Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Expenses Logged</span>
            <Receipt className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</div>
          <div className="text-[11px] text-slate-500 mt-1">{expenses.length} claims submitted</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Pending Authorizations</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">{pendingCount}</span>
            <span className="text-xs text-slate-400">({formatCurrency(pendingTotal)})</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Requires manager review</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Approved Actual Spend</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{formatCurrency(approvedTotal)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Rolled up into budget metrics</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Projects</span>
            <FolderKanban className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{projects.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Target project cost centers</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search category or approver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Approval Statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Expense Categories</option>
              <option value="software">Software & SaaS</option>
              <option value="hardware">Hardware & CapEx</option>
              <option value="labor">Labor & Contractor</option>
              <option value="travel">Travel & Logistics</option>
              <option value="other">Other Miscellaneous</option>
            </select>
          </div>

          <div>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Cost Center Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
            <p className="text-xs">Loading expense logs and audit history...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Receipt className="w-8 h-8 mx-auto text-slate-600 mb-1" />
            <p className="text-sm font-semibold text-slate-300">No expense entries found</p>
            <p className="text-xs">Adjust your search filters or log a new project expense claim.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Incurred Date</th>
                  <th className="px-6 py-3.5">Project Target</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Approval Status</th>
                  <th className="px-6 py-3.5">Approver / Reviewer</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredExpenses.map((exp) => {
                  const pTitle = projectMap.get(exp.projectId) || 'Project';
                  const isPending = exp.status === 'pending';
                  const isApproved = exp.status === 'approved';
                  const isRejected = exp.status === 'rejected';

                  return (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {exp.incurredDate || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-white block">{pTitle}</span>
                        <span className="text-[10px] font-mono text-slate-500">{exp.projectId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded border font-semibold ${
                            categoryBadgeColors[exp.category] || categoryBadgeColors.other
                          }`}
                        >
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-sm text-white font-mono">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="px-6 py-4">
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" /> Pending Review
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {exp.approvedBy || (
                          <span className="text-slate-600 italic">Awaiting Authorization</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(exp.id)}
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                                title="Approve Expense"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(exp.id)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                                title="Reject Expense"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Log Project Expenditure</h2>
                  <p className="text-xs text-slate-400">Record an incurred CapEx or OpEx charge</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Cost Center Project
                </label>
                <select
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Expense Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="software">Software & SaaS</option>
                    <option value="hardware">Hardware & CapEx</option>
                    <option value="labor">Labor & Contractor</option>
                    <option value="travel">Travel & Logistics</option>
                    <option value="other">Other / Misc</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Incurred Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Description / Justification (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Annual cloud database infrastructure renewal"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectId || newAmount <= 0 || isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Submit Expense
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
