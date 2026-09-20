import React, { createContext, useContext, useEffect } from 'react';
import { getLogoSvgString } from '../components/brand/SamLogo';

interface BrandingContextType {
  openLogoModal: () => void;
  closeLogoModal: () => void;
  isSelectionModalOpen: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
  openLogoModal: () => {},
  closeLogoModal: () => {},
  isSelectionModalOpen: false,
});

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ensure the official best modern SAM favicon is active
  useEffect(() => {
    try {
      const svg = getLogoSvgString();
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
      console.warn('Could not set official favicon:', err);
    }
  }, []);

  return (
    <BrandingContext.Provider
      value={{
        openLogoModal: () => {},
        closeLogoModal: () => {},
        isSelectionModalOpen: false,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  return useContext(BrandingContext);
};
