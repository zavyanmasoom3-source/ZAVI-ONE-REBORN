package com.zavione.mobile;

import android.app.Activity;
import android.content.SharedPreferences;
import androidx.fragment.app.FragmentActivity;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import android.app.AlertDialog;
import android.Manifest;
import android.content.ClipData;
import android.content.res.Configuration;
import android.content.pm.PackageManager;
import android.provider.MediaStore;
import android.webkit.PermissionRequest;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.IOException;
import android.app.DownloadManager;
import android.print.PrintManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import org.json.JSONObject;

import java.io.OutputStream;
import java.util.Collections;
import java.util.Locale;

public final class MainActivity extends FragmentActivity {
    private static final String BASE = "https://appassets.androidplatform.net/";
    private static final int PICK_UPLOAD = 4701;
    private static final int CAMERA_PERMISSION = 4703;
    private static final int SAVE_DOCUMENT = 4702;
    private static final int MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024;
    private static final String BRIDGE_SCRIPT = "(function(){"
        + "if(window.__zaviNativeReady)return;window.__zaviNativeReady=true;"
        + "document.addEventListener('click',async function(e){"
        + "let a=e.target&&e.target.closest?e.target.closest('a[download]'):null;"
        + "if(!a||!a.href||!a.href.startsWith('blob:')||!window.ZaviAndroidDownloads)return;"
        + "e.preventDefault();e.stopImmediatePropagation();"
        + "try{let r=await fetch(a.href),b=await r.blob(),reader=new FileReader();"
        + "reader.onload=function(){ZaviAndroidDownloads.postMessage(JSON.stringify({name:a.download||'ZAVI_ONE_document',mime:b.type||'application/octet-stream',data:reader.result}));};"
        + "reader.readAsDataURL(b);}catch(err){console.error('Save failed',err);}"
        + "},true);"
        + "window.print=function(){if(window.ZaviAndroidPrint)ZaviAndroidPrint.postMessage('print');};"
        + "})();";
    private FrameLayout container;
    // Prevent a bad internal navigation from trapping the user on a blank WebView.
    private int localNavigationRecoveryAttempts = 0;
    // Android WebView renderer can be killed separately from the app, e.g. low RAM.
    // Do not pretend a dead renderer displayed the app or silently discard drafts.
    private int rendererRecoveryCount = 0;
    private WebView webView;
    private WebViewAssetLoader assetLoader;
    private ValueCallback<Uri[]> fileCallback;
    private Uri pendingPhotoUri;
    private File pendingPhotoFile;
    private PermissionRequest pendingCamera;
    private byte[] pendingSave;
    private String pendingMime;
    private long lastBackPress;
    private String biometricMode;
    private String biometricPinSignature;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(7,26,51));
        getWindow().setNavigationBarColor(Color.rgb(7,26,51));
        container = new FrameLayout(this);
        container.setBackgroundColor(Color.rgb(7,26,51));
        setContentView(container);
        if (Build.VERSION.SDK_INT >= 30) {
            container.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        } else {
            container.setFitsSystemWindows(true);
        }
        assetLoader = new WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_BASIC_USAGE)) {
            androidx.webkit.ServiceWorkerControllerCompat.getInstance().setServiceWorkerClient(
                new androidx.webkit.ServiceWorkerClientCompat() {
                    @Override public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                        return assetLoader.shouldInterceptRequest(request.getUrl());
                    }
                }
            );
        }
        initializeWebView();
        // Clear only HTTP resource cache on APK version changes. Do not clear
        // cookies, localStorage, IndexedDB, WebStorage, or accounting drafts.
        SharedPreferences versionPrefs = getSharedPreferences("zavi_apk_shell_version", MODE_PRIVATE);
        long installedVersion = -1;
        try {
            installedVersion = getPackageManager().getPackageInfo(getPackageName(), 0).getLongVersionCode();
        } catch (Exception ignored) {}
        if (installedVersion > 0 && versionPrefs.getLong("last_loaded_version", -1) != installedVersion) {
            webView.clearCache(true);
            versionPrefs.edit().putLong("last_loaded_version", installedVersion).apply();
            android.util.Log.i("ZAVI_WEBVIEW", "Resource cache refreshed for APK version " + installedVersion);
        }
        webView.loadUrl(BASE + "index.html");
    }

    private void initializeWebView() {
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(7,26,51));
        container.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(100);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setUserAgentString(settings.getUserAgentString() + " ZAVI-ONE-Android");
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView w, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                discardPendingPhoto();
                fileCallback=callback;
                boolean isImage=false;
                for(String mime:params.getAcceptTypes()) if(mime!=null&&mime.toLowerCase(java.util.Locale.ROOT).startsWith("image/"))isImage=true;
                Intent pick;
                try { pick=params.createIntent(); }
                catch(Exception e) {pick=new Intent(Intent.ACTION_GET_CONTENT).setType(isImage?"image/*":"*/*");}
                pick.addCategory(Intent.CATEGORY_OPENABLE);
                try {
                    if(!isImage){startActivityForResult(pick,PICK_UPLOAD);return true;}
                    Intent camera=new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    if(camera.resolveActivity(getPackageManager()) != null){
                        File directory=new File(getCacheDir(),"camera");
                        if(!directory.isDirectory()&&!directory.mkdirs())throw new IOException("Camera directory");
                        pendingPhotoFile=File.createTempFile("zavi_barcode_",".jpg",directory);
                        pendingPhotoUri=FileProvider.getUriForFile(MainActivity.this,getPackageName()+".camera",pendingPhotoFile);
                        camera.putExtra(MediaStore.EXTRA_OUTPUT,pendingPhotoUri);
                        camera.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                        camera.setClipData(ClipData.newRawUri("ZAVI barcode photo",pendingPhotoUri));
                        if(params.isCaptureEnabled()){startActivityForResult(camera,PICK_UPLOAD);}
                        else{
                            Intent chooser=Intent.createChooser(pick,"Camera or gallery");
                            chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS,new Intent[]{camera});
                            startActivityForResult(chooser,PICK_UPLOAD);
                        }
                    }else startActivityForResult(pick,PICK_UPLOAD);
                    return true;
                } catch(Exception error) {
                    discardPendingPhoto();
                    fileCallback=null;callback.onReceiveValue(null);
                    toast("Camera or photo picker unavailable");
                    return true;
                }
            }
            @Override public void onPermissionRequest(PermissionRequest request) {
                String origin=request.getOrigin()==null?"":request.getOrigin().toString().replaceAll("/+$","");
                if(!"https://appassets.androidplatform.net".equals(origin)
                   || request.getResources().length!=1
                   || !PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(request.getResources()[0])){
                    request.deny();return;
                }
                runOnUiThread(()->{
                    if(checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED)request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                    else{
                        if(pendingCamera!=null)pendingCamera.deny();
                        pendingCamera=request;
                        requestPermissions(new String[]{Manifest.permission.CAMERA},CAMERA_PERMISSION);
                    }
                });
            }
            @Override public void onPermissionRequestCanceled(PermissionRequest request) {
                if(pendingCamera==request)pendingCamera=null;
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean onRenderProcessGone(WebView dead, android.webkit.RenderProcessGoneDetail detail) {
                // On API 26+ an unhandled renderer death kills the host application.
                // Only stored data remains; pending unsaved form text cannot be restored.
                if (dead != webView) return false;
                android.util.Log.e("ZAVI_WEBVIEW", "WebView renderer terminated; app data remains untouched");
                if (fileCallback != null) { fileCallback.onReceiveValue(null); fileCallback = null; }
                if (pendingCamera != null) { pendingCamera.deny(); pendingCamera = null; }
                discardPendingPhoto();
                container.removeView(dead);
                dead.destroy();
                webView = null;
                runOnUiThread(() -> {
                    final boolean canRecover = rendererRecoveryCount++ < 1;
                    new AlertDialog.Builder(MainActivity.this)
                        .setTitle("ZAVI ONE — بازکردن دوباره")
                        .setMessage("نمایش برنامه در Android متوقف شد. معلومات ذخیره‌شده پاک نشده‌اند؛ نوشته‌های ذخیره‌نشده ممکن است از دست رفته باشند. "
                            + (canRecover ? "برای بازکردن دوباره صفحه آفلاین تأیید کنید." : "برنامه را ببندید و حافظه دستگاه را بررسی کنید."))
                        .setCancelable(false)
                        .setPositiveButton(canRecover ? "بازکردن دوباره" : "بستن", (dialog, which) -> {
                            if (!canRecover) { finish(); return; }
                            localNavigationRecoveryAttempts = 0;
                            initializeWebView();
                            webView.loadUrl(BASE + "index.html?zavi_renderer_recovery=1");
                        })
                        .setNegativeButton("خروج امن", (dialog, which) -> finish())
                        .show();
                });
                return true;
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView w, WebResourceRequest req) {
                return assetLoader.shouldInterceptRequest(req.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView w, WebResourceRequest req) {
                if (!req.isForMainFrame()) return false;
                Uri url = req.getUrl();
                if (isLocal(url)) return false;
                openExternal(url);
                return true;
            }
            @Override public void onPageFinished(WebView w, String url) {
                if (url.startsWith(BASE)) {
                    w.evaluateJavascript(BRIDGE_SCRIPT, null);
                    if ((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) android.util.Log.i("ZAVI_QA_WEBVIEW", "Embedded app shell loaded");
                }
            }
            @Override public void onReceivedError(WebView w, WebResourceRequest req, android.webkit.WebResourceError err) {
                if (!req.isForMainFrame()) return;
                final boolean embeddedPage = isLocal(req.getUrl());
                if (embeddedPage && localNavigationRecoveryAttempts < 1) {
                    localNavigationRecoveryAttempts++;
                    // This is an embedded asset. It does NOT need internet or a remote server.
                    runOnUiThread(() -> {
                        w.stopLoading();
                        w.loadUrl(BASE + "index.html?zavi_local_recovery=1");
                    });
                    return;
                }
                final String message = embeddedPage
                    ? "صفحه داخلی برنامه باز نشد. برای برگشت، صفحه اصلی آفلاین را دوباره باز کنید."
                    : "صفحه آنلاین باز نشد. اتصال اینترنت خود را بررسی کنید.";
                runOnUiThread(() -> new AlertDialog.Builder(MainActivity.this)
                  .setTitle("ZAVI ONE")
                  .setMessage(message)
                  .setPositiveButton("بازکردن صفحه اصلی", (d, which) -> {
                      localNavigationRecoveryAttempts = 0;
                      w.stopLoading();
                      w.loadUrl(BASE + "index.html?zavi_manual_recovery=1");
                  })
                  .setNegativeButton("بستن", (d, which) -> d.dismiss())
                  .show());
            }
        });
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(webView, "ZaviAndroidDownloads",
                Collections.singleton("https://appassets.androidplatform.net"),
                (view, message, origin, isMainFrame, reply) -> {
                    if (!isMainFrame || !origin.toString().equals("https://appassets.androidplatform.net")) return;
                    String msg = message.getData();
                    if (msg != null) receiveDownload(msg);
                });
            WebViewCompat.addWebMessageListener(webView, "ZaviAndroidPrint",
                Collections.singleton("https://appassets.androidplatform.net"),
                (view, message, origin, isMainFrame, reply) -> {
                    if (!isMainFrame || !origin.toString().equals("https://appassets.androidplatform.net")) return;
                    runOnUiThread(this::printPage);
                });
            WebViewCompat.addWebMessageListener(webView, "ZaviAndroidBiometric",
                Collections.singleton("https://appassets.androidplatform.net"),
                (view, message, origin, isMainFrame, reply) -> {
                    if (!isMainFrame || !origin.toString().equals("https://appassets.androidplatform.net")) return;
                    final String data=message.getData();
                    if (data!=null && data.length()<8192) runOnUiThread(()->handleBiometricMessage(data));
                });
        }
        webView.setDownloadListener((url,userAgent,disposition,mime,size) -> {
            if (url == null) return;
            if (url.startsWith("blob:") && WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
                String script = "(async function(){try{let r=await fetch(" + JSONObject.quote(url) + ");let b=await r.blob();let fr=new FileReader();fr.onload=function(){ZaviAndroidDownloads.postMessage(JSON.stringify({name:'ZAVI_ONE_download',mime:b.type||'application/octet-stream',data:fr.result}));};fr.readAsDataURL(b);}catch(e){console.error(e);}})()";
                webView.evaluateJavascript(script,null);
            } else if (url.startsWith("https://")) {
                try {
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    request.setTitle("ZAVI ONE download");
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalFilesDir(MainActivity.this,Environment.DIRECTORY_DOWNLOADS,"zavi-download-"+System.currentTimeMillis());
                    DownloadManager dm=(DownloadManager)getSystemService(DOWNLOAD_SERVICE);
                    if (dm != null) dm.enqueue(request);
                    toast("Downloading...");
                } catch(Exception ex) { toast("Download unavailable"); }
            }
        });
    }

    private static boolean isLocal(Uri uri) {
        return "https".equals(uri.getScheme()) &&
            "appassets.androidplatform.net".equals(uri.getHost());
    }

    private void openExternal(Uri uri) {
        try {
            String scheme=uri.getScheme();
            if (scheme==null || !(scheme.equals("https")||scheme.equals("http")||scheme.equals("mailto")||scheme.equals("tel")||scheme.equals("whatsapp")))return;
            Intent i = new Intent(Intent.ACTION_VIEW,uri);
            startActivity(i);
        } catch(Exception ex) { toast("Cannot open link / لینک باز نشد"); }
    }

    private void receiveDownload(String input) {
        try {
            JSONObject item = new JSONObject(input);
            String data=item.getString("data");
            int comma=data.indexOf(',');
            if (!data.startsWith("data:") || comma<0 || !data.substring(0,comma).endsWith(";base64"))return;
            if (data.length()>MAX_DOWNLOAD_BYTES*2) {toast("File too large");return;}
            byte[] binary=android.util.Base64.decode(data.substring(comma+1),android.util.Base64.DEFAULT);
            if(binary.length > MAX_DOWNLOAD_BYTES)return;
            String name=item.optString("name","ZAVI_ONE_document");
            name=name.replaceAll("[^\\p{L}\\p{N}._ -]","_");
            if (name.isEmpty()) name="ZAVI_ONE_document";
            if (name.length()>100) name=name.substring(0,100);
            String mime=item.optString("mime","application/octet-stream");
            if(mime.length()>80 || !mime.matches("[A-Za-z0-9.\\-+]+/[A-Za-z0-9.\\-+]+"))mime="application/octet-stream";
            final String finalName=name, finalMime=mime;
            runOnUiThread(()->{
                if(pendingSave!=null){toast("Please save the current file first");return;}
                pendingSave=binary; pendingMime=finalMime;
                Intent save=new Intent(Intent.ACTION_CREATE_DOCUMENT);
                save.addCategory(Intent.CATEGORY_OPENABLE);
                save.setType(finalMime);
                save.putExtra(Intent.EXTRA_TITLE,finalName);
                try{startActivityForResult(save,SAVE_DOCUMENT);}
                catch(Exception ex){pendingSave=null;toast("Unable to save file");}
            });
        } catch (Exception ignored) {toast("Unable to prepare download");}
    }


    // Fingerprint authentication is performed by Android, never by JavaScript.
    // The PIN hash signature binds enrollment to the PIN configured in the local store.
    private SharedPreferences biometricPreferences() {
        return getSharedPreferences("zavi_biometric_v6546", MODE_PRIVATE);
    }
    private boolean biometricReady() {
        try {
            return BiometricManager.from(this).canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_STRONG
            )==BiometricManager.BIOMETRIC_SUCCESS;
        } catch (Exception e) {return false;}
    }
    private boolean biometricEnabled(String signature) {
        return signature!=null && signature.length()>=20 &&
            biometricPreferences().getBoolean("enabled",false) &&
            signature.equals(biometricPreferences().getString("pin_signature",""));
    }
    private void sendBiometricEvent(String op,boolean success,String sig) {
        if(webView==null)return;
        try {
            JSONObject payload=new JSONObject();
            payload.put("op",op);
            payload.put("success",success);
            payload.put("available",biometricReady());
            payload.put("enabled",biometricEnabled(sig));
            String js="window.dispatchEvent(new CustomEvent('zavi:native-biometric',{detail:"+
                JSONObject.quote(payload.toString())+"}));";
            webView.evaluateJavascript(js,null);
        } catch(Exception ignored){}
    }
    private void handleBiometricMessage(String input) {
        String op;
        String sig;
        try {
            JSONObject request=new JSONObject(input);
            op=request.optString("op","");
            sig=request.optString("pinSig","");
        } catch(Exception e){return;}
        if("status".equals(op)){sendBiometricEvent("status",true,sig);return;}
        if("disable".equals(op)){
            biometricPreferences().edit().remove("enabled").remove("pin_signature").apply();
            sendBiometricEvent("disabled",true,sig);return;
        }
        if(!"enable".equals(op)&&!"authenticate".equals(op))return;
        if(sig.length()<20 || !biometricReady() || biometricMode!=null) {
            sendBiometricEvent("authenticate".equals(op)?"authenticated":"enabled",false,sig);
            return;
        }
        if("authenticate".equals(op)&&!biometricEnabled(sig)){
            sendBiometricEvent("authenticated",false,sig);return;
        }
        biometricMode=op;
        biometricPinSignature=sig;
        BiometricPrompt.AuthenticationCallback callback=new BiometricPrompt.AuthenticationCallback(){
            private void finish(boolean success) {
                String kind=biometricMode,signature=biometricPinSignature;
                biometricMode=null;biometricPinSignature=null;
                if(kind==null)return;
                if(success&&"enable".equals(kind)){
                    biometricPreferences().edit().putBoolean("enabled",true)
                      .putString("pin_signature",signature).apply();
                }
                sendBiometricEvent("enable".equals(kind)?"enabled":"authenticated",success,signature);
            }
            @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                super.onAuthenticationSucceeded(result);finish(true);
            }
            @Override public void onAuthenticationError(int code,CharSequence message) {
                super.onAuthenticationError(code,message);finish(false);
            }
        };
        try {
            BiometricPrompt prompt=new BiometricPrompt(this,ContextCompat.getMainExecutor(this),callback);
            BiometricPrompt.PromptInfo info=new BiometricPrompt.PromptInfo.Builder()
                .setTitle("ZAVI ONE - Fingerprint / اثر انگشت")
                .setSubtitle("Confirm your fingerprint to unlock the application")
                .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
                .setNegativeButtonText("Use PIN / ورود با رمز")
                .build();
            prompt.authenticate(info);
        } catch(Exception ex){
            biometricMode=null;biometricPinSignature=null;
            sendBiometricEvent("enable".equals(op)?"enabled":"authenticated",false,sig);
        }
    }

    private void printPage() {
        try {
            PrintManager manager=(PrintManager)getSystemService(Context.PRINT_SERVICE);
            if(manager!=null && webView!=null) manager.print("ZAVI ONE",webView.createPrintDocumentAdapter("ZAVI ONE"),new android.print.PrintAttributes.Builder().build());
        } catch(Exception ex){toast("Print unavailable");}
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request,result,data);
        if(request==PICK_UPLOAD){
            if(fileCallback!=null){
                Uri[] uris=null;
                if(result==RESULT_OK){
                    if(data!=null&&data.getData()!=null)uris=new Uri[]{data.getData()};
                    else if(pendingPhotoUri!=null&&pendingPhotoFile!=null&&pendingPhotoFile.length()>0)uris=new Uri[]{pendingPhotoUri};
                    else uris=WebChromeClient.FileChooserParams.parseResult(result,data);
                }
                fileCallback.onReceiveValue(uris);
                if(uris==null||uris.length==0||!uris[0].equals(pendingPhotoUri))discardPendingPhoto();
                fileCallback=null;
            }
        }
        if(request==SAVE_DOCUMENT){
            byte[] payload=pendingSave; pendingSave=null;
            if(result==RESULT_OK && data!=null && data.getData()!=null && payload!=null){
                try(OutputStream out=getContentResolver().openOutputStream(data.getData())){
                    if(out==null)throw new Exception("No output stream");
                    out.write(payload);
                    toast("File saved / فایل ذخیره شد");
                }catch(Exception ex){toast("Saving failed / ذخیره نشد");}
            }
        }
    }

    private void discardPendingPhoto() {
        pendingPhotoUri=null;
        if(pendingPhotoFile!=null){pendingPhotoFile.delete();pendingPhotoFile=null;}
    }
    @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] results) {
        super.onRequestPermissionsResult(request,permissions,results);
        if(request==CAMERA_PERMISSION && pendingCamera!=null){
            PermissionRequest current=pendingCamera;pendingCamera=null;
            if(results.length>0 && results[0]==PackageManager.PERMISSION_GRANTED)current.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
            else current.deny();
        }
    }
    private void toast(String message) {runOnUiThread(()->Toast.makeText(this,message,Toast.LENGTH_LONG).show());}
    @Override public void onBackPressed() {
        if(webView!=null && webView.canGoBack()){webView.goBack();return;}
        if(System.currentTimeMillis()-lastBackPress<1800){super.onBackPressed();return;}
        lastBackPress=System.currentTimeMillis();
        toast("Press back again to exit / برای خروج دوباره بزنید");
    }
    /**
     * Keep the same WebView instance when the device rotates. Recreating it would
     * discard in-flight UI edits and could interrupt an unsent offline invoice.
     * This only refreshes viewport measurements; it never reloads the page.
     */
    @Override public void onConfigurationChanged(Configuration config) {
        super.onConfigurationChanged(config);
        if (container != null) container.requestLayout();
        if (webView != null) {
            webView.requestLayout();
            webView.post(() -> {
                if (webView != null) {
                    webView.evaluateJavascript(
                        "window.dispatchEvent(new Event('resize'));" +
                        "window.dispatchEvent(new Event('orientationchange'));" +
                        "window.dispatchEvent(new Event('zavi:native-configurationchange'));",
                        null);
                }
            });
        }
    }

    @Override protected void onPause(){super.onPause();if(webView!=null)webView.onPause();}
    @Override protected void onResume(){super.onResume();if(webView!=null)webView.onResume();}
    @Override protected void onDestroy(){
        if(fileCallback!=null){fileCallback.onReceiveValue(null);fileCallback=null;}
        if(pendingCamera!=null){pendingCamera.deny();pendingCamera=null;}
        discardPendingPhoto();
        if(webView!=null){
            container.removeView(webView);
            webView.stopLoading();webView.destroy();webView=null;
        }
        super.onDestroy();
    }
}