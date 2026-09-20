import React from 'react';
import { X, Check } from 'lucide-react';
import { useBranding } from '../../context/BrandingContext';
import { SamLogoMinimalist, SamLogoEducational } from './SamLogo';

export const LogoSelectionModal: React.FC = () => {
  const { selectedLogo, setLogoOption, isSelectionModalOpen, closeLogoModal } = useBranding();

  if (!isSelectionModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logo-modal-title"
    >
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 id="logo-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
              Choose your SAM logo
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your preferred branding identity. You can change this anytime.
            </p>
          </div>
          <button
            onClick={closeLogoModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logo Choices */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* OPTION 1: Minimalist */}
          <div
            className={`flex flex-col justify-between p-5 rounded-xl border-2 transition-all cursor-pointer ${
              selectedLogo === 'option1'
                ? 'border-blue-600 bg-blue-50/30 shadow-sm ring-2 ring-blue-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
            onClick={() => setLogoOption('option1')}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md uppercase">
                  OPTION 1
                </span>
                {selectedLogo === 'option1' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
              </div>

              {/* Logo Preview */}
              <div className="h-28 flex items-center justify-center bg-slate-50 rounded-lg p-3">
                <SamLogoMinimalist size="xl" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Professional Minimalist
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Clean geometric monogram with document layers and checkmark accent. High contrast and razor-sharp.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLogoOption('option1');
                }}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedLogo === 'option1'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {selectedLogo === 'option1' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Selected Option 1
                  </>
                ) : (
                  'Select Option 1'
                )}
              </button>
            </div>
          </div>

          {/* OPTION 2: Educational */}
          <div
            className={`flex flex-col justify-between p-5 rounded-xl border-2 transition-all cursor-pointer ${
              selectedLogo === 'option2'
                ? 'border-blue-600 bg-blue-50/30 shadow-sm ring-2 ring-blue-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
            onClick={() => setLogoOption('option2')}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold tracking-wider text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md uppercase">
                  OPTION 2
                </span>
                {selectedLogo === 'option2' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
              </div>

              {/* Logo Preview */}
              <div className="h-28 flex items-center justify-center bg-slate-50 rounded-lg p-3">
                <SamLogoEducational size="xl" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Modern Educational
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Academic crest fusing textbook knowledge wings, mortarboard crown, and verified assignment check.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLogoOption('option2');
                }}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedLogo === 'option2'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {selectedLogo === 'option2' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Selected Option 2
                  </>
                ) : (
                  'Select Option 2'
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Preference is stored locally on this device.
          </p>
          <button
            type="button"
            onClick={closeLogoModal}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
