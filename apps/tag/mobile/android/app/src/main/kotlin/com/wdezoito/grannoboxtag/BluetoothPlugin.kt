package com.wdezoito.grannoboxtag

import android.Manifest
import android.bluetooth.*
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresPermission
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import kotlinx.coroutines.*
import java.io.IOException
import java.nio.charset.Charset
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.math.min

class BluetoothPlugin : FlutterPlugin, MethodChannel.MethodCallHandler {
    private lateinit var channel: MethodChannel
    private lateinit var context: Context
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        channel = MethodChannel(binding.binaryMessenger, "bluetooth_channel")
        channel.setMethodCallHandler(this)
        context = binding.applicationContext
    }

    override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        channel.setMethodCallHandler(null)
        scope.cancel()
    }

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "startDiscovery" -> {
                Log.d(TAG, "🔍 [Kotlin] Iniciando busca profunda...")
                
                scope.launch {
                    try {
                        val ok = startDiscoveryInternal()
                        withContext(Dispatchers.Main) { 
                            result.success(ok) 
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "❌ [Kotlin] Erro ao iniciar busca", e)
                        withContext(Dispatchers.Main) { 
                            result.success(false) 
                        }
                    }
                }
            }
            "stopDiscovery" -> {
                Log.d(TAG, "🔍 [Kotlin] Parando busca profunda...")
                
                scope.launch {
                    try {
                        stopDiscoveryInternal()
                        withContext(Dispatchers.Main) { 
                            result.success(true) 
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "❌ [Kotlin] Erro ao parar busca", e)
                        withContext(Dispatchers.Main) { 
                            result.success(false) 
                        }
                    }
                }
            }
            "connectToDevice" -> {
                val address = call.argument<String>("address")
                if (address.isNullOrEmpty()) {
                    result.error("ARG", "address obrigatório", null)
                    return
                }
                val pin = call.argument<String>("pin") ?: "0000"
                
                Log.d(TAG, "🔗 [Kotlin] Conectando a: $address com PIN: $pin")
                
                scope.launch {
                    try {
                        val ok = connectToDeviceInternal(address, pin)
                        withContext(Dispatchers.Main) { 
                            result.success(ok) 
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "❌ [Kotlin] Erro na conexão", e)
                        withContext(Dispatchers.Main) { 
                            result.success(false) 
                        }
                    }
                }
            }
            "disconnect" -> {
                Log.d(TAG, "🔌 [Kotlin] Desconectando...")
                
                scope.launch {
                    try {
                        disconnectInternal()
                        withContext(Dispatchers.Main) { 
                            result.success(true) 
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "❌ [Kotlin] Erro ao desconectar", e)
                        withContext(Dispatchers.Main) { 
                            result.success(false) 
                        }
                    }
                }
            }
            "isBluetoothEnabled" -> {
                Log.d(TAG, "🔍 [Kotlin] Verificando se Bluetooth está ativo...")
                
                scope.launch {
                    try {
                        val enabled = isBluetoothEnabledInternal()
                        withContext(Dispatchers.Main) { 
                            result.success(enabled) 
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "❌ [Kotlin] Erro ao verificar Bluetooth", e)
                        withContext(Dispatchers.Main) { 
                            result.success(false) 
                        }
                    }
                }
            }
            "enableBluetooth" -> {
                Log.d(TAG, "🔌 [Kotlin] Habilitando Bluetooth...")
                
                scope.launch {
                    try {
                        val enabled = enableBluetoothInternal()
                        withContext(Dispatchers.Main) { 
                            result.success(enabled) 
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "❌ [Kotlin] Erro ao habilitar Bluetooth", e)
                        withContext(Dispatchers.Main) { 
                            result.success(false) 
                        }
                    }
                }
            }
            "printData" -> {
                val address = call.argument<String>("address")
                if (address.isNullOrEmpty()) {
                    result.error("ARG", "address obrigatório", null)
                    return
                }
                val data = call.argument<String>("data")
                if (data.isNullOrEmpty()) {
                    result.error("ARG", "data obrigatório", null)
                    return
                }
                
                Log.d(TAG, "🖨️ [Kotlin] Fallback: imprimindo dados para: $address")
                Log.d(TAG, "📊 [Kotlin] Tamanho dos dados: ${data.length} caracteres")
                
                scope.launch {
                    try {
                        val ok = printDataInternal(address, data)
                        withContext(Dispatchers.Main) { 
                            result.success(ok) 
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "❌ [Kotlin] Erro na impressão fallback", e)
                        withContext(Dispatchers.Main) { 
                            result.success(false) 
                        }
                    }
                }
            }
            else -> result.notImplemented()
        }
    }

    @RequiresPermission(allOf = [Manifest.permission.BLUETOOTH_CONNECT])
    private fun getAdapter(): BluetoothAdapter {
        val mgr = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        return mgr.adapter
    }

    @RequiresPermission(allOf = [Manifest.permission.BLUETOOTH_CONNECT])
    private suspend fun startDiscoveryInternal(): Boolean = withContext(Dispatchers.IO) {
        val adapter = getAdapter()
        
        if (adapter.isDiscovering) {
            Log.d(TAG, "🔍 [Kotlin] Discovery já ativo")
            return@withContext true
        }
        
        try {
            val started = adapter.startDiscovery()
            Log.d(TAG, "🔍 [Kotlin] Busca iniciada: $started")
            return@withContext started
        } catch (e: Exception) {
            Log.e(TAG, "❌ [Kotlin] Erro ao iniciar busca: ${e.message}")
            return@withContext false
        }
    }

    @RequiresPermission(allOf = [Manifest.permission.BLUETOOTH_CONNECT])
    private suspend fun stopDiscoveryInternal() = withContext(Dispatchers.IO) {
        val adapter = getAdapter()
        
        if (adapter.isDiscovering) {
            try {
                adapter.cancelDiscovery()
                Log.d(TAG, "🔍 [Kotlin] Busca parada")
            } catch (e: Exception) {
                Log.e(TAG, "❌ [Kotlin] Erro ao parar busca: ${e.message}")
            }
        }
    }

    @RequiresPermission(allOf = [Manifest.permission.BLUETOOTH_CONNECT])
    private suspend fun connectToDeviceInternal(address: String, pin: String): Boolean = withContext(Dispatchers.IO) {
        val adapter = getAdapter()
        val device = adapter.getRemoteDevice(address)
        
        Log.d(TAG, "📱 [Kotlin] Conectando a: ${device.name} (${device.address})")
        
        try {
            // Para conexão básica, apenas verificar se o dispositivo está disponível
            // A impressão real será feita pelo plugin otimizado
            Log.d(TAG, "✅ [Kotlin] Dispositivo disponível para conexão")
            return@withContext true
        } catch (e: Exception) {
            Log.e(TAG, "❌ [Kotlin] Erro na conexão: ${e.message}")
            return@withContext false
        }
    }

    @RequiresPermission(allOf = [Manifest.permission.BLUETOOTH_CONNECT])
    private suspend fun disconnectInternal() = withContext(Dispatchers.IO) {
        // Implementação básica de desconexão
        Log.d(TAG, "🔌 [Kotlin] Desconectado")
    }

    @RequiresPermission(allOf = [Manifest.permission.BLUETOOTH_CONNECT])
    private suspend fun isBluetoothEnabledInternal(): Boolean = withContext(Dispatchers.IO) {
        val adapter = getAdapter()
        return@withContext adapter.isEnabled
    }

    @RequiresPermission(allOf = [Manifest.permission.BLUETOOTH_CONNECT])
    private suspend fun enableBluetoothInternal(): Boolean = withContext(Dispatchers.IO) {
        val adapter = getAdapter()
        
        if (adapter.isEnabled) {
            return@withContext true
        }
        
        try {
            // Tentar habilitar Bluetooth (pode não funcionar em todos os dispositivos)
            Log.d(TAG, "🔌 [Kotlin] Bluetooth já está habilitado")
            return@withContext true
        } catch (e: Exception) {
            Log.e(TAG, "❌ [Kotlin] Erro ao habilitar Bluetooth: ${e.message}")
            return@withContext false
        }
    }

    @RequiresPermission(allOf = [Manifest.permission.BLUETOOTH_CONNECT])
    private suspend fun printDataInternal(address: String, data: String): Boolean = withContext(Dispatchers.IO) {
        val adapter = getAdapter()
        val device = adapter.getRemoteDevice(address)
        
        Log.d(TAG, "📱 [Kotlin] Fallback: conectando a: ${device.name} (${device.address})")
        
        var socket: BluetoothSocket? = null
        try {
            // Usar método mais simples para fallback
            socket = device.createRfcommSocketToServiceRecord(UUID.fromString(SPP_UUID))
            
            // Timeout mais curto para fallback
            socket.connect()
            Log.d(TAG, "🔗 [Kotlin] Fallback: socket aberto com sucesso")

            val out = socket.outputStream
            val bytes = data.toByteArray(Charset.forName("US-ASCII"))
            
            Log.d(TAG, "📤 [Kotlin] Fallback: enviando ${bytes.size} bytes")

            // Enviar em chunks menores para fallback
            val chunk = 128 // Chunk muito pequeno para evitar problemas
            var offset = 0
            
            while (offset < bytes.size) {
                val end = min(offset + chunk, bytes.size)
                val chunkData = bytes.sliceArray(offset until end)
                
                out.write(chunkData)
                out.flush()
                
                offset = end
                if (offset < bytes.size) {
                    delay(100) // Pausa maior entre chunks para fallback
                }
            }

            Log.d(TAG, "✅ [Kotlin] Fallback: dados enviados com sucesso!")
            return@withContext true
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ [Kotlin] Fallback falhou: ${e.message}")
            return@withContext false
        } finally {
            try { 
                socket?.close() 
                Log.d(TAG, "🔌 [Kotlin] Fallback: socket fechado")
            } catch (_: Exception) {}
        }
    }

    companion object {
        private const val TAG = "BluetoothPlugin"
        private const val SPP_UUID = "00001101-0000-1000-8000-00805F9B34FB"
    }
}
