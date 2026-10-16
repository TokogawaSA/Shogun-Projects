import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { WebForm } from '../types/form';
import { formService } from '../services/formService';
import { evaluateFormConditionalLogic } from '../utils/formConditionalEngine';

export const PublicWebFormPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<WebForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form values & validation
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  useEffect(() => {
    if (!formId) return;
    loadForm();
  }, [formId]);

  const loadForm = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await formService.getFormById(formId!);
      if (data) {
        setForm(data);
        // Prepopulate default values
        const initial: Record<string, any> = {};
        data.fields.forEach((f) => {
          if (f.defaultValue !== undefined) initial[f.id] = f.defaultValue;
        });
        setFormValues(initial);
      } else {
        setError('This web form is currently unavailable or inactive.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load web form.');
    } finally {
      setLoading(false);
    }
  };

  // Run dynamic conditional logic evaluation on every field change
  const evalResult = form
    ? evaluateFormConditionalLogic(form.fields, formValues, form.conditionalRules)
    : { visibility: {}, required: {}, values: formValues, activeRuleIds: [] };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    // Clear error for field if any
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!form) return false;
    const newErrors: Record<string, string> = {};

    form.fields.forEach((field) => {
      const isVisible = evalResult.visibility[field.id] !== false;
      const isRequired = evalResult.required[field.id];
      const val = formValues[field.id];

      if (isVisible && isRequired) {
        if (val === undefined || val === null || String(val).trim() === '') {
          newErrors[field.id] = `${field.label} is required.`;
        }
      }

      if (isVisible && field.type === 'email' && val) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(val).trim())) {
          newErrors[field.id] = 'Please enter a valid email address.';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !form) return;

    setSubmitting(true);
    try {
      const result = await formService.submitPublicForm(form.id, formValues);
      setSubmissionResult(result);
      setSubmitted(true);
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormValues({});
    setErrors({});
    setSubmitted(false);
    setSubmissionResult(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <p className="text-xs text-slate-400 font-mono">Loading Interactive Web Form...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">Web Form Unavailable</h2>
        <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6">
          {error || 'The requested form could not be found or has been archived.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
        >
          Return to Platform
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-x-hidden selection:bg-indigo-500/30">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">
            Shogun Operations Network
          </span>
        </div>

        {/* Main Form Container Card */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl p-6 sm:p-8 overflow-hidden">
          {submitted ? (
            /* Success confirmation screen */
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                Submission Received & Routed
              </h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                {form.successMessage}
              </p>

              {submissionResult?.submissionId && (
                <div className="inline-block px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 font-mono text-[11px] text-slate-400">
                  Confirmation Code: <span className="text-indigo-400 font-bold">{submissionResult.submissionId}</span>
                </div>
              )}

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Submit Another Response
                </button>
              </div>
            </div>
          ) : (
            /* Active Form Inputs */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Title & Description */}
              <div className="border-b border-slate-800 pb-5">
                <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">{form.title}</h1>
                {form.description && (
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{form.description}</p>
                )}
              </div>

              {/* Dynamic Inputs Grid */}
              <div className="grid grid-cols-2 gap-4">
                {form.fields.map((field) => {
                  const isVisible = evalResult.visibility[field.id] !== false;
                  const isRequired = evalResult.required[field.id];
                  const hasError = Boolean(errors[field.id]);

                  if (!isVisible) return null;

                  return (
                    <div
                      key={field.id}
                      className={`${field.width === 'half' ? 'col-span-2 sm:col-span-1' : 'col-span-2'} space-y-1.5 animate-in fade-in duration-200`}
                    >
                      <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                        <span>
                          {field.label} {isRequired && <span className="text-rose-400">*</span>}
                        </span>
                      </label>

                      {field.type === 'select' ? (
                        <select
                          value={formValues[field.id] || ''}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          className={`w-full px-3.5 py-2.5 bg-slate-950/70 border rounded-xl text-xs text-slate-100 focus:outline-none transition-all ${
                            hasError
                              ? 'border-rose-500/80 focus:border-rose-500'
                              : 'border-slate-800 focus:border-indigo-500'
                          }`}
                        >
                          <option value="">Select an option...</option>
                          {(field.options || []).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          placeholder={field.placeholder}
                          value={formValues[field.id] || ''}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          className={`w-full px-3.5 py-2.5 bg-slate-950/70 border rounded-xl text-xs text-slate-100 focus:outline-none transition-all ${
                            hasError
                              ? 'border-rose-500/80 focus:border-rose-500'
                              : 'border-slate-800 focus:border-indigo-500'
                          }`}
                        />
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={formValues[field.id] || ''}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          className={`w-full px-3.5 py-2.5 bg-slate-950/70 border rounded-xl text-xs text-slate-100 focus:outline-none transition-all ${
                            hasError
                              ? 'border-rose-500/80 focus:border-rose-500'
                              : 'border-slate-800 focus:border-indigo-500'
                          }`}
                        />
                      )}

                      {field.helpText && (
                        <p className="text-[10px] text-slate-400 mt-1">{field.helpText}</p>
                      )}

                      {hasError && (
                        <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          {errors[field.id]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit Button & Security Notice */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Evaluating Logic & Routing...</span>
                    </>
                  ) : (
                    <>
                      <span>{form.submitButtonText || 'Submit Inquiry'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
                  <span>256-bit encrypted pipeline • Tenant isolated operations</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicWebFormPage;
