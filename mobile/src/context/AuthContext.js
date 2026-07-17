import { createContext, useContext, useState, useEffect } from 'react';
import { saveToken, getToken, clearToken } from '../utils/authStorage';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // true while we check for a saved token on app start

  // On app launch, check if a token was already saved from a previous session -
  // this is what lets the app skip straight to the Feed instead of always showing Login.
  useEffect(() => {
    (async () => {
      const savedToken = await getToken();
      if (savedToken) {
        setToken(savedToken);
        await refreshWallet();
      }
      setIsLoading(false);
    })();
  }, []);

  async function login(newToken, balance) {
    await saveToken(newToken);
    setToken(newToken);
    setWalletBalance(balance);
  }

  async function logout() {
    await clearToken();
    setToken(null);
  }

  async function refreshWallet() {
    const res = await client.get('/wallet');
    setWalletBalance(res.data.walletBalance);
  }

  return (
    <AuthContext.Provider value={{ token, walletBalance, isLoading, login, logout, refreshWallet }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext); // lets any screen just call useAuth() instead of importing AuthContext directly
}
