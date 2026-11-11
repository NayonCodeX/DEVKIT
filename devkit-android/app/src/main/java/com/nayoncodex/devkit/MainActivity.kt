package com.nayoncodex.devkit

import android.annotation.SuppressLint
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
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
 *   - Pull-to-refresh
 *   - Back button navigates WebView history instead of closing the app
 *
 * The target URL is defined in [BuildConfig] as [DEVKIT_URL]. Change it
 * to your deployment URL when you publish DEVKIT to a real HTTPS host.
 *
 * @author Nayon Ahamed (NCX / NayonCodeX)
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Edge-to-edge layout
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = getColor(R.color.devkit_navy)
        window.navigationBarColor = getColor(R.color.devkit_navy)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Configure WebView
        setupWebView()

        // Pull-to-refresh
        binding.swipeRefresh.setOnRefreshListener {
            binding.webView.reload()
        }
        binding.swipeRefresh.setColorSchemeColors(
            getColor(R.color.devkit_purple),
            getColor(R.color.devkit_cyan),
        )

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

        // Load DEVKIT URL
        if (!isOnline()) {
            showError()
        } else {
            binding.webView.loadUrl(DEVKIT_URL)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        binding.webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true            // IndexedDB workspace + tool history
            databaseEnabled = true
            allowFileAccess = false             // security: no local file access from web content
            allowContentAccess = false
            mediaPlaybackRequiresUserGesture = false
            cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            setGeolocationEnabled(true)
            // Modern UA so PWA manifest is detected
            userAgentString = (userAgentString ?: "") + " DEVKIT/1.0.0 (Android)"
        }

        // Required so JavaScript `alert()`, `confirm()`, file choosers, and
        // permission requests work inside the WebView.
        binding.webView.webChromeClient = DevkitChromeClient(this)
        binding.webView.webViewClient = DevkitWebViewClient()

        // Progress bar
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
                // Fall through to the default behaviour which opens the system file picker.
                return super.onShowFileChooser(webView, filePathCallback, fileChooserParams)
            }
        }
    }

    private inner class DevkitWebViewClient : WebViewClient() {
        override fun onReceivedError(
            view: WebView?,
            request: WebResourceRequest?,
            error: WebResourceError?
        ) {
            // Only show our error view if the main frame failed (not a sub-resource).
            if (request != null && request.isForMainFrame) {
                showError()
            }
        }

        override fun onPageFinished(view: WebView?, url: String?) {
            binding.progressBar.visibility = View.GONE
            binding.swipeRefresh.isRefreshing = false
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
         * The DEVKIT deployment URL. Change this to your real deployment URL
         * after you deploy DEVKIT to Vercel / Netlify / Render / Fly.io / etc.
         *
         * GitHub Pages cannot run the DEVKIT backend, so do NOT use a
         * *.github.io URL here.
         */
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
