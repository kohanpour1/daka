# Keep WebView bridge if expanded later
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
