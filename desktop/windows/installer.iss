#define DesktopVersion GetEnv("ZAVI_DESKTOP_LABEL")
#define DesktopNumber GetEnv("ZAVI_DESKTOP_NUMBER")
#if DesktopVersion == ""
  #error "ZAVI_DESKTOP_LABEL must be set by the controlled QA build"
#endif
#if DesktopNumber == ""
  #error "ZAVI_DESKTOP_NUMBER must be set by the controlled QA build"
#endif

[Setup]
AppId={{2C94A3BD-C81E-4BA1-AC8B-90CE42811B0B}
AppName=ZAVI ONE
AppVersion={#DesktopVersion}
AppVerName=ZAVI ONE REBORN QA {#DesktopVersion}
AppPublisher=ZAVI ONE
DefaultDirName={localappdata}\Programs\ZAVI ONE
DefaultGroupName=ZAVI ONE
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=output
OutputBaseFilename=ZAVI_ONE_REBORN_Windows_QA_{#DesktopNumber}
Compression=lzma2
SolidCompression=yes
SetupIconFile=zavi.ico
UninstallDisplayIcon={app}\ZAVI_ONE.exe
WizardStyle=modern
ChangesAssociations=no
CloseApplications=yes
RestartApplications=no

[Files]
Source: "publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\ZAVI ONE"; Filename: "{app}\ZAVI_ONE.exe"
Name: "{autodesktop}\ZAVI ONE"; Filename: "{app}\ZAVI_ONE.exe"; Tasks: desktopicon

[Tasks]
Name: desktopicon; Description: "Create a desktop shortcut"; GroupDescription: "Shortcuts:"; Flags: unchecked

[Run]
Filename: "{app}\ZAVI_ONE.exe"; Description: "Open ZAVI ONE"; Flags: nowait postinstall skipifsilent
