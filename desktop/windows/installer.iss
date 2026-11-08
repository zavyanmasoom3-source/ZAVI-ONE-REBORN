#define DesktopVersion GetEnv("ZAVI_DESKTOP_LABEL")
#define DesktopNumber GetEnv("ZAVI_DESKTOP_NUMBER")
#define DesktopApp GetEnv("ZAVI_DESKTOP_APP")
#if DesktopVersion == ""
  #error "ZAVI_DESKTOP_LABEL must be set by the controlled build"
#endif
#if DesktopNumber == ""
  #error "ZAVI_DESKTOP_NUMBER must be set by the controlled build"
#endif
#if DesktopApp == "one"
  #define DesktopAppId "{{2C94A3BD-C81E-4BA1-AC8B-90CE42811B0B}"
  #define DesktopAppName "ZAVI ONE"
  #define DesktopExe "ZAVI_ONE.exe"
  #define DesktopOutput "ZAVI_ONE_REBORN_Windows_QA_"
#elif DesktopApp == "admin"
  #define DesktopAppId "{{3A925D41-7F1C-41FA-B4AD-0823297856F1}"
  #define DesktopAppName "ZAVI ONE ADMIN"
  #define DesktopExe "ZAVI_ONE_ADMIN.exe"
  #define DesktopOutput "ZAVI_ONE_ADMIN_REBORN_Windows_QA_"
#else
  #error "ZAVI_DESKTOP_APP must be one or admin"
#endif

[Setup]
AppId={#DesktopAppId}
AppName={#DesktopAppName}
AppVersion={#DesktopVersion}
AppVerName={#DesktopAppName} REBORN QA {#DesktopVersion}
AppPublisher=ZAVI ONE
DefaultDirName={localappdata}\Programs\{#DesktopAppName}
DefaultGroupName={#DesktopAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=output
OutputBaseFilename={#DesktopOutput}{#DesktopNumber}
Compression=lzma2
SolidCompression=yes
SetupIconFile=zavi.ico
UninstallDisplayIcon={app}\{#DesktopExe}
WizardStyle=modern
ChangesAssociations=no
CloseApplications=yes
RestartApplications=no

[Files]
Source: "publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#DesktopAppName}"; Filename: "{app}\{#DesktopExe}"
Name: "{autodesktop}\{#DesktopAppName}"; Filename: "{app}\{#DesktopExe}"; Tasks: desktopicon

[Tasks]
Name: desktopicon; Description: "Create a desktop shortcut"; GroupDescription: "Shortcuts:"; Flags: unchecked

[Run]
Filename: "{app}\{#DesktopExe}"; Description: "Open {#DesktopAppName}"; Flags: nowait postinstall skipifsilent
