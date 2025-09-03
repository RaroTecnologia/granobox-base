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
import java.util.concurrent.*
import kotlin.math.min

class BluetoothPrinterPlugin : FlutterPlugin, MethodChannel.MethodCallHandler {
    private lateinit var channel: MethodChannel
    private lateinit var context: Context
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    
    // Pool de conexões Bluetooth para evitar travamentos
    private val connectionPool = ConcurrentHashMap<String, BluetoothConnection>()
    private val printQueue = LinkedBlockingQueue<PrintJob>()
    private val printExecutor = Executors.newSingleThreadExecutor()
    
    // Flag para controlar o worker de impressão
    private var printWorkerRunning = false

    override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        channel = MethodChannel(binding.binaryMessenger, "granobox/bluetooth_printer")
        channel.setMethodCallHandler(this)
        context = binding.applicationContext
        
        // Iniciar worker de impressão
        startPrintWorker()
    }

    override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        channel.setMethodCallHandler(null)
        scope.cancel()
        printExecutor.shutdown()
        
        // Fechar todas as conexões
        connectionPool.values.forEach { it.close() }
        connectionPool.clear()
    }

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "printZpl" -> {
                val address = call.argument<String>("address") ?: return result.error("ARG", "address obrigatório", null)
                val zpl = call.argument<String>("zpl") ?: return result.error("ARG", "zpl obrigatório", null)
                
                Log.d(TAG, "🖨️ [Kotlin] Adicionando job de impressão para: $address")
                
                // Detectar automaticamente se é ZPL ou CPCL
                val isCpcl = _detectCpcl(zpl)
                Log.d(TAG, "📝 [Kotlin] Formato detectado: ${if (isCpcl) "CPCL" else "ZPL"}")
                
                // Adicionar à fila de impressão
                val printJob = PrintJob(address, zpl, isCpcl, result)
                printQueue.offer(printJob)
                
                // Responder imediatamente para não travar a UI
                result.success("Job de impressão adicionado à fila")
            }
            "testConnection" -> {
                val address = call.argument<String>("address") ?: return result.error("ARG", "address obrigatório", null)
                
                Log.d(TAG, "🔗 [Kotlin] Testando conexão com: $address")
                
                scope.launch {
                    try {
                        val ok = testConnectionInternal(address)
                        withContext(Dispatchers.Main) { 
                            result.success(ok) 
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "❌ [Kotlin] Erro no teste de conexão", e)
                        withContext(Dispatchers.Main) { 
                            result.success(false) 
                        }
                    }
                }
            }
            "scanDevices" -> {
                Log.d(TAG, "🔍 [Kotlin] Buscando dispositivos pareados")
                
                scope.launch {
                    try {
                        val devices = scanDevicesInternal()
                        withContext(Dispatchers.Main) { 
                            result.success(devices) 
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "❌ [Kotlin] Erro ao buscar dispositivos", e)
                        withContext(Dispatchers.Main) { 
                            result.error("SCAN_ERROR", "Erro ao buscar dispositivos", e.message) 
                        }
                    }
                }
            }
            else -> result.notImplemented()
        }
    }

    // Iniciar worker de impressão em thread separada
    private fun startPrintWorker() {
        if (printWorkerRunning) return
        
        printWorkerRunning = true
        printExecutor.submit {
            while (printWorkerRunning) {
                try {
                    val printJob = printQueue.poll(1, TimeUnit.SECONDS)
                    if (printJob != null) {
                        processPrintJob(printJob)
                    }
                } catch (e: InterruptedException) {
                    Log.d(TAG, "🔄 [Kotlin] Worker de impressão interrompido")
                    break
                } catch (e: Exception) {
                    Log.e(TAG, "❌ [Kotlin] Erro no worker de impressão", e)
                }
            }
        }
    }

    // Processar job de impressão
    private fun processPrintJob(printJob: PrintJob) {
        try {
            Log.d(TAG, "🖨️ [Kotlin] Processando impressão para: ${printJob.address}")
            
            // Executar em coroutine para poder usar suspend functions
            scope.launch {
                try {
                    val success = printDataInternal(printJob.address, printJob.data, printJob.isCpcl)
                    
                    withContext(Dispatchers.Main) {
                        if (success) {
                            val format = if (printJob.isCpcl) "CPCL" else "ZPL"
                            printJob.result.success("Impressão $format realizada com sucesso")
                        } else {
                            printJob.result.error("PRINT_FAILED", "Falha na impressão", null)
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "❌ [Kotlin] Erro ao processar job de impressão", e)
                    withContext(Dispatchers.Main) {
                        printJob.result.error("PRINT_ERROR", "Erro interno: ${e.message}", null)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ [Kotlin] Erro ao iniciar processamento do job", e)
            printJob.result.error("PROCESSING_ERROR", "Erro ao iniciar processamento: ${e.message}", null)
        }
    }

    @RequiresPermission(allOf = [Manifest.permission.BLUETOOTH_CONNECT])
    private fun getAdapter(): BluetoothAdapter {
        val mgr = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        return mgr.adapter
    }

    @RequiresPermission(allOf = [Manifest.permission.BLUETOOTH_CONNECT])
    private suspend fun prepareForConnect(adapter: BluetoothAdapter) {
        if (adapter.isDiscovering) {
            Log.d(TAG, "🔍 [Kotlin] Discovery ativo -> cancelando")
            adapter.cancelDiscovery()
            delay(200)
        }
    }

    @RequiresPermission(allOf = [Manifest.permission.BLUETOOTH_CONNECT])
    private suspend fun testConnectionInternal(address: String): Boolean = withContext(Dispatchers.IO) {
        val adapter = getAdapter()
        prepareForConnect(adapter)
        
        val device = adapter.getRemoteDevice(address)
        Log.d(TAG, "📱 [Kotlin] Dispositivo: ${device.name} (${device.address})")
        
        // Verificar se já temos uma conexão ativa
        val existingConnection = connectionPool[address]
        if (existingConnection?.isConnected == true) {
            Log.d(TAG, "✅ [Kotlin] Conexão existente válida")
            return@withContext true
        }
        
        var socket: BluetoothSocket? = null
        try {
            socket = openSocketChain(device, timeoutMs = 5000)
            Log.d(TAG, "✅ [Kotlin] Teste de conexão bem-sucedido!")
            
            // Criar nova conexão e adicionar ao pool
            val connection = BluetoothConnection(socket, device)
            connectionPool[address] = connection
            
            return@withContext true
        } finally {
            // Não fechar o socket aqui, manter para uso futuro
        }
    }

    @RequiresPermission(allOf = [Manifest.permission.BLUETOOTH_CONNECT])
    private suspend fun printDataInternal(address: String, data: String, isCpcl: Boolean): Boolean = withContext(Dispatchers.IO) {
        val adapter = getAdapter()
        prepareForConnect(adapter)
        
        val device = adapter.getRemoteDevice(address)
        Log.d(TAG, "📱 [Kotlin] Conectando a: ${device.name} (${device.address})")
        
        // Tentar usar conexão existente
        var connection = connectionPool[address]
        
        try {
            // Se não há conexão ou está inválida, criar nova
            if (connection?.isConnected != true) {
                Log.d(TAG, "🔗 [Kotlin] Criando nova conexão...")
                val socket = openSocketChain(device, timeoutMs = 5000)
                connection = BluetoothConnection(socket, device)
                connectionPool[address] = connection
            } else {
                Log.d(TAG, "🔗 [Kotlin] Usando conexão existente")
            }

            Log.d(TAG, "📤 [Kotlin] Enviando ${data.length} caracteres (${if (isCpcl) "CPCL" else "ZPL"})")

            // Enviar dados em chunks pequenos com pausas
            val bytes = data.toByteArray(Charset.forName("US-ASCII"))
            val chunk = 128 // Chunk muito pequeno para evitar buffer overflow
            var offset = 0
            var chunkCount = 0
            
            while (offset < bytes.size) {
                val end = min(offset + chunk, bytes.size)
                val chunkData = bytes.sliceArray(offset until end)
                
                chunkCount++
                Log.d(TAG, "📦 [Kotlin] Enviando chunk $chunkCount: ${chunkData.size} bytes")
                
                connection.outputStream.write(chunkData)
                connection.outputStream.flush()
                
                offset = end
                if (offset < bytes.size) {
                    delay(100) // Pausa maior entre chunks
                }
            }

            Log.d(TAG, "✅ [Kotlin] Todos os ${chunkCount} chunks enviados com sucesso!")
            return@withContext true
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ [Kotlin] Erro durante impressão: ${e.message}")
            
            // Remover conexão problemática do pool
            connectionPool.remove(address)
            connection?.close()
            
            throw e
        }
    }

    private fun connectWithTimeout(socket: BluetoothSocket, timeoutMs: Long) {
        val latch = CountDownLatch(1)
        var error: Exception? = null
        
        val t = Thread {
            try {
                Log.d(TAG, "🔗 [Kotlin] Tentando conectar...")
                socket.connect()
                Log.d(TAG, "✅ [Kotlin] Conectado com sucesso!")
            } catch (e: Exception) {
                Log.e(TAG, "❌ [Kotlin] Erro na conexão: ${e.message}")
                error = e
            } finally {
                latch.countDown()
            }
        }
        
        t.start()
        
        if (!latch.await(timeoutMs, TimeUnit.MILLISECONDS)) {
            try { 
                socket.close() 
                Log.w(TAG, "⏰ [Kotlin] Timeout na conexão, socket fechado")
            } catch (_: Exception) {}
            throw IOException("Bluetooth connect timeout (${timeoutMs}ms)")
        }
        
        if (error != null) throw error as Exception
    }

    @RequiresPermission(allOf = [Manifest.permission.BLUETOOTH_CONNECT])
    private fun openSocketChain(device: BluetoothDevice, timeoutMs: Long): BluetoothSocket {
        val spp = UUID.fromString(SPP_UUID)
        
        val attempts = sequenceOf<(BluetoothDevice) -> BluetoothSocket>(
            { d -> 
                Log.d(TAG, "🔌 [Kotlin] Tentativa 1: Socket seguro")
                d.createRfcommSocketToServiceRecord(spp) 
            },
            { d -> 
                Log.d(TAG, "🔌 [Kotlin] Tentativa 2: Socket inseguro")
                d.createInsecureRfcommSocketToServiceRecord(spp) 
            },
            { d ->
                try {
                    Log.d(TAG, "🔌 [Kotlin] Tentativa 3: Reflection canal 1")
                    val m = d.javaClass.getMethod("createRfcommSocket", Int::class.javaPrimitiveType)
                    m.invoke(d, 1) as BluetoothSocket
                } catch (e: Exception) {
                    Log.w(TAG, "⚠️ [Kotlin] Reflection falhou: ${e.message}")
                    throw e
                }
            }
        )

        var lastEx: Exception? = null
        for ((index, factory) in attempts.withIndex()) {
            try {
                val socket = factory(device)
                connectWithTimeout(socket, timeoutMs)
                Log.d(TAG, "✅ [Kotlin] Conectado com tentativa ${index + 1}")
                return socket
            } catch (e: Exception) {
                lastEx = e
                Log.w(TAG, "⚠️ [Kotlin] Tentativa ${index + 1} falhou: ${e.message}")
            }
        }
        throw lastEx ?: IOException("Falha desconhecida abrindo socket")
    }

    // Detectar se os dados são CPCL
    private fun _detectCpcl(data: String): Boolean {
        val trimmedData = data.trim()
        
        if (trimmedData.startsWith("!")) return true
        if (trimmedData.contains("FORM")) return true
        if (trimmedData.contains("PRINT")) return true
        if (trimmedData.contains("CENTER")) return true
        if (trimmedData.contains("T 0 0 0 0")) return true
        if (trimmedData.contains("F ")) return true
        if (trimmedData.contains("B ")) return true
        
        if (trimmedData.contains("^XA")) return false
        if (trimmedData.contains("^XZ")) return false
        if (trimmedData.contains("^FO")) return false
        if (trimmedData.contains("^FD")) return false
        if (trimmedData.contains("^A")) return false
        
        Log.d(TAG, "🔍 [Kotlin] Formato não detectado claramente, assumindo CPCL")
        return true
    }

    @RequiresPermission(allOf = [Manifest.permission.BLUETOOTH_CONNECT])
    private suspend fun scanDevicesInternal(): List<Map<String, String>> = withContext(Dispatchers.IO) {
        val adapter = getAdapter()
        val bondedDevices = adapter.bondedDevices
        
        Log.d(TAG, "🔍 [Kotlin] ${bondedDevices.size} dispositivos pareados encontrados")
        
        val deviceList = mutableListOf<Map<String, String>>()
        for (device in bondedDevices) {
            Log.d(TAG, "📱 [Kotlin] Dispositivo: ${device.name} (${device.address})")
            
            val deviceInfo = mapOf(
                "name" to (device.name ?: "Dispositivo Desconhecido"),
                "address" to device.address,
                "isBonded" to "true",
                "type" to "bonded"
            )
            deviceList.add(deviceInfo)
        }
        
        Log.d(TAG, "✅ [Kotlin] Retornando ${deviceList.size} dispositivos")
        deviceList
    }

    companion object {
        private const val TAG = "GranoboxBT"
        private const val SPP_UUID = "00001101-0000-1000-8000-00805F9B34FB"
    }
}

// Classe para gerenciar conexões Bluetooth
data class BluetoothConnection(
    val socket: BluetoothSocket,
    val device: BluetoothDevice
) {
    val outputStream = socket.outputStream
    val isConnected: Boolean get() = socket.isConnected
    
    fun close() {
        try {
            socket.close()
        } catch (e: Exception) {
            Log.e("BluetoothConnection", "Erro ao fechar socket: ${e.message}")
        }
    }
}

// Classe para representar jobs de impressão
data class PrintJob(
    val address: String,
    val data: String,
    val isCpcl: Boolean,
    val result: MethodChannel.Result
)
