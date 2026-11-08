# ZAVI ONE Desktop QA — Windows 10/11 x64

The same approved HTML/CSS/JavaScript from apps/one is used unchanged in
Microsoft Edge WebView2. UI is not a mock. Microsoft.Web.WebView2 is pinned
to NuGet package 1.0.4314.35.

**Not release certified:** unsigned Windows QA Installer, not a substitute for
Android APKs; customer Cloud entitlement, barcode camera, printing, RTL themes,
storage persistence and backup/restore must be tested on actual Windows machines.

Architecture:
- Windows Forms .NET 8, self-contained win-x64.
- Local app files mapped to https://zavi.internal/ with WebView2 virtual
  hosting, so the app does not use arbitrary file:/// origin.
- User profile at %LOCALAPPDATA%\ZAVI ONE\WebView2. This directory is OUTSIDE
  the installer path and is not deleted by normal application upgrades.
- Navigate only to the local virtual origin, open external HTTPS links in the
  system default browser, deny untrusted origins and do not enable Node/host
  filesystem bridges.
- WebView2 Evergreen Runtime is required on the customer's computer; current
  Windows 11 includes it. Runtime installation should be validated separately.

Build locally on Windows:
1. Install .NET 8 SDK, Microsoft WebView2 Runtime, Inno Setup 6 and Python 3.
2. Copy apps/one to desktop/windows/web/apps/one and packages/shared to
   desktop/windows/web/packages/shared.
3. Generate desktop/windows/zavi.ico from apps/one/icon-192.png.
4. Run dotnet publish desktop/windows/ZaviOneDesktop.csproj -c Release
   -r win-x64 --self-contained true -o desktop/windows/publish
5. Set ZAVI_DESKTOP_LABEL and ZAVI_DESKTOP_NUMBER, then run
   ISCC.exe desktop/windows/installer.iss.

The GitHub Windows workflow automates these steps and prints SHA-256 of the
actual Installer. A signed production Installer requires a separate Windows
code-signing certificate and device/installer update validation.
