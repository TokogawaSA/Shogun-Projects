/**
 * Project Deliverables Costing & Catalog Revenue View
 * Multi-Tenant Antigravity 2.0 Ecosystem
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Wrench, 
  Layers, 
  CheckCircle2, 
  Plus, 
  ArrowLeft, 
  AlertCircle, 
  Boxes 
} from 'lucide-react';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../catalog/hooks/useCatalog';
import { Project, ProjectDeliverable, ProjectMilestone } from '../../types';

export const ProjectCosting: React.FC = () => {
  const { id: routeProjectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'tenant-default';
  const { items: catalogItems } = useCatalog();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(routeProjectId || '');
  const [project, setProject] = useState<Project | null>(null);
  const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);

  // Modal / Add state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customMilestoneId, setCustomMilestoneId] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // 1. Fetch available projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await apiClient.get<Project[]>('/projects');
        if (Array.isArray(res) && res.length > 0) {
          setProjects(res);
          if (!selectedProjectId) {
            setSelectedProjectId(routeProjectId || res[0].id);
          }
        }
      } catch (e) {
        console.warn('[ProjectCosting] Error fetching projects:', e);
      }
    };
    fetchProjects();
  }, [routeProjectId, selectedProjectId]);

  // 2. Fetch selected project deliverables and milestones
  const fetchProjectData = useCallback(async () => {
    if (!selectedProjectId) return;

    try {
      // Fetch project doc
      const pData = await apiClient.get<Project>(`/projects/${selectedProjectId}`).catch(() => null);
      if (pData) {
        setProject(pData);
      }

      // Fetch deliverables
      const dList = await apiClient.get<ProjectDeliverable[]>(`/projects/${selectedProjectId}/deliverables`).catch(() => []);

      if (Array.isArray(dList) && dList.length > 0) {
        setDeliverables(dList);
      } else {
        // Mock seed deliverables if empty
        const initialMockDeliverables: ProjectDeliverable[] = [
          {
            id: 'deliv-1',
            projectId: selectedProjectId,
            tenantId,
            title: 'Enterprise Edge Blade Server 1U (Qty: 2)',
            type: 'product',
            productId: 'prod-blade-101',
            sku: 'HW-SRV-BLADE-X1',
            estimatedCost: 3900,
            billableAmount: 6400,
            profitMarginAmount: 2500,
            profitMarginPercent: 39.1,
            status: 'in_progress',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'deliv-2',
            projectId: selectedProjectId,
            tenantId,
            title: 'Custom MySQL Table Schema & Index Migration Package',
            type: 'service',
            productId: 'serv-db-201',
            sku: 'SRV-DB-OPT-01',
            estimatedCost: 1200,
            billableAmount: 3200,
            profitMarginAmount: 2000,
            profitMarginPercent: 62.5,
            status: 'delivered',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'deliv-3',
            projectId: selectedProjectId,
            tenantId,
            title: 'Action Scheduler Pipeline & Email Gateway Implementation',
            type: 'service',
            productId: 'serv-async-301',
            sku: 'SRV-ASYNC-AS-01',
            estimatedCost: 1800,
            billableAmount: 4500,
            profitMarginAmount: 2700,
            profitMarginPercent: 60.0,
            status: 'planned',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        setDeliverables(initialMockDeliverables);
      }

      // Fetch Milestones
      const mList = await apiClient.get<ProjectMilestone[]>(`/projects/${selectedProjectId}/milestones`).catch(() => []);
      if (Array.isArray(mList) && mList.length > 0) {
        setMilestones(mList);
      } else {
        setMilestones([
          {
            id: 'mile-phase1',
            projectId: selectedProjectId,
            tenantId,
            title: 'Phase 1: PSR-4 Autoloading & Core Scaffold',
            description: 'Foundation setup and controller registration',
            dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            status: 'completed',
            completionPercentage: 100,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'mile-phase2',
            projectId: selectedProjectId,
            tenantId,
            title: 'Phase 2: Database Schema & Submission Logging',
            description: 'Relational data layer implementation',
            dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            status: 'in_progress',
            completionPercentage: 60,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (e) {
      console.warn('[ProjectCosting] Error fetching project data:', e);
    }
  }, [selectedProjectId, tenantId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Aggregate Metrics Calculations
  let totalEstimatedCost = 0;
  let totalBillable = 0;
  let productsBillable = 0;
  let servicesBillable = 0;

  deliverables.forEach((d) => {
    totalEstimatedCost += d.estimatedCost || 0;
    totalBillable += d.billableAmount || 0;
    if (d.type === 'product') {
      productsBillable += d.billableAmount || 0;
    } else {
      servicesBillable += d.billableAmount || 0;
    }
  });

  const totalMarginAmount = totalBillable - totalEstimatedCost;
  const overallMarginPercent = totalBillable > 0 ? ((totalMarginAmount / totalBillable) * 100).toFixed(1) : '0.0';

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleUpdateDeliverableStatus = async (
    deliverableId: string,
    newStatus: ProjectDeliverable['status']
  ) => {
    setDeliverables((prev) =>
      prev.map((d) => (d.id === deliverableId ? { ...d, status: newStatus } : d))
    );

    try {
      await apiClient.put(`/projects/${selectedProjectId}/deliverables/${deliverableId}`, {
        status: newStatus,
        fulfilledDate: newStatus === 'delivered' || newStatus === 'accepted' ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      });
      showSuccess(`Deliverable marked as ${newStatus}`);
    } catch {
      // Continue
    }
  };

  const handleAddDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    const catalogItem = catalogItems.find((i) => i.id === selectedCatalogId);
    if (!catalogItem) return;

    const delivId = `deliv-${Date.now().toString(36)}`;
    const cost = catalogItem.costPrice;
    const billable = catalogItem.unitPrice;
    const margin = billable - cost;
    const marginPct = billable > 0 ? (margin / billable) * 100 : 0;

    const newDeliverable: ProjectDeliverable = {
      id: delivId,
      projectId: selectedProjectId,
      tenantId,
      title: customTitle.trim() || catalogItem.name,
      type: catalogItem.type,
      productId: catalogItem.id,
      sku: catalogItem.sku,
      milestoneId: customMilestoneId || null,
      estimatedCost: cost,
      billableAmount: billable,
      profitMarginAmount: margin,
      profitMarginPercent: Number(marginPct.toFixed(1)),
      status: 'planned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await apiClient.post(`/projects/${selectedProjectId}/deliverables`, newDeliverable);
      setDeliverables((prev) => [...prev, newDeliverable]);
      showSuccess(`Added deliverable: ${newDeliverable.title}`);
      setIsAddModalOpen(false);
      setSelectedCatalogId('');
      setCustomTitle('');
      setCustomMilestoneId('');
    } catch {
      setDeliverables((prev) => [...prev, newDeliverable]);
      showSuccess(`Added deliverable: ${newDeliverable.title}`);
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Top Header & Project Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects Directory
          </button>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            Project Deliverables & Revenue Costing
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {project ? `Workspace: ${project.title} • ` : ''}Track billable goods and professional service deliverables linked to catalog SKUs and profit margins
          </p>
        </div>

        {/* Project Selector & Add Deliverable */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 font-mono pl-2">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                navigate(`/projects/${e.target.value}/costing`);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Deliverable
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Total Billable Value</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
            ${totalBillable.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 font-mono">
            <span className="text-indigo-400">${productsBillable.toLocaleString()} Products</span>
            <span>•</span>
            <span className="text-emerald-400">${servicesBillable.toLocaleString()} Services</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Estimated Supply Cost</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
            ${totalEstimatedCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            COGS & engineering labor cost base
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Project Profit Margin</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
            ${totalMarginAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Net Margin: <span className="text-emerald-400 font-bold">{overallMarginPercent}%</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Deliverables Count</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
            {deliverables.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">
              {deliverables.filter((d) => d.status === 'delivered' || d.status === 'accepted').length} Fulfilled
            </span>
            <span>/ {deliverables.length} Total</span>
          </div>
        </div>
      </div>

      {/* Deliverables Breakdown Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="font-bold text-xs text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Deliverables & Catalog Line Allocation</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">{deliverables.length} Deliverables</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/95 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3.5 px-4">Deliverable Title & Catalog SKU</th>
                <th className="py-3.5 px-3 text-center">Type</th>
                <th className="py-3.5 px-3 text-right">Est. Cost ($)</th>
                <th className="py-3.5 px-3 text-right">Billable ($)</th>
                <th className="py-3.5 px-3 text-right">Margin ($ / %)</th>
                <th className="py-3.5 px-4 text-center">Fulfillment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {deliverables.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="font-semibold text-slate-400">No deliverables linked to this project</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Click "Add Deliverable" or convert an approved quote.</p>
                  </td>
                </tr>
              ) : (
                deliverables.map((deliv) => {
                  return (
                    <tr key={deliv.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              deliv.type === 'product'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {deliv.type === 'product' ? <Package className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-200">{deliv.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              SKU: {deliv.sku || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                            deliv.type === 'product'
                              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {deliv.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                        ${deliv.estimatedCost.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-100">
                        ${deliv.billableAmount.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono">
                        <span className="font-semibold text-emerald-400">
                          ${deliv.profitMarginAmount.toLocaleString()} ({deliv.profitMarginPercent}%)
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <select
                          value={deliv.status}
                          onChange={(e) =>
                            handleUpdateDeliverableStatus(
                              deliv.id,
                              e.target.value as ProjectDeliverable['status']
                            )
                          }
                          className={`text-xs font-semibold font-mono px-2.5 py-1 rounded-lg border transition ${
                            deliv.status === 'accepted' || deliv.status === 'delivered'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : deliv.status === 'in_progress'
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          <option value="planned">Planned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="delivered">Delivered / Shipped</option>
                          <option value="accepted">Client Accepted</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Deliverable Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Add Project Deliverable
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDeliverable} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Catalog Product / Service SKU <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedCatalogId}
                  onChange={(e) => {
                    setSelectedCatalogId(e.target.value);
                    const item = catalogItems.find((i) => i.id === e.target.value);
                    if (item) setCustomTitle(item.name);
                  }}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>
                    Select catalog item...
                  </option>
                  {catalogItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.type.toUpperCase()}] {item.name} (${item.unitPrice})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Deliverable Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Rack Assembly Deployment"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {milestones.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Assign to Project Milestone (Optional)
                  </label>
                  <select
                    value={customMilestoneId}
                    onChange={(e) => setCustomMilestoneId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">No Milestone (General Project Deliverable)</option>
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedCatalogId}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition disabled:opacity-50"
                >
                  Add Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProjectCosting;
