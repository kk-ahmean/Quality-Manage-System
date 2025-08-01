import { useContext } from 'react';
import { LanguageContext } from '../main';
import { getTranslation } from '../utils/i18n';

export const useTranslation = () => {
  const { locale } = useContext(LanguageContext);
  
  const t = (key: string): string => {
    return getTranslation(key, locale);
  };
  
  return { t, locale };
}; 