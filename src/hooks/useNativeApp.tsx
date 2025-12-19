import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';

export const useNativeApp = () => {
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    const initializeApp = async () => {
      try {
        // Hide splash screen after app is ready
        await SplashScreen.hide();

        // Set status bar style
        if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#1a1a2e' });
        } else {
          await StatusBar.setStyle({ style: Style.Dark });
        }
      } catch (error) {
        console.error('Error initializing native app:', error);
      }
    };

    initializeApp();

    // Handle back button on Android
    const backButtonListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });

    // Handle app state changes
    const appStateListener = CapApp.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active:', isActive);
    });

    // Handle keyboard show/hide on iOS
    let keyboardShowListener: any;
    let keyboardHideListener: any;
    
    if (Capacitor.getPlatform() === 'ios') {
      keyboardShowListener = Keyboard.addListener('keyboardWillShow', (info) => {
        console.log('Keyboard will show with height:', info.keyboardHeight);
      });

      keyboardHideListener = Keyboard.addListener('keyboardWillHide', () => {
        console.log('Keyboard will hide');
      });
    }

    return () => {
      backButtonListener.then(listener => listener.remove());
      appStateListener.then(listener => listener.remove());
      if (keyboardShowListener) {
        keyboardShowListener.then((listener: any) => listener.remove());
      }
      if (keyboardHideListener) {
        keyboardHideListener.then((listener: any) => listener.remove());
      }
    };
  }, [isNative]);

  const exitApp = async () => {
    if (isNative) {
      await CapApp.exitApp();
    }
  };

  const getAppInfo = async () => {
    if (!isNative) return null;
    return await CapApp.getInfo();
  };

  const hideKeyboard = async () => {
    if (isNative) {
      await Keyboard.hide();
    }
  };

  return {
    isNative,
    exitApp,
    getAppInfo,
    hideKeyboard,
  };
};
