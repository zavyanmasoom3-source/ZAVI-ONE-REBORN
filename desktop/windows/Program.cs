using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace ZaviOneDesktop;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new ZaviDesktopWindow());
    }
}

internal sealed class ZaviDesktopWindow : Form
{
    private const string Hostname = "zavi.internal";
#if ZAVI_ADMIN
    private const string AppVariant = "admin";
    private const string AppName = "ZAVI ONE ADMIN";
#else
    private const string AppVariant = "one";
    private const string AppName = "ZAVI ONE";
#endif
    private readonly WebView2 browser = new() { Dock = DockStyle.Fill };
    private bool started;

    internal ZaviDesktopWindow()
    {
        Text = AppName;
        Size = new Size(1280, 850);
        MinimumSize = new Size(620, 520);
        StartPosition = FormStartPosition.CenterScreen;
        Controls.Add(browser);
    }

    protected override async void OnShown(EventArgs e)
    {
        base.OnShown(e);
        if (started) return;
        started = true;
        try
        {
            var webFolder = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "web"));
            var entry = Path.Combine(webFolder, "apps", AppVariant, "index.html");
            if (!File.Exists(entry))
                throw new FileNotFoundException(AppName + " packaged UI is missing.", entry);

            // Stable profile, independent of the installer directory, preserves
            // WebView2 localStorage / IndexedDB across in-place Windows updates.
            var profile = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                AppName, "WebView2");
            Directory.CreateDirectory(profile);
            var env = await CoreWebView2Environment.CreateAsync(null, profile);
            await browser.EnsureCoreWebView2Async(env);
            var core = browser.CoreWebView2;
            core.Settings.AreDevToolsEnabled = false;
            core.Settings.IsScriptEnabled = true;
            core.Settings.IsWebMessageEnabled = false;
            core.SetVirtualHostNameToFolderMapping(
                Hostname, webFolder, CoreWebView2HostResourceAccessKind.DenyCors);

            // Never load arbitrary URLs or file:// content in the privileged
            // accounting window. External HTTPS links open the normal browser.
            core.NavigationStarting += (_, args) =>
            {
                if (IsOwnOrigin(args.Uri)) return;
                args.Cancel = true;
                OpenExternalHttps(args.Uri);
            };
            core.NewWindowRequested += async (_, args) =>
            {
                // Receipts and print previews often use window.open('', '_blank')
                // and document.write(). Cancelling that popup broke printing.
                if (!IsOwnPopupUri(args.Uri))
                {
                    args.Handled = true;
                    OpenExternalHttps(args.Uri);
                    return;
                }
                var deferred = args.GetDeferral();
                Form? popup = null;
                try
                {
                    popup = new Form
                    {
                        Text = AppName + " — Receipt / Print",
                        Size = new Size(820, 840),
                        MinimumSize = new Size(430, 360),
                        StartPosition = FormStartPosition.CenterParent
                    };
                    var child = new WebView2 { Dock = DockStyle.Fill };
                    popup.Controls.Add(child);
                    popup.Show(this);
                    await child.EnsureCoreWebView2Async(env);
                    var popupCore = child.CoreWebView2;
                    popupCore.Settings.AreDevToolsEnabled = false;
                    popupCore.Settings.IsWebMessageEnabled = false;
                    popupCore.SetVirtualHostNameToFolderMapping(
                        Hostname, webFolder, CoreWebView2HostResourceAccessKind.DenyCors);
                    popupCore.NavigationStarting += (_, nav) =>
                    {
                        if (IsOwnPopupUri(nav.Uri)) return;
                        nav.Cancel = true;
                        OpenExternalHttps(nav.Uri);
                    };
                    popupCore.PermissionRequested += (_, perm) =>
                    {
                        if (!IsOwnOrigin(perm.Uri))
                            perm.State = CoreWebView2PermissionState.Deny;
                    };
                    popupCore.WindowCloseRequested += (_, _) => popup.Close();
                    args.NewWindow = popupCore;
                }
                catch (Exception)
                {
                    args.Handled = true;
                    popup?.Close();
                }
                finally
                {
                    deferred.Complete();
                }
            };
            core.PermissionRequested += (_, args) =>
            {
                // Leave camera/mic under the user's WebView2 permission prompt.
                // No blanket grants; no untrusted remote origin access.
                if (!IsOwnOrigin(args.Uri))
                    args.State = CoreWebView2PermissionState.Deny;
            };
            browser.Source = new Uri($"https://{Hostname}/apps/{AppVariant}/index.html");
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                AppName + " could not start. Install Microsoft Edge WebView2 " +
                "Evergreen Runtime if it is missing, then try again.\n\n" +
                ex.GetType().Name + ": " + ex.Message,
                AppName, MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private static bool IsOwnOrigin(string uri)
    {
        return Uri.TryCreate(uri, UriKind.Absolute, out var parsed) &&
            parsed.Scheme == Uri.UriSchemeHttps &&
            string.Equals(parsed.Host, Hostname, StringComparison.OrdinalIgnoreCase) &&
            parsed.IsDefaultPort;
    }

    private static bool IsOwnPopupUri(string uri)
    {
        return string.IsNullOrWhiteSpace(uri) ||
            uri.Equals("about:blank", StringComparison.OrdinalIgnoreCase) ||
            uri.StartsWith("blob:https://zavi.internal/", StringComparison.OrdinalIgnoreCase) ||
            IsOwnOrigin(uri);
    }

    private static void OpenExternalHttps(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var parsed) ||
            parsed.Scheme != Uri.UriSchemeHttps ||
            string.Equals(parsed.Host, Hostname, StringComparison.OrdinalIgnoreCase))
            return;
        try { Process.Start(new ProcessStartInfo(parsed.AbsoluteUri) { UseShellExecute = true }); }
        catch (Exception) { /* Browser unavailable: do not execute arbitrary paths. */ }
    }
}
