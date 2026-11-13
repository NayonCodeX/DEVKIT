package com.nayoncodex.devkit

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import com.nayoncodex.devkit.databinding.ActivityMainBinding

/**
 * DEVKIT — Build Smarter. Code Better.
 *
 * v1.0.3 — Reliability-first rebuild.
 *
 * The previous versions (v1.0.0–v1.0.2) crashed on launch for some users.
 * Root cause analysis pointed at three issues:
 *
 *   1. `file://` URL loading does NOT support relative sub-resource paths
 *      the way an HTTPS origin does. Next.js's `./_next/...` references
 *      worked on some WebView versions and silently failed on others,
 *      so the page never finished loading and appeared "stuck" or
 *      crashed when the user touched the screen.
 *
 *   2. The `webChromeClient` was being assigned twice in v1.0.1/v1.0.2,
 *      so the JsResult callback chain was broken on alert/confirm.
 *
 *   3. `setLayerType(HARDWARE)` crashed on a small number of older /
 *      lower-end phones during the first accelerated draw.
 *
 * Fix in v1.0.3
 * --------------
 *   - Use **WebViewAssetLoader** (androidx.webkit). It serves files from
 *     `assets/www/` under an `https://appassets.androidplatform.net/`
 *     origin. Every relative URL in the page resolves correctly because
 *     the loader behaves like a real HTTP origin. This is the Google-
 *     recommended way to bundle a PWA inside an APK and is rock-solid.
 *   - Single, consolidated `WebViewClient` and `WebChromeClient`.
 *   - NO `setLayerType` call — let the WebView pick its own layer type.
 *   - Every callback is wrapped defensively so a JsResult that errors
 *     out never crashes the host activity.
 *   - `cacheMode = LOAD_DEFAULT`.
 *   - `applicationIdSuffix = .debug` removed from build config so the
 *     package name is exactly `com.nayoncodex.devkit` — no surprise
 *     installation conflicts.
 *
 * @author Nayon Ahamed (NCX / NayonCodeX)
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Edge-to-edge — content draws under status/nav bars; we apply
        // window insets as padding on the root so nothing is hidden.
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // 1) Configure WebView FIRST (before any load).
        setupWebView()

        // 2) Pull-to-refresh — only fires when WebView can't scroll up.
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

        // 3) Apply window insets as padding on the root.
        binding.root.setOnApplyWindowInsetsListener { v, insets ->
            val sysBars = insets.getInsets(
                WindowInsetsCompat.Type.statusBars() or
                WindowInsetsCompat.Type.navigationBars()
            )
            v.setPadding(sysBars.left, sysBars.top, sysBars.right, sysBars.bottom)
            insets
        }

        // 4) Retry button.
        binding.retryButton.setOnClickListener {
            binding.errorView.visibility = View.GONE
            binding.webView.visibility = View.VISIBLE
            binding.webView.reload()
        }

        // 5) Back button → WebView history first, then exit.
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

        // 6) Load DEVKIT LAST — only after everything is configured.
        //    The WebViewAssetLoader serves the bundled PWA under
        //    https://appassets.androidplatform.net/ so all relative
        //    paths in the Next.js bundle resolve correctly.
        val targetUrl = if (LOCAL_MODE) ASSET_BASE_URL else DEVKIT_URL
        if (!LOCAL_MODE && !isOnline()) {
            showError()
        } else {
            binding.webView.loadUrl(targetUrl)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        // ----- WebViewAssetLoader -----
        // This is the KEY fix. It serves files from app/src/main/assets/www/
        // under the virtual origin https://appassets.androidplatform.net/
        // so the Next.js bundle's relative URLs (./_next/static/...) all
        // resolve correctly — exactly like loading from a real web server.
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        // ----- Settings -----
        binding.webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true            // IndexedDB workspace + tool history
            databaseEnabled = true

            // For asset loader — must allow content & file access
            allowFileAccess = true
            allowContentAccess = true

            // Sizing — make the WebView behave like a real mobile browser.
            loadWithOverviewMode = true
            useWideViewPort = true

            // DEFAULT cache — works reliably with the asset loader.
            cacheMode = WebSettings.LOAD_DEFAULT

            // Allow pinch-zoom (HTML viewport also says user-scalable=yes).
            builtInZoomControls = true
            displayZoomControls = false

            mediaPlaybackRequiresUserGesture = false
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            setGeolocationEnabled(true)

            // Modern UA so PWA manifest is detected.
            userAgentString = (userAgentString ?: "") + " DEVKIT/1.0.3 (Android)"
        }

        // ----- View properties -----
        binding.webView.apply {
            overScrollMode = View.OVER_SCROLL_ALWAYS
            isFocusable = true
            isFocusableInTouchMode = true
            isVerticalScrollBarEnabled = true
            isHorizontalScrollBarEnabled = false
            // NOTE: do NOT call setLayerType(HARDWARE) — it crashed on
            // some older devices. Default layer is fine.
        }

        // ----- WebViewClient (asset loader + error handling + page-finish CSS) -----
        binding.webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                // Route every request through the asset loader so the
                // bundled PWA's relative paths resolve.
                val url = request?.url ?: return null
                return assetLoader.shouldInterceptRequest(url)
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                // Only show the error screen for main-frame failures.
                if (request != null && request.isForMainFrame) {
                    showError()
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                binding.progressBar.visibility = View.GONE
                binding.swipeRefresh.isRefreshing = false
                // Inject CSS so html/body fill 100% of the WebView — kills
                // the "tiny strip in the middle" rendering bug.
                val js = """
                    (function(){
                        try {
                            var s = document.createElement('style');
                            s.id = 'devkit-mobile-fix';
                            s.textContent = 'html,body{min-height:100%!important;height:100%!important;width:100%!important;margin:0!important;padding:0!important;overflow-x:hidden!important;-webkit-tap-highlight-color:transparent;}body{overscroll-behavior-y:contain;}';
                            if(!document.getElementById('devkit-mobile-fix')){
                                document.head.appendChild(s);
                            }
                        } catch(e) {}
                    })();
                """.trimIndent()
                view?.evaluateJavascript(js, null)
            }
        }

        // ----- WebChromeClient (progress + dialogs + geolocation + file chooser) -----
        binding.webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                try {
                    if (newProgress in 1..99) {
                        binding.progressBar.visibility = View.VISIBLE
                        binding.progressBar.progress = newProgress
                    } else {
                        binding.progressBar.visibility = View.GONE
                        binding.swipeRefresh.isRefreshing = false
                    }
                } catch (_: Exception) {
                    // Defensive — never let a UI update crash the host.
                }
            }

            override fun onJsAlert(
                view: WebView?, url: String?, message: String?,
                result: android.webkit.JsResult?
            ): Boolean {
                try {
                    android.app.AlertDialog.Builder(this@MainActivity)
                        .setTitle("DEVKIT")
                        .setMessage(message)
                        .setPositiveButton("OK") { _, _ -> result?.confirm() }
                        .setOnCancelListener { result?.cancel() }
                        .show()
                } catch (_: Exception) {
                    result?.cancel()
                }
                return true
            }

            override fun onJsConfirm(
                view: WebView?, url: String?, message: String?,
                result: android.webkit.JsResult?
            ): Boolean {
                try {
                    android.app.AlertDialog.Builder(this@MainActivity)
                        .setTitle("DEVKIT")
                        .setMessage(message)
                        .setPositiveButton("OK") { _, _ -> result?.confirm() }
                        .setNegativeButton("Cancel") { _, _ -> result?.cancel() }
                        .setOnCancelListener { result?.cancel() }
                        .show()
                } catch (_: Exception) {
                    result?.cancel()
                }
                return true
            }

            override fun onGeolocationPermissionsShowPrompt(
                origin: String?, callback: android.webkit.GeolocationPermissions.Callback?
            ) {
                try {
                    callback?.invoke(origin, true, false)
                } catch (_: Exception) {}
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
        return try {
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
                ?: return false
            val network = cm.activeNetwork ?: return false
            val caps = cm.getNetworkCapabilities(network) ?: return false
            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } catch (_: Exception) {
            false
        }
    }

    private fun showError() {
        try {
            binding.webView.visibility = View.GONE
            binding.progressBar.visibility = View.GONE
            binding.swipeRefresh.isRefreshing = false
            binding.errorView.visibility = View.VISIBLE
        } catch (_: Exception) {}
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && binding.webView.canGoBack()) {
            binding.webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    companion object {
        private const val LOCAL_MODE = true

        /**
         * WebViewAssetLoader serves files from `assets/www/` under
         * `https://appassets.androidplatform.net/assets/www/index.html`.
         *
         * This is the Google-recommended way to bundle a PWA inside an
         * APK. All relative URLs in the Next.js bundle resolve correctly
         * because the loader provides a real HTTP origin.
         */
        private const val ASSET_BASE_URL =
            "https://appassets.androidplatform.net/assets/www/index.html"

        private const val DEVKIT_URL = "https://devkit-ncx.vercel.app"
    }
}
