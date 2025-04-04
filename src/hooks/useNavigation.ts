import { useCallback } from 'react';

interface NavigationState {
  [key: string]: any;
}

export const useNavigation = () => {
  const saveState = useCallback((state: NavigationState) => {
    sessionStorage.setItem('navigationState', JSON.stringify(state));
  }, []);

  const getState = useCallback((path: string) => {
    const savedState = sessionStorage.getItem('navigationState');
    if (!savedState) return null;
    
    const state = JSON.parse(savedState);
    return state;
  }, []);

  const clearState = useCallback(() => {
    sessionStorage.removeItem('navigationState');
  }, []);

  return {
    saveState,
    getState,
    clearState,
  };
}; 