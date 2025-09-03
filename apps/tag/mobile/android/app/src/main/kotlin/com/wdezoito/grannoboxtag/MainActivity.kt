package com.wdezoito.grannoboxtag

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine

class MainActivity: FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        
        println("🚀 [MainActivity] Configurando Flutter Engine...")
        
        // Registrar o plugin Bluetooth antigo (para compatibilidade)
        val bluetoothPlugin = BluetoothPlugin()
        flutterEngine.plugins.add(bluetoothPlugin)
        
        // Registrar o novo plugin Bluetooth otimizado
        val bluetoothPrinterPlugin = BluetoothPrinterPlugin()
        flutterEngine.plugins.add(bluetoothPrinterPlugin)
        
        println("✅ [MainActivity] Plugins Bluetooth registrados com sucesso!")
    }
}
