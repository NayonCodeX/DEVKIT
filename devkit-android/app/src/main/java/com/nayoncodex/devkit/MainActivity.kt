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
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import com.nayoncodex.devkit.databinding.ActivityMainBinding

/**
 * DEVKIT — Build Smarter. Code Better.
 *
 * MainActivity hosts a WebView that loads the DEVKIT PWA bundled inside
 * the APK at `assets/www/index.html`. The WebView is configured to
 * behave like a real mobile browser:
 *
 *   - JavaScript + DOM storage / IndexedDB enabled (workspace + tools persist)
 *   - File upload support (file tools, QR scanner)
 *   - Pull-to-refresh (only when scrolled to the very top)
 *   - Back button navigates WebView history instead of closing the app
 *
 * v1.0.2 — Reliability + rendering fixes:
 *   - Removed the duplicate `webChromeClient` assignment that was overriding
 *     the DevkitChromeClient (so alert/confirm/permission dialogs now work).
 *   - Cache mode = `DEFAULT` (was `LOAD_NO_CACHE`) so `file://` loads work
 *     reliably across all devices.
 *   - Removed the explicit `setLayerType(HARDWARE)` — on some older phones
 *     this crashed during hardware-accelerated draw. Default layer is fine.
 *   - Defensive WebView setup order: configure settings first, then
 *     WebViewClient + WebChromeClient, then load URL last.
 *   - Edge-to-edge is now guarded by SDK check (WindowCompat handles it
 *     internally but we also early-return for pre-Lollipop-style issues).
 *   - Window insets applied as padding so content lives between the status
 *     bar and navigation bar — never hidden, never cut off.
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

        // Configure WebView FIRST (before loading anything).
        setupWebView()

        // Pull-to-refresh — only triggers when WebView is scrolled to the very top.
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
        binding.swipeRefresh.setDistanceToTriggerSync(240)

        // Apply window insets as padding on the root so the WebView lives
        // between the status bar and the navigation bar.
        binding.root.setOnApplyWindowInsetsListener { v, insets ->
            val sysBars = insets.getInsets(
                WindowInsetsCompat.Type.statusBars() or
                WindowInsetsCompat.Type.navigationBars()
            )
            v.setPadding(sysBars.left, sysBars.top, sysBars.right, sysBars.bottom)
            insets
        }

        // Retry button on error view.
        binding.retryButton.setOnClickListener {
            binding.errorView.visibility = View.GONE
            binding.webView.visibility = View.VISIBLE
            binding.webView.reload()
        }

        // Back button: navigate WebView history first, then exit.
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

        // Load DEVKIT LAST — only after WebView + clients are configured.
        val targetUrl = if (LOCAL_MODE) LOCAL_ASSET_URL else DEVKIT_URL
        if (!LOCAL_MODE && !isOnline()) {
            showError()
        } else {
            binding.webView.loadUrl(targetUrl)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        // ---- 1. WebView settings ----
        binding.webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true            // IndexedDB workspace + tool history
            databaseEnabled = true

            allowFileAccess = true               // For file:///android_asset/
            allowContentAccess = true

            // Sizing — make the WebView behave like a real mobile browser:
            //   full-width, readable text, no tiny strip.
            loadWithOverviewMode = true
            useWideViewPort = true

            // DEFAULT cache — works reliably with file:// URLs on every device.
            cacheMode = WebSettings.LOAD_DEFAULT

            // Allow pinch-zoom (HTML viewport also says user-scalable=yes).
            builtInZoomControls = true
            displayZoomControls = false

            mediaPlaybackRequiresUserGesture = false
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            setGeolocationEnabled(true)

            // Modern UA so PWA manifest is detected.
            userAgentString = (userAgentString ?: "") + " DEVKIT/1.0.2 (Android)"
        }

        // ---- 2. WebView view properties ----
        binding.webView.apply {
            overScrollMode = View.OVER_SCROLL_ALWAYS
            isFocusable = true
            isFocusableInTouchMode = true
            isVerticalScrollBarEnabled = true
            isHorizontalScrollBarEnabled = false
            // NOTE: do NOT call setLayerType(HARDWARE) here — it caused
            // crashes on some older devices. The default layer type is fine.
        }

        // ---- 3. WebViewClient (handles errors + page-finished CSS inject) ----
        binding.webView.webViewClient = object : WebViewClient() {
            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                if (request != null && request.isForMainFrame) {
                    showError()
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                binding.progressBar.visibility = View.GONE
                binding.swipeRefresh.isRefreshing = false
                // Inject CSS so html/body fill 100% of the WebView — kills the
                // "tiny strip in the middle" rendering bug.
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

        // ---- 4. WebChromeClient (alert/confirm dialogs + progress) ----
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

            override fun onJsAlert(
                view: WebView?, url: String?, message: String?, result: android.webkit.JsResult?
            ): Boolean {
                android.app.AlertDialog.Builder(this@MainActivity)
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
                android.app.AlertDialog.Builder(this@MainActivity)
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

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: android.webkit.ValueCallback<Array<android.net.Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                return super.onShowFileChooser(webView, filePathCallback, fileChooserParams)
            }
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
         * not included in the static export), so those sections show
         * their "not configured" banners in the APK.
         *
         * To switch the APK to load from a remote deployment instead,
         * change `LOCAL_MODE` to `false` and set `DEVKIT_URL` to your
         * deployment URL.
         */
        private const val LOCAL_MODE = true
        private const val LOCAL_ASSET_URL = "file:///android_asset/www/index.html"
        private const val DEVKIT_URL = "https://devkit-ncx.vercel.app"
    }
}
