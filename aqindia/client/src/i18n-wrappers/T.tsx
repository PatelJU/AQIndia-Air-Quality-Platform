import React from 'react';
import { useTranslation } from '../i18n/provider';

interface TProps {
  text: string;
  i18nKey: string;
  className?: string;
  style?: React.CSSProperties;
}

export const T: React.FC<TProps> = ({ text, i18nKey, className, style }) => {
  const { t } = useTranslation();
  const translated = t(i18nKey, text);
  
  return (
    <span className={className} style={style}>
      {translated}
    </span>
  );
};
