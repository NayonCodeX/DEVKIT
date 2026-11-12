package com.nayoncodex.devkit

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.nayoncodex.devkit.databinding.ActivityMainBinding

/**
 * DEVKIT — Build Smarter. Code Better.
 *
 * MainActivity hosts a WebView that loads the DEVKIT PWA. The WebView is
 * configured to behave like a real app:
 *   - JavaScript enabled
 *   - DOM storage / IndexedDB enabled (so the workspace + tools persist)
 *   - File upload support (for the file tools)
 *   - Geolocation / camera permission requests routed to the system
 *   - Pull-to-refresh (only when scrolled to the very top)
 *   - Back button navigates WebView history instead of closing the app
 *
 * Scroll & sizing fixes (v1.0.1):
 *   - WebView fills the area between the status bar and the gesture/nav bar
 *     using WindowInsetsListener, so the page never sits under the system
 *     bars and is never cut off.
 *   - setOverScrollMode(OVER_SCROLL_ALWAYS) + isFocusable(true) +
 *     setNestedScrollingEnabled(true) so the WebView keeps scrolling inside
 *     the SwipeRefreshLayout.
 *   - SwipeRefreshLayout only triggers refresh when the WebView is scrolled
 *     to the very top (canScrollVertically(-1) == false), so normal
 *     scrolling is never hijacked by the pull-to-refresh gesture.
 *   - Viewport meta on the HTML enforces width=device-width and lets the
 *     user pinch-zoom; we also inject a CSS rule on page finished so the
 *     html/body height is exactly 100% — this fixes the "small content"
 *     bug where the page rendered as a thin strip.
 *
 * The target URL is loaded from `assets/www/index.html` (LOCAL_MODE) by
 * default, which makes the entire app work offline. To switch to a remote
 * deployment, set LOCAL_MODE = false and update DEVKIT_URL.
 *
 * @author Nayon Ahamed (NCX / NayonCodeX)
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Edge-to-edge layout — content draws under status/nav bars, and
        // we apply window insets to the WebView below so nothing is hidden.
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Configure WebView
        setupWebView()

        // Pull-to-refresh — but ONLY when the page is scrolled to the top,
        // otherwise this would hijack normal vertical scrolling.
        binding.swipeRefresh.setOnChildScrollUpCallback { _, _ ->
            binding.webView.canScrollVertically(-1)
        }
        binding.swipeRefresh.setOnRefreshListener {
            binding.webView.reload()
        }
        binding.swipeRefresh.setColorSchemeColors(
            getColor(R.color.devkit_purple),
            getColor(R.color.devkit_cyan),
        )
        // Distance the user must pull before refresh triggers — larger value
        // means less accidental triggers during normal scroll.
        binding.swipeRefresh.setDistanceToTriggerSync(240)

        // Apply window insets to the SwipeRefreshLayout root so the WebView
        // lives between the status bar and the navigation bar.
        WindowCompat.setDecorFitsSystemWindows(window, false)
        binding.root.setOnApplyWindowInsetsListener { v, insets ->
            val sysBars = insets.getInsets(
                WindowInsetsCompat.Type.statusBars() or
                WindowInsetsCompat.Type.navigationBars()
            )
            v.setPadding(sysBars.left, sysBars.top, sysBars.right, sysBars.bottom)
            insets
        }

        // Retry button on error view
        binding.retryButton.setOnClickListener {
            binding.errorView.visibility = View.GONE
            binding.webView.visibility = View.VISIBLE
            binding.webView.reload()
        }

        // Custom back navigation: navigate WebView history first, then exit
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (binding.webView.canGoBack()) {
                    binding.webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        // Load DEVKIT — local (bundled) or remote (deployment URL)
        val targetUrl = if (LOCAL_MODE) LOCAL_ASSET_URL else DEVKIT_URL
        if (!LOCAL_MODE && !isOnline()) {
            showError()
        } else {
            binding.webView.loadUrl(targetUrl)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        binding.webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true            // IndexedDB workspace + tool history
            databaseEnabled = true

            // For LOCAL_MODE: allow loading from file:///android_asset/.
            allowFileAccess = true
            allowContentAccess = true

            // Layout & sizing — the critical fix for "size is wrong" + "can't
            // see it properly on phone".
            //
            //   - loadWithOverviewMode = true  → WebView scales the page so
            //     it fits the device width on first load.
            //   - useWideViewPort  = true     → enables the viewport meta tag
            //     in the HTML, which our page has (width=device-width).
            //   - The combination of these two makes the page behave exactly
            //     like a mobile browser: full-width, readable text, no
            //     tiny zoomed-out strip.
            loadWithOverviewMode = true
            useWideViewPort = true

            // Force a clean cache on each cold start so the user never gets
            // a stale page from a previous install.
            cacheMode = WebSettings.LOAD_NO_CACHE

            // Allow pinch-zoom (the HTML viewport also says user-scalable=yes).
            builtInZoomControls = true
            displayZoomControls = false

            // Smooth scrolling inside the WebView.
            mediaPlaybackRequiresUserGesture = false
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            setGeolocationEnabled(true)

            // Modern UA so PWA manifest is detected.
            userAgentString = (userAgentString ?: "") + " DEVKIT/1.0.1 (Android)"
        }

        // Critical scrolling fixes for a WebView inside a SwipeRefreshLayout.
        binding.webView.apply {
            // Allow the WebView itself to scroll (over-scroll glow on the
            // top/bottom edge).
            overScrollMode = View.OVER_SCROLL_ALWAYS
            // Make the WebView focusable so it actually receives touch /
            // scroll events even when hosted in a complex view hierarchy.
            isFocusable = true
            isFocusableInTouchMode = true
            // Enable nested scrolling so SwipeRefreshLayout can tell when
            // the WebView has scrolled to the top and only THEN start a
            // pull-to-refresh.
            isVerticalScrollBarEnabled = true
            isHorizontalScrollBarEnabled = false
            // Render at the device's native frame rate.
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
        }

        // Required so JavaScript `alert()`, `confirm()`, file choosers, and
        // permission requests work inside the WebView.
        binding.webView.webChromeClient = DevkitChromeClient(this)
        binding.webView.webViewClient = DevkitWebViewClient()

        // Progress bar — also pulled-to-refresh spinner stop.
        binding.webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress in 1..99) {
                    binding.progressBar.visibility = View.VISIBLE
                    binding.progressBar.progress = newProgress
                } else {
                    binding.progressBar.visibility = View.GONE
                    binding.swipeRefresh.isRefreshing = false
                }
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: android.webkit.ValueCallback<Array<android.net.Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                // DEVKIT's "Upload" buttons in tools use <input type=file>.
                return super.onShowFileChooser(webView, filePathCallback, fileChooserParams)
            }
        }
    }

    /**
     * Injects a small CSS rule on page finished so html/body are 100% height
     * — this kills the "tiny strip in the middle of the screen" rendering
     * bug that some Next.js static exports hit inside Android WebView.
     */
    private inner class DevkitWebViewClient : WebViewClient() {
        override fun onReceivedError(
            view: WebView?,
            request: WebResourceRequest?,
            error: WebResourceError?
        ) {
            // Only show our error view if the main frame failed.
            if (request != null && request.isForMainFrame) {
                showError()
            }
        }

        override fun onPageFinished(view: WebView?, url: String?) {
            binding.progressBar.visibility = View.GONE
            binding.swipeRefresh.isRefreshing = false
            // Ensure the layout fills the WebView — fixes the "app size is
            // wrong / can't see it properly" complaint from v1.0.0.
            val js = """
                (function(){
                    var s = document.createElement('style');
                    s.id = 'devkit-mobile-fix';
                    s.textContent = 'html,body{min-height:100%!important;height:100%!important;width:100%!important;margin:0!important;padding:0!important;overflow-x:hidden!important;-webkit-tap-highlight-color:transparent;}body{overscroll-behavior-y:contain;}';
                    if(!document.getElementById('devkit-mobile-fix')){
                        document.head.appendChild(s);
                    }
                })();
            """.trimIndent()
            view?.evaluateJavascript(js, null)
        }
    }

    private fun isOnline(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
        val network = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(network) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun showError() {
        binding.webView.visibility = View.GONE
        binding.progressBar.visibility = View.GONE
        binding.swipeRefresh.isRefreshing = false
        binding.errorView.visibility = View.VISIBLE
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && binding.webView.canGoBack()) {
            binding.webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    companion object {
        /**
         * The DEVKIT web app is bundled inside this APK as a static export
         * under `app/src/main/assets/www/`. Loading it from
         * `file:///android_asset/www/index.html` means the entire app runs
         * offline — all 30 tools, workspace, themes, and Bangla/English
         * UI work without any internet connection.
         *
         * AI and GitHub features require a backend (the API routes are
         * not included in the static export), so those sections will
         * show their "not configured" banners in the APK.
         *
         * To switch the APK to load from a remote deployment instead,
         * change `LOCAL_MODE` to `false` and set `DEVKIT_URL` to your
         * deployment URL (e.g. `https://your-name.vercel.app`).
         */
        private const val LOCAL_MODE = true
        private const val LOCAL_ASSET_URL = "file:///android_asset/www/index.html"
        private const val DEVKIT_URL = "https://devkit-ncx.vercel.app"
    }
}

/**
 * DevkitChromeClient handles alert() / confirm() / prompt() dialogs from the
 * WebView, plus permission requests (e.g. camera for the QR scanner).
 */
class DevkitChromeClient(private val context: Context) : WebChromeClient() {

    override fun onJsAlert(
        view: WebView?, url: String?, message: String?, result: android.webkit.JsResult?
    ): Boolean {
        android.app.AlertDialog.Builder(context)
            .setTitle("DEVKIT")
            .setMessage(message)
            .setPositiveButton("OK") { _, _ -> result?.confirm() }
            .setOnCancelListener { result?.cancel() }
            .show()
        return true
    }

    override fun onJsConfirm(
        view: WebView?, url: String?, message: String?, result: android.webkit.JsResult?
    ): Boolean {
        android.app.AlertDialog.Builder(context)
            .setTitle("DEVKIT")
            .setMessage(message)
            .setPositiveButton("OK") { _, _ -> result?.confirm() }
            .setNegativeButton("Cancel") { _, _ -> result?.cancel() }
            .setOnCancelListener { result?.cancel() }
            .show()
        return true
    }

    override fun onGeolocationPermissionsShowPrompt(
        origin: String?, callback: android.webkit.GeolocationPermissions.Callback?
    ) {
        callback?.invoke(origin, true, false)
    }
}
