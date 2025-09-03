import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:permission_handler/permission_handler.dart';
import '../models/printer.dart';
import '../services/printer_manager.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _productNameController = TextEditingController();
  final _barcodeController = TextEditingController();
  final _printerNameController = TextEditingController();
  final _printerIpController = TextEditingController();
  final _printerPortController = TextEditingController();

  DateTime? _expiryDate;
  bool _useCustomFont = true;
  bool _isPrinting = false;
  bool _isTesting = false;
  bool _isConnected = false;
  bool _permissionsGranted = false;
  bool _bluetoothPermissionGranted = false;
  bool _locationPermissionGranted = false;
  bool _isScanningBluetooth = false;
  
  final PrinterManager _printerManager = PrinterManager.instance;
  List<Printer> _printers = [];
  Printer? _selectedPrinter;
  List<Map<String, dynamic>> _bluetoothDevices = [];
  
  // Nova variável para linguagem da impressora
  PrinterLanguage _selectedLanguage = PrinterLanguage.auto;

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  @override
  void dispose() {
    _productNameController.dispose();
    _barcodeController.dispose();
    _printerNameController.dispose();
    _printerIpController.dispose();
    _printerPortController.dispose();
    super.dispose();
  }

  Future<void> _initializeApp() async {
    await _requestPermissions();
    await _printerManager.initialize();
    await _loadPrinters();
    _loadPrinterConfig();
  }

  Future<void> _requestPermissions() async {
    // Permissões básicas de rede
    try {
      final result = await InternetAddress.lookup('google.com');
      if (result.isNotEmpty && result[0].rawAddress.isNotEmpty) {
        setState(() => _permissionsGranted = true);
      }
    } catch (e) {
      setState(() => _permissionsGranted = false);
    }

    // Permissões Bluetooth
    final bluetoothStatus = await Permission.bluetooth.status;
    final bluetoothConnectStatus = await Permission.bluetoothConnect.status;
    final bluetoothScanStatus = await Permission.bluetoothScan.status;
    
    setState(() {
      _bluetoothPermissionGranted = bluetoothStatus.isGranted && 
                                   bluetoothConnectStatus.isGranted && 
                                   bluetoothScanStatus.isGranted;
    });

    // Permissões de localização (necessárias para Bluetooth)
    final locationStatus = await Permission.location.status;
    setState(() => _locationPermissionGranted = locationStatus.isGranted);

    // Solicitar permissões se necessário
    if (!_bluetoothPermissionGranted) {
      await Permission.bluetooth.request();
      await Permission.bluetoothConnect.request();
      await Permission.bluetoothScan.request();
      
      final newBluetoothStatus = await Permission.bluetooth.status;
      final newBluetoothConnectStatus = await Permission.bluetoothConnect.status;
      final newBluetoothScanStatus = await Permission.bluetoothScan.status;
      
      setState(() {
        _bluetoothPermissionGranted = newBluetoothStatus.isGranted && 
                                     newBluetoothConnectStatus.isGranted && 
                                     newBluetoothScanStatus.isGranted;
      });
    }

    if (!_locationPermissionGranted) {
      await Permission.location.request();
      final newLocationStatus = await Permission.location.status;
      setState(() => _locationPermissionGranted = newLocationStatus.isGranted);
    }
  }

  Future<void> _loadPrinters() async {
    setState(() {
      _printers = _printerManager.printers;
      _selectedPrinter = _printerManager.activePrinter;
    });
  }

  void _loadPrinterConfig() {
    if (_selectedPrinter != null) {
      _printerIpController.text = _selectedPrinter!.address;
      if (_selectedPrinter!.type == PrinterType.tcp) {
        _printerPortController.text = _selectedPrinter!.port?.toString() ?? '9100';
      }
      // Carregar linguagem da impressora
      _selectedLanguage = _selectedPrinter!.language;
    }
  }

  Future<void> _scanBluetoothDevices() async {
    if (!_bluetoothPermissionGranted) {
      Fluttertoast.showToast(
        msg: 'Permissões Bluetooth necessárias!',
        toastLength: Toast.LENGTH_SHORT,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.orange,
      );
      return;
    }

    setState(() => _isScanningBluetooth = true);
    
    try {
      // Buscar apenas dispositivos já pareados (mais simples e funcional)
      final bondedDevices = await _printerManager.scanBluetoothDevices();
      
      if (bondedDevices.isEmpty) {
        Fluttertoast.showToast(
          msg: 'Nenhum dispositivo Bluetooth pareado encontrado',
          toastLength: Toast.LENGTH_SHORT,
          gravity: ToastGravity.BOTTOM,
          backgroundColor: Colors.orange,
        );
      } else {
        setState(() => _bluetoothDevices = bondedDevices);
        _showBluetoothDevicesModal(bondedDevices);
      }
    } catch (e) {
      Fluttertoast.showToast(
        msg: 'Erro ao buscar dispositivos: $e',
        toastLength: Toast.LENGTH_LONG,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.red,
      );
    } finally {
      setState(() => _isScanningBluetooth = false);
    }
  }

  void _showBluetoothDevicesModal(List<Map<String, dynamic>> devices) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Dispositivos Bluetooth Encontrados'),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('${devices.length} dispositivo(s) encontrado(s)'),
              const SizedBox(height: 16),
              ...devices.map((device) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: Icon(
                    device['isBonded'] == true ? Icons.bluetooth_connected : Icons.bluetooth_searching,
                    color: device['isBonded'] == true ? Colors.blue : Colors.orange,
                  ),
                  title: Text(device['name'] ?? 'Dispositivo Desconhecido'),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(device['address'] ?? ''),
                      Text(
                        device['isBonded'] == true ? 'Já pareado' : 'Dispositivo descoberto',
                        style: TextStyle(
                          color: device['isBonded'] == true ? Colors.green : Colors.orange,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  trailing: device['isBonded'] == true
                    ? IconButton(
                        onPressed: () => _selectBluetoothDevice(device),
                        icon: const Icon(Icons.check_circle, color: Colors.green),
                        tooltip: 'Selecionar dispositivo pareado',
                      )
                    : PopupMenuButton<String>(
                        onSelected: (pin) => _connectToBluetoothDevice(device, pin),
                        itemBuilder: (context) => [
                          const PopupMenuItem(
                            value: '0000',
                            child: Text('Conectar com PIN: 0000'),
                          ),
                          const PopupMenuItem(
                            value: '1234',
                            child: Text('Conectar com PIN: 1234'),
                          ),
                          const PopupMenuItem(
                            value: '1111',
                            child: Text('Conectar com PIN: 1111'),
                          ),
                          const PopupMenuItem(
                            value: '8888',
                            child: Text('Conectar com PIN: 8888'),
                          ),
                        ],
                        child: const Icon(Icons.more_vert, color: Colors.blue),
                        tooltip: 'Conectar com PIN',
                      ),
                ),
              )).toList(),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Fechar'),
          ),
        ],
      ),
    );
  }

  Future<void> _connectToBluetoothDevice(Map<String, dynamic> device, String pin) async {
    Navigator.of(context).pop(); // Fechar modal
    
    Fluttertoast.showToast(
      msg: 'Conectando a ${device['name']} com PIN: $pin...',
      toastLength: Toast.LENGTH_LONG,
      gravity: ToastGravity.BOTTOM,
      backgroundColor: Colors.blue,
    );
    
    try {
      final connected = await _printerManager.connectToBluetoothDevice(
        device['address'],
        pin: pin,
      );
      
      if (connected) {
        Fluttertoast.showToast(
          msg: 'Conectado com sucesso!',
          toastLength: Toast.LENGTH_SHORT,
          gravity: ToastGravity.BOTTOM,
          backgroundColor: Colors.green,
        );
        
        // Adicionar como nova impressora
        final printer = _printerManager.createBluetoothPrinter(
          device['name'] ?? 'Impressora Bluetooth',
          device['address'],
        );
        
        await _printerManager.addPrinter(printer);
        await _loadPrinters();
        
        // Selecionar a nova impressora
        setState(() => _selectedPrinter = printer);
        _loadPrinterConfig();
        
      } else {
        Fluttertoast.showToast(
          msg: 'Falha na conexão. Tente outro PIN.',
          toastLength: Toast.LENGTH_LONG,
          gravity: ToastGravity.BOTTOM,
          backgroundColor: Colors.red,
        );
      }
    } catch (e) {
      Fluttertoast.showToast(
        msg: 'Erro na conexão: $e',
        toastLength: Toast.LENGTH_LONG,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.red,
      );
    }
  }

  Future<void> _savePrinterConfig() async {
    if (_printerNameController.text.isEmpty) {
      Fluttertoast.showToast(
        msg: 'Nome da impressora é obrigatório!',
        toastLength: Toast.LENGTH_SHORT,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.red,
      );
      return;
    }

    try {
      Printer printer;
      
      if (_printerIpController.text.contains('.')) {
        // É um IP (TCP)
        final port = int.tryParse(_printerPortController.text) ?? 9100;
        printer = _printerManager.createTcpPrinter(
          _printerNameController.text,
          _printerIpController.text,
          port,
        );
      } else {
        // É um MAC (Bluetooth)
        printer = _printerManager.createBluetoothPrinter(
          _printerNameController.text,
          _printerIpController.text,
        );
      }

      await _printerManager.addPrinter(printer);
      await _loadPrinters();
      
      Fluttertoast.showToast(
        msg: 'Impressora salva com sucesso!',
        toastLength: Toast.LENGTH_SHORT,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.green,
      );
      
      // Limpar campos
      _printerNameController.clear();
      _printerIpController.clear();
      _printerPortController.clear();
      
    } catch (e) {
      Fluttertoast.showToast(
        msg: 'Erro ao salvar impressora: $e',
        toastLength: Toast.LENGTH_LONG,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.red,
      );
    }
  }

  Future<void> _checkConnection() async {
    if (_selectedPrinter == null) {
      Fluttertoast.showToast(
        msg: 'Selecione uma impressora primeiro!',
        toastLength: Toast.LENGTH_SHORT,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.orange,
      );
      return;
    }

    setState(() => _isTesting = true);
    
    try {
      bool connected = false;
      
      switch (_selectedPrinter!.type) {
        case PrinterType.tcp:
          connected = await _printerManager.testTcpConnection(
            _selectedPrinter!.address,
            _selectedPrinter!.port ?? 9100,
          );
          break;
        case PrinterType.bluetooth:
          connected = await _printerManager.testBluetoothConnection(
            _selectedPrinter!.address,
          );
          break;
      }
      
      if (connected) {
        Fluttertoast.showToast(
          msg: 'Conectado com sucesso!',
          toastLength: Toast.LENGTH_SHORT,
          gravity: ToastGravity.BOTTOM,
          backgroundColor: Colors.green,
        );
        
        // Recarregar impressoras para atualizar o status
        await _loadPrinters();
      } else {
        Fluttertoast.showToast(
          msg: 'Falha na conexão',
          toastLength: Toast.LENGTH_SHORT,
          gravity: ToastGravity.BOTTOM,
          backgroundColor: Colors.red,
        );
      }
    } catch (e) {
      Fluttertoast.showToast(
        msg: 'Erro ao testar conexão: ${e.toString()}',
        toastLength: Toast.LENGTH_LONG,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.red,
      );
    } finally {
      setState(() => _isTesting = false);
    }
  }

  Future<void> _selectExpiryDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    
    if (date != null) {
      setState(() => _expiryDate = date);
    }
  }

  Future<void> _printLabel() async {
    if (_selectedPrinter == null) {
      Fluttertoast.showToast(
        msg: 'Selecione uma impressora primeiro!',
        toastLength: Toast.LENGTH_SHORT,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.orange,
      );
      return;
    }

    // Verificar se a impressora está conectada
    if (_selectedPrinter!.connectionStatus != ConnectionStatus.connected) {
      Fluttertoast.showToast(
        msg: 'Impressora não está conectada. Teste a conexão primeiro!',
        toastLength: Toast.LENGTH_LONG,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.orange,
      );
      return;
    }

    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isPrinting = true);
    
    try {
      final zpl = _generateZPL();
      print('🖨️ [Flutter] ZPL gerado: $zpl');
      
      final success = await _printerManager.print(zpl);
      
      if (success) {
        Fluttertoast.showToast(
          msg: 'Etiqueta impressa com sucesso!',
          toastLength: Toast.LENGTH_SHORT,
          gravity: ToastGravity.BOTTOM,
          backgroundColor: Colors.green,
        );
        
        // Limpar campos após impressão bem-sucedida
        _productNameController.clear();
        _barcodeController.clear();
        setState(() => _expiryDate = null);
      } else {
        Fluttertoast.showToast(
          msg: 'Falha na impressão',
          toastLength: Toast.LENGTH_SHORT,
          gravity: ToastGravity.BOTTOM,
          backgroundColor: Colors.red,
        );
      }
    } catch (e) {
      Fluttertoast.showToast(
        msg: 'Erro na impressão: ${e.toString()}',
        toastLength: Toast.LENGTH_LONG,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.red,
      );
    } finally {
      setState(() => _isPrinting = false);
    }
  }

  Future<void> _printTestLabel() async {
    if (_selectedPrinter == null) {
      Fluttertoast.showToast(
        msg: 'Selecione uma impressora primeiro!',
        toastLength: Toast.LENGTH_SHORT,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.orange,
      );
      return;
    }

    // Verificar se a impressora está conectada
    if (_selectedPrinter!.connectionStatus != ConnectionStatus.connected) {
      Fluttertoast.showToast(
        msg: 'Impressora não está conectada. Teste a conexão primeiro!',
        toastLength: Toast.LENGTH_LONG,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.orange,
      );
      return;
    }

    setState(() => _isPrinting = true);
    
    try {
      final zpl = _generateTestZPL();
      print('🧪 [Flutter] ZPL de teste gerado: $zpl');
      
      final success = await _printerManager.print(zpl);
      
      if (success) {
        Fluttertoast.showToast(
          msg: 'Etiqueta de teste impressa com sucesso!',
          toastLength: Toast.LENGTH_SHORT,
          gravity: ToastGravity.BOTTOM,
          backgroundColor: Colors.green,
        );
      } else {
        Fluttertoast.showToast(
          msg: 'Falha na impressão de teste',
          toastLength: Toast.LENGTH_SHORT,
          gravity: ToastGravity.BOTTOM,
          backgroundColor: Colors.red,
        );
      }
    } catch (e) {
      Fluttertoast.showToast(
        msg: 'Erro na impressão de teste: ${e.toString()}',
        toastLength: Toast.LENGTH_LONG,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.red,
      );
    } finally {
      setState(() => _isPrinting = false);
    }
  }

  Future<void> _setDefaultPrinter(String id) async {
    await _printerManager.setDefaultPrinter(id);
    await _loadPrinters();
    
    Fluttertoast.showToast(
      msg: 'Impressora definida como padrão!',
      toastLength: Toast.LENGTH_SHORT,
      gravity: ToastGravity.BOTTOM,
      backgroundColor: Colors.green,
    );
  }

  Future<void> _removePrinter(String id) async {
    await _printerManager.removePrinter(id);
    await _loadPrinters();
    
    Fluttertoast.showToast(
      msg: 'Impressora removida!',
      toastLength: Toast.LENGTH_SHORT,
      gravity: ToastGravity.BOTTOM,
      backgroundColor: Colors.green,
    );
  }

  Future<void> _selectBluetoothDevice(Map<String, dynamic> device) async {
    Navigator.of(context).pop(); // Fechar modal
    
    Fluttertoast.showToast(
      msg: 'Adicionando impressora Bluetooth...',
      toastLength: Toast.LENGTH_SHORT,
      gravity: ToastGravity.BOTTOM,
      backgroundColor: Colors.blue,
    );
    
    try {
      // Criar e adicionar a impressora automaticamente
      final printer = _printerManager.createBluetoothPrinter(
        device['name'] ?? 'Impressora Bluetooth',
        device['address'],
      );
      
      await _printerManager.addPrinter(printer);
      await _loadPrinters();
      
      // Selecionar a nova impressora
      setState(() => _selectedPrinter = printer);
      _loadPrinterConfig();
      
      Fluttertoast.showToast(
        msg: 'Impressora Bluetooth adicionada com sucesso!',
        toastLength: Toast.LENGTH_SHORT,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.green,
      );
      
    } catch (e) {
      Fluttertoast.showToast(
        msg: 'Erro ao adicionar impressora: $e',
        toastLength: Toast.LENGTH_LONG,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.red,
      );
    }
  }

  String _generateZPL() {
    final productName = _productNameController.text;
    final barcode = _barcodeController.text;
    final expiryDate = _expiryDate;
    
    String zpl = '^XA';
    
    // Fonte customizada se habilitada
    if (_useCustomFont) {
      zpl += '^CWZ,E:MANROPE.TTF^CI28^FS';
    }
    
    // Cabeçalho
    zpl += '^FO50,50^A0N,50,50^FDGRANOBOX TAG^FS';
    zpl += '^FO50,120^A0N,40,40^FD$productName^FS';
    
    // Código de barras
    if (barcode.isNotEmpty) {
      zpl += '^FO50,180^BY3^BCN,100,Y,N,N^FD$barcode^FS';
    }
    
    // Data de validade
    if (expiryDate != null) {
      final dateStr = '${expiryDate.day.toString().padLeft(2, '0')}/${expiryDate.month.toString().padLeft(2, '0')}/${expiryDate.year}';
      zpl += '^FO50,300^A0N,30,30^FDValidade: $dateStr^FS';
    }
    
    // Rodapé
    zpl += '^FO50,350^A0N,25,25^FDImpresso em: ${DateTime.now().day.toString().padLeft(2, '0')}/${DateTime.now().month.toString().padLeft(2, '0')}/${DateTime.now().year}^FS';
    
    zpl += '^XZ';
    return zpl;
  }

  String _generateTestZPL() {
    String zpl = '^XA';
    
    if (_useCustomFont) {
      zpl += '^CWZ,E:MANROPE.TTF^CI28^FS';
    }
    
    zpl += '^FO50,50^A0N,50,50^FDGRANOBOX TAG^FS';
    zpl += '^FO50,120^A0N,40,40^FDTeste de Impressão^FS';
    zpl += '^FO50,180^A0N,30,30^FDData: ${DateTime.now().day.toString().padLeft(2, '0')}/${DateTime.now().month.toString().padLeft(2, '0')}/${DateTime.now().year}^FS';
    zpl += '^FO50,220^A0N,30,30^FDHora: ${DateTime.now().hour.toString().padLeft(2, '0')}:${DateTime.now().minute.toString().padLeft(2, '0')}^FS';
    zpl += '^XZ';
    
    return zpl;
  }

  Color _getPrinterStatusColor(ConnectionStatus status) {
    switch (status) {
      case ConnectionStatus.connected:
        return Colors.green;
      case ConnectionStatus.disconnected:
        return Colors.red;
      case ConnectionStatus.connecting:
        return Colors.orange;
      case ConnectionStatus.error:
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getPrinterStatusIcon(ConnectionStatus status) {
    switch (status) {
      case ConnectionStatus.connected:
        return Icons.check_circle;
      case ConnectionStatus.disconnected:
        return Icons.error;
      case ConnectionStatus.connecting:
        return Icons.hourglass_empty;
      case ConnectionStatus.error:
        return Icons.error;
      default:
        return Icons.info;
    }
  }

  String _getPrinterStatusText(ConnectionStatus status) {
    switch (status) {
      case ConnectionStatus.connected:
        return 'Conectado';
      case ConnectionStatus.disconnected:
        return 'Desconectado';
      case ConnectionStatus.connecting:
        return 'Conectando...';
      case ConnectionStatus.error:
        return 'Erro de conexão';
      default:
        return 'Desconhecido';
    }
  }

  String _getPrinterLanguageText(PrinterLanguage language) {
    switch (language) {
      case PrinterLanguage.zpl:
        return 'ZPL';
      case PrinterLanguage.cpcl:
        return 'CPCL';
      case PrinterLanguage.auto:
        return 'Auto';
      default:
        return 'Desconhecido';
    }
  }

  Color _getPrinterLanguageColor(PrinterLanguage language) {
    switch (language) {
      case PrinterLanguage.zpl:
        return Colors.blue;
      case PrinterLanguage.cpcl:
        return Colors.green;
      case PrinterLanguage.auto:
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  void _selectPrinter(Printer printer) {
    setState(() => _selectedPrinter = printer);
    _loadPrinterConfig();
  }

  Future<void> _deletePrinter(String id) async {
    await _printerManager.removePrinter(id);
    await _loadPrinters();
    Fluttertoast.showToast(
      msg: 'Impressora removida!',
      toastLength: Toast.LENGTH_SHORT,
      gravity: ToastGravity.BOTTOM,
      backgroundColor: Colors.green,
    );
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day.toString().padLeft(2, '0')}/${dateTime.month.toString().padLeft(2, '0')}/${dateTime.year} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}:${dateTime.second.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Granobox Tag'),
        actions: [
          Icon(
            _permissionsGranted ? Icons.security : Icons.security_outlined,
            color: _permissionsGranted ? Colors.green : Colors.orange,
          ),
          const SizedBox(width: 8),
          Icon(
            _bluetoothPermissionGranted ? Icons.bluetooth : Icons.bluetooth_disabled,
            color: _bluetoothPermissionGranted ? Colors.blue : Colors.grey,
          ),
          const SizedBox(width: 8),
          Icon(
            _isConnected ? Icons.wifi : Icons.wifi_off,
            color: _isConnected ? Colors.green : Colors.red,
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Status das Permissões
              if (!_permissionsGranted || !_bluetoothPermissionGranted || !_locationPermissionGranted)
                Card(
                  color: Colors.orange.shade900,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.warning,
                              color: Colors.white,
                              size: 32,
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Text(
                                'Permissões Necessárias',
                                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            ElevatedButton(
                              onPressed: _requestPermissions,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: Colors.orange.shade900,
                              ),
                              child: const Text('Conceder'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        if (!_permissionsGranted)
                          Text(
                            '• Permissões de rede para impressão TCP',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white,
                            ),
                          ),
                        if (!_bluetoothPermissionGranted)
                          Text(
                            '• Permissões Bluetooth para impressoras Bluetooth',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white,
                            ),
                          ),
                        if (!_locationPermissionGranted)
                          Text(
                            '• Permissões de localização para Bluetooth',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              
              if (!_permissionsGranted || !_bluetoothPermissionGranted || !_locationPermissionGranted) 
                const SizedBox(height: 16),
              
              // Impressoras Cadastradas
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Impressoras Cadastradas',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 16),
                      if (_printers.isEmpty)
                        const Text('Nenhuma impressora cadastrada')
                      else
                        Text('${_printers.length} impressora(s)'),
                      const SizedBox(height: 16),
                      ..._printers.map((printer) => Card(
                        color: _getPrinterStatusColor(printer.connectionStatus),
                        child: ListTile(
                          leading: Icon(
                            _getPrinterStatusIcon(printer.connectionStatus),
                            color: Colors.white,
                          ),
                          title: Text(
                            printer.name,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                printer.type == PrinterType.tcp 
                                  ? 'TCP: ${printer.address}:${printer.port ?? 9100}'
                                  : 'Bluetooth: ${printer.address}',
                                style: const TextStyle(color: Colors.white70),
                              ),
                              Text(
                                _getPrinterStatusText(printer.connectionStatus),
                                style: const TextStyle(color: Colors.white70, fontSize: 12),
                              ),
                              // Mostrar linguagem da impressora
                              Container(
                                margin: const EdgeInsets.only(top: 4),
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: _getPrinterLanguageColor(printer.language),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  'Linguagem: ${_getPrinterLanguageText(printer.language)}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (printer.isDefault)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    'PADRÃO',
                                    style: TextStyle(
                                      color: _getPrinterStatusColor(printer.connectionStatus),
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              const SizedBox(width: 8),
                              IconButton(
                                onPressed: () => _deletePrinter(printer.id),
                                icon: const Icon(Icons.delete, color: Colors.white),
                                tooltip: 'Excluir impressora',
                              ),
                            ],
                          ),
                          onTap: () => _selectPrinter(printer),
                        ),
                      )).toList(),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Adicionar Nova Impressora
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Adicionar Nova Impressora',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _printerNameController,
                        decoration: const InputDecoration(
                          labelText: 'Nome da Impressora',
                          hintText: 'Ex: Impressora Recepção',
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _printerIpController,
                              decoration: const InputDecoration(
                                labelText: 'IP ou MAC',
                                hintText: '192.168.1.100 ou 00:11:22:33:44:55',
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: TextFormField(
                              controller: _printerPortController,
                              decoration: const InputDecoration(
                                labelText: 'Porta (TCP)',
                                hintText: '9100',
                              ),
                              keyboardType: TextInputType.number,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _savePrinterConfig,
                              icon: const Icon(Icons.add),
                              label: const Text('Adicionar Impressora'),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _isTesting ? null : _checkConnection,
                              icon: _isTesting 
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Icon(Icons.wifi),
                              label: Text(_isTesting ? 'Testando...' : 'Testar Conexão'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _isScanningBluetooth ? null : _scanBluetoothDevices,
                        icon: _isScanningBluetooth 
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.bluetooth_searching),
                        label: Text(_isScanningBluetooth ? 'Buscando...' : 'Buscar Dispositivos Pareados'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () async {
                          print('🧪 [TESTE] Testando plugin diretamente...');
                          try {
                            final result = await _printerManager.scanBluetoothDevices();
                            print('🧪 [TESTE] Resultado: $result');
                            
                            Fluttertoast.showToast(
                              msg: 'Plugin testado! Verifique os logs',
                              toastLength: Toast.LENGTH_LONG,
                              gravity: ToastGravity.BOTTOM,
                              backgroundColor: Colors.blue,
                            );
                          } catch (e) {
                            print('🧪 [TESTE] Erro: $e');
                            Fluttertoast.showToast(
                              msg: 'Erro no teste: $e',
                              toastLength: Toast.LENGTH_LONG,
                              gravity: ToastGravity.BOTTOM,
                              backgroundColor: Colors.red,
                            );
                          }
                        },
                        icon: const Icon(Icons.bug_report),
                        label: const Text('🧪 Testar Plugin Bluetooth'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.orange,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Status da Conexão
              if (_selectedPrinter != null)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Icon(
                          _getPrinterStatusIcon(_selectedPrinter!.connectionStatus),
                          color: _getPrinterStatusColor(_selectedPrinter!.connectionStatus),
                          size: 32,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _getPrinterStatusText(_selectedPrinter!.connectionStatus),
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              Text(
                                _selectedPrinter!.connectionStatus == ConnectionStatus.connected
                                  ? '${_selectedPrinter!.name} online'
                                  : _selectedPrinter!.lastError != null
                                    ? 'Erro: ${_selectedPrinter!.lastError}'
                                    : 'Verifique a conexão com ${_selectedPrinter!.name}',
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                              // Mostrar linguagem da impressora selecionada
                              Container(
                                margin: const EdgeInsets.only(top: 8),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: _getPrinterLanguageColor(_selectedPrinter!.language),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  'Linguagem: ${_getPrinterLanguageText(_selectedPrinter!.language)} (${_selectedPrinter!.type == PrinterType.tcp ? 'ZPL' : 'CPCL'})',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              if (_selectedPrinter!.lastConnectedAt != null)
                                Text(
                                  'Última conexão: ${_formatDateTime(_selectedPrinter!.lastConnectedAt!)}',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Colors.grey,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        if (_selectedPrinter!.connectionStatus == ConnectionStatus.disconnected ||
                            _selectedPrinter!.connectionStatus == ConnectionStatus.error)
                          ElevatedButton.icon(
                            onPressed: _isTesting ? null : _checkConnection,
                            icon: _isTesting 
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.refresh),
                            label: Text(_isTesting ? 'Testando...' : 'Testar Conexão'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue,
                              foregroundColor: Colors.white,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              
              if (_selectedPrinter != null) const SizedBox(height: 16),
              
              // Dados da Etiqueta
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Dados da Etiqueta',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _productNameController,
                        decoration: const InputDecoration(
                          labelText: 'Nome do Produto',
                          hintText: 'Ex: Arroz Integral',
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Nome do produto é obrigatório';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _barcodeController,
                        decoration: const InputDecoration(
                          labelText: 'Código de Barras',
                          hintText: '7891234567890',
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _selectExpiryDate,
                              icon: const Icon(Icons.calendar_today),
                              label: Text(_expiryDate == null 
                                ? 'Selecionar Data' 
                                : 'Data: ${_expiryDate!.day.toString().padLeft(2, '0')}/${_expiryDate!.month.toString().padLeft(2, '0')}/${_expiryDate!.year}'
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _isPrinting || _selectedPrinter == null ? null : _printTestLabel,
                              icon: _isPrinting 
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Icon(Icons.print),
                              label: Text(_isPrinting ? 'Imprimindo...' : 'Imprimir Teste'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Checkbox(
                            value: _useCustomFont,
                            onChanged: (value) {
                              setState(() => _useCustomFont = value ?? true);
                            },
                          ),
                          const Text('Usar fonte Manrope (mesma do Granobox Tag)'),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Preview da Etiqueta
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Preview da Etiqueta',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 16),
                      Container(
                        width: double.infinity,
                        height: 200,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'GRANOBOX TAG',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _productNameController.text.isEmpty 
                                  ? 'Nome do Produto' 
                                  : _productNameController.text,
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.black,
                                ),
                              ),
                              if (_barcodeController.text.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Container(
                                  height: 40,
                                  width: double.infinity,
                                  decoration: BoxDecoration(
                                    color: Colors.black,
                                    borderRadius: BorderRadius.circular(4),
                                    ),
                                  child: Center(
                                    child: Text(
                                      _barcodeController.text,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                              if (_expiryDate != null) ...[
                                const SizedBox(height: 8),
                                Text(
                                  'Validade: ${_expiryDate!.day.toString().padLeft(2, '0')}/${_expiryDate!.month.toString().padLeft(2, '0')}/${_expiryDate!.year}',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.black,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Botão Principal de Impressão
              ElevatedButton.icon(
                onPressed: _isPrinting || _selectedPrinter == null ? null : _printLabel,
                icon: _isPrinting 
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.print, size: 24),
                label: Text(
                  _isPrinting 
                    ? 'Imprimindo...' 
                    : _selectedPrinter == null 
                      ? 'Selecione uma Impressora' 
                      : 'Imprimir Etiqueta',
                ),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
