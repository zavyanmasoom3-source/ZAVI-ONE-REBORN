# Preserve Android WebView / JavaScript bridge and framework callback entry points.
# R8 will optimize ordinary unused Java code; embedded web assets are retained.
-keep class com.zavione.mobile.MainActivity { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
