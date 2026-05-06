import * as CryptoJS from 'crypto-js';

export const globalConstants = {
  // Local Storage Keys
  storageKeys: {
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
    userData: 'user_data',
    userPermissions: 'user_permissions',
    userMenu: 'user_menu',
    availableBranches: 'sme_available_branches',
  },

  // Security / Encryption
  encryption: {
    secretKey: 'aidly_erp_secret_key_2026',
  },

  // Common UI Settings
  pagination: {
    defaultPageSize: 10,
    defaultPage: 1,
  },

  /**
   * Modern way to access current user data directly from constants
   * Usage: globalConstants.user.companyNo
   */
  get user() {
    const userData = localStorage.getItem(this.storageKeys.userData);
    if (!userData) {
      return {
        userName: '',
        userNo: '',
        companyNo: '',
        companyName: '',
      };
    }

    try {
      // Commented out encryption for now
      /*
      const bytes = CryptoJS.AES.decrypt(userData, this.encryption.secretKey);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      const data = JSON.parse(decryptedStr);
      */

      // Using plain JSON parse for now
      const data = JSON.parse(userData);

      return {
        userName: data.user_name || data.userName || '',
        userNo: data.user_no || data.userNo || '',
        companyNo: data.company_no || data.companyNo || '',
        companyName: data.company_name || data.companyName || '',
      };
    } catch (e) {
      return {
        userName: '',
        userNo: '',
        companyNo: '',
        companyName: '',
      };
    }
  },

  // API settings or other hardcoded values can be added here
};
