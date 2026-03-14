module.exports = {
  packagerConfig: {
    name: 'Tax Depot',
    executableName: 'tax-depot',
    asar: true,
    appBundleId: 'com.taxdepot.app',
    appCategoryType: 'public.app-category.finance'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'TaxDepot',
        setupExe: 'TaxDepotSetup.exe'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux', 'win32']
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    }
  ]
};