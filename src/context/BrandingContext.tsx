import React, { createContext, useContext, useState, useEffect } from 'react';
import { LogoOption, getLogoSvgString } from '../components/brand/SamLogo';

const LOGO_STORAGE_KEY = 'sam_selected_logo';
const LOGO_CHOSEN_FLAG_KEY = 'sam_logo_chosen';

interface BrandingContextType {
  selectedLogo: LogoOption;
  setLogoOption: (option: LogoOption) => void;
  isSelectionModalOpen: boolean;
  openLogoModal: () => void;
  closeLogoModal: () => void;
  hasChosenLogo: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedLogo, setSelectedLogoState] = useState<LogoOption>(() => {
    try {
      const saved = localStorage.getItem(LOGO_STORAGE_KEY);
      if (saved === 'option1' || saved === 'option2') return saved;
    } catch (_) {}
    return 'option1';
  });

  const [hasChosenLogo, setHasChosenLogo] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOGO_CHOSEN_FLAG_KEY) === 'true';
    } catch (_) {
      return false;
    }
  });

  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

  // Update dynamic favicon when selected logo changes
  useEffect(() => {
    try {
      const svg = getLogoSvgString(selectedLogo);
      const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.type = 'image/svg+xml';
      link.href = encoded;
    } catch (err) {
      console.warn('Could not update dynamic favicon:', err);
    }
  }, [selectedLogo]);

  const setLogoOption = (option: LogoOption) => {
    setSelectedLogoState(option);
    setHasChosenLogo(true);
    try {
      localStorage.setItem(LOGO_STORAGE_KEY, option);
      localStorage.setItem(LOGO_CHOSEN_FLAG_KEY, 'true');
    } catch (_) {}
  };

  const openLogoModal = () => setIsSelectionModalOpen(true);
  const closeLogoModal = () => setIsSelectionModalOpen(false);

  return (
    <BrandingContext.Provider
      value={{
        selectedLogo,
        setLogoOption,
        isSelectionModalOpen,
        openLogoModal,
        closeLogoModal,
        hasChosenLogo,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
