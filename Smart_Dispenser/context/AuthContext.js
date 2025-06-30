

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Storage = Platform.OS === 'web'
  ? {
      getItem: async (key) => localStorage.getItem(key),
      setItem: async (key, value) => localStorage.setItem(key, value),
      removeItem: async (key) => localStorage.removeItem(key),
    }
  : {
      getItem: AsyncStorage.getItem,
      setItem: AsyncStorage.setItem,
      removeItem: AsyncStorage.removeItem,
    };

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchAuthDetails = async () => {
      try {
        const storedAccessToken = await Storage.getItem('accessToken');
        const storedRefreshToken = await Storage.getItem('refreshToken');
        const storedUser = await Storage.getItem('user');

        if (storedAccessToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error fetching auth details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthDetails();
  }, []);

  const login = async (access, refresh, userData, redirectTo = null) => {
    try {
      await Storage.setItem('accessToken', access);
      await Storage.setItem('refreshToken', refresh);
      await Storage.setItem('user', JSON.stringify(userData));

      setAccessToken(access);
      setRefreshToken(refresh);
      setUser(userData);

      // Allow custom redirect, or redirect based on role if not specified
      const target = redirectTo || (userData?.role === "admin" ? "admindash" : "Home");
      router.replace(target);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      await Storage.removeItem('accessToken');
      await Storage.removeItem('refreshToken');
      await Storage.removeItem('user');

      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);

      router.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUserData = async (updatedUser, newTokens = null) => {
    try {
      await Storage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      if (newTokens) {
        if (newTokens.access) {
          await Storage.setItem('accessToken', newTokens.access);
          setAccessToken(newTokens.access);
        }
        if (newTokens.refresh) {
          await Storage.setItem('refreshToken', newTokens.refresh);
          setRefreshToken(newTokens.refresh);
        }
      }
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  // This function should be passed an actual refreshToken API function
  // e.g., refreshAccessToken = async (refreshTokenApiFunction) => { ... }
  // For now, assume you have a function called refreshTokenApi
  const refreshAccessToken = async (refreshTokenApi) => {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    try {
      const response = await refreshTokenApi(refreshToken);
      if (response.access) {
        await Storage.setItem('accessToken', response.access);
        setAccessToken(response.access);
        if (response.refresh) {
          await Storage.setItem('refreshToken', response.refresh);
          setRefreshToken(response.refresh);
        }
        return response.access;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      throw error;
    }
  };

  const getTokens = () => ({
    access: accessToken,
    refresh: refreshToken,
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        login,
        logout,
        loading,
        updateUserData,
        refreshAccessToken,
        getTokens,
      }}
    >
      {loading ? <LoadingComponent /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const LoadingComponent = () => <View />;
