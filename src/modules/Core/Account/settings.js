// Account/settings.js
import {subcategories} from './subcategories.js'

// Default Core Settings
export const CORE_DEFAULTS = {
  otpMode: false,
  pinMode: false
}

// Default Account Settings
export const SYNCED_ACCOUNT_DEFAULTS = {
  autoLogoutTimeInSeconds: 3600,
  defaultFiat: 'USD',
  merchantMode: false,
  'BTC': {
    denomination: '100000000'
  },
  'ETH': {
    denomination: '1000000000000000000'
  },
  'REP': {
    denomination: '1000000000000000000'
  },
  'WINGS': {
    denomination: '1000000000000000000'
  }
}

export const SYNCED_SUBCATEGORIES_DEFAULTS = {
  subcategories: subcategories
}

export const LOCAL_ACCOUNT_DEFAULTS = {
  bluetoothMode: false
}

//  Settings
// Core Settings
export const setOtpModeRequest = (account, otpMode) => {
  if (otpMode === true) {
    return account.enableOTP()
  } else if (otpMode === false) {
    return account.disableOTP()
  } else {
    throw Error('Invalid OTP Mode')
  }
}

export const setOTPRequest = (account, key) => {
  return account.setupOTPKey(key)
}

export const setPinModeRequest = (account, pinMode) => {
  if (pinMode === true) {
    return account.enablePIN()
  } else if (pinMode === false) {
    return account.disablePIN()
  } else {
    throw Error('Invalid PIN Mode')
  }
}

export const setPinRequest = (account, pin) => {
  return account.changePIN(pin)
}

// Account Settings
export const setAutoLogoutTimeRequest = (account, autoLogoutTimeInSeconds) => {
  return getSyncedSettings(account)
  .then(settings => {
    const updatedSettings = updateSettings(settings, { autoLogoutTimeInSeconds })
    return setSyncedSettings(account, updatedSettings)
  })
}

export const setDefaultFiatRequest = (account, defaultFiat) => {
  return getSyncedSettings(account)
  .then(settings => {
    const updatedSettings = updateSettings(settings, { defaultFiat })
    return setSyncedSettings(account, updatedSettings)
  })
}

export const setMerchantModeRequest = (account, merchantMode) => {
  return getSyncedSettings(account)
  .then(settings => {
    const updatedSettings = updateSettings(settings, { merchantMode })
    return setSyncedSettings(account, updatedSettings)
  })
}

// Local Settings
export const setBluetoothModeRequest = (account, bluetoothMode) => {
  return getLocalSettings(account)
  .then(settings => {
    const updatedSettings = updateSettings(settings, { bluetoothMode })
    return setLocalSettings(account, updatedSettings)
  })
}

export const setSubcategoriesRequest = (account) => {
  return getSyncedSubcategories(account)
  .then(subcategories => {
    return setSyncedSubcategories(account, subcategories)
  })
}

// Currency Settings
// Bitcoin
export const setDenominationKeyRequest = (account, currencyCode, denomination) => {
  return getSyncedSettings(account)
  .then(settings => {
    const updatedSettings = updateCurrencySettings(settings, currencyCode, { denomination })
    return setSyncedSettings(account, updatedSettings)
  })
}

// Helper Functions
export const getSyncedSettings = (account) => {
  return getSyncedSettingsFile(account).getText()
  .then(text => {
    return JSON.parse(text)
  })
  .catch(e => {
    console.log(e)
    // If Settings.json doesn't exist yet, create it, and return it
    return setSyncedSettings(account, SYNCED_ACCOUNT_DEFAULTS)
    .then(() => {
      return SYNCED_ACCOUNT_DEFAULTS
    })
  })
}

export const setSyncedSettings = (account, settings) => {
  const text = JSON.stringify(settings)
  const SettingsFile = getSyncedSettingsFile(account)

  return SettingsFile.setText(text)
}

export const getSyncedSubcategories = account => {
  return getSyncedSubcategoriesFile(account).getText()
  .then(text => {
    return JSON.parse(text)
  })
  .catch(e => {
    console.log(e)
    // If Settings.json doesn't exist yet, create it, and return it
    return setSyncedSubcategories(account, SYNCED_SUBCATEGORIES_DEFAULTS)
    .then(() => {
      return SYNCED_SUBCATEGORIES_DEFAULTS
    })
  })
}

export const setSyncedSubcategories = (account, subcategories) => {
  const text = JSON.stringify(subcategories)
  const SubcategoriesFile = getSyncedSettingsFile(account)

  return SubcategoriesFile.setText(text)
}

export const getLocalSettings = account => {
  return getLocalSettingsFile(account).getText()
  .then(text => {
    return JSON.parse(text)
  })
  .catch(e => {
    console.log(e)
    // If Settings.json doesn't exist yet, create it, and return it
    return setLocalSettings(account, LOCAL_ACCOUNT_DEFAULTS)
    .then(() => {
      return LOCAL_ACCOUNT_DEFAULTS
    })
  })
}

export const setLocalSettings = (account, settings) => {
  const text = JSON.stringify(settings)
  const localSettingsFile = getLocalSettingsFile(account)

  return localSettingsFile.setText(text)
}

export const getCoreSettings = () => {
  const coreSettings = CORE_DEFAULTS
  // TODO: Get each setting separately,
  // build up settings object,
  // return settings object
  return Promise.resolve(coreSettings)
}

export const getSyncedSettingsFile = account => {
  return account.folder.file('Settings.json')
}

export const getSyncedSubcategoriesFile = account => {
  return account.folder.file('subcategories.js')
}

export const getLocalSettingsFile = account => {
  return account.localFolder.file('Settings.json')
}

export const updateCurrencySettings = (currentSettings, currencyCode, newSettings) => {
  const currencySettings = currentSettings[currencyCode]
  // update with new settings
  const updatedSettings = {
    ...currentSettings,
    [currencyCode]: {
      ...currencySettings,
      ...newSettings
    }
  }
  return updatedSettings
}

export const updateSettings = (currentSettings, newSettings) => {
  // update with new settings
  const updatedSettings = {
    ...currentSettings,
    ...newSettings
  }
  return updatedSettings
}
