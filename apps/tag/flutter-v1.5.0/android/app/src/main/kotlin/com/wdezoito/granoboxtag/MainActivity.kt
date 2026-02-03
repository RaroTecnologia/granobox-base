package com.wdezoito.granoboxtag

import android.os.Build
import android.os.Bundle
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    companion object {
        private const val CHANNEL = "com.wdezoito.granoboxtag/system_ui"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        configureSystemBars()
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "configureSystemBars" -> {
                    val light = call.argument<Boolean>("lightIcons") ?: false
                    val showStatus = call.argument<Boolean>("showStatus") ?: true
                    configureSystemBars(lightIcons = light, showStatus = showStatus)
                    result.success(null)
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun configureSystemBars(
        lightIcons: Boolean = false,
        showStatus: Boolean = true,
    ) {
        WindowCompat.setDecorFitsSystemWindows(window, !showStatus)
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        controller.isAppearanceLightStatusBars = lightIcons
        controller.isAppearanceLightNavigationBars = lightIcons
    }
}
