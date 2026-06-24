// Detectar modo demo
export const isDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('demo') === 'fjmillan39' || 
         sessionStorage.getItem('demo_mode') === 'true';
};

export const getDemoTenant = (): string => {
  return '7e045520-5e36-4e3f-a39f-10ea7d6dce76';
};

export const getApiUrl = (baseUrl: string): string => {
  if (isDemoMode()) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}demo=true`;
  }
  return baseUrl;
};
