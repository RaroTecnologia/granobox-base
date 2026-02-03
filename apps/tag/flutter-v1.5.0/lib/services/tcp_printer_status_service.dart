import 'dart:io';
import 'dart:async';
import 'dart:convert';

/// Serviço simples para verificar status TCP local de uma impressora
class TcpPrinterStatusService {
  TcpPrinterStatusService._();
  static final TcpPrinterStatusService instance = TcpPrinterStatusService._();

  /// Retorna true se conseguir conectar ao host:port dentro do timeout
  /// Usa comando ZPL ~HS para verificar status real da impressora (não imprime nada)
  Future<bool> isOnline({
    required String host,
    int port = 9100,
    Duration timeout = const Duration(seconds: 2),
  }) async {
    try {
      // 1) Se host já é IP, tentar direto
      final isIp = _isIpAddress(host);
      if (isIp) {
        final ok = await _tryConnectWithStatus(host, port, timeout);
        if (ok) return true;
      } else {
        // 2) Resolver via DNS
        final resolved = await _resolveHost(host);
        for (final ip in resolved) {
          if (await _tryConnectWithStatus(ip, port, timeout)) return true;
        }
        // 3) Fallback mDNS: adicionar .local
        if (!host.endsWith('.local')) {
          final mdnsHost = '$host.local';
          final resolvedMdns = await _resolveHost(mdnsHost);
          for (final ip in resolvedMdns) {
            if (await _tryConnectWithStatus(ip, port, timeout)) return true;
          }
        }
      }
    } catch (_) {}
    return false;
  }

  /// Tenta conectar e enviar comando ZPL ~HS (Host Status) para verificar se impressora está realmente online
  /// Isso NÃO imprime nada, apenas retorna o status da impressora
  Future<bool> _tryConnectWithStatus(String ip, int port, Duration timeout) async {
    Socket? socket;
    try {
      // Conectar ao socket
      socket = await Socket.connect(ip, port, timeout: timeout);
      
      // Enviar comando ~HS (Host Status) - não imprime nada
      socket.add(utf8.encode('~HS\n'));
      await socket.flush();
      
      // Aguardar resposta (com timeout curto)
      final completer = Completer<bool>();
      String response = '';
      
      final subscription = socket.listen(
        (data) {
          response += utf8.decode(data);
          if (!completer.isCompleted) {
            // Se recebeu qualquer resposta, impressora está online
            completer.complete(true);
          }
        },
        onError: (e) {
          if (!completer.isCompleted) {
            completer.complete(false);
          }
        },
      );
      
      // Aguardar resposta com timeout
      bool result = false;
      try {
        result = await completer.future.timeout(
          Duration(milliseconds: 1500),
          onTimeout: () {
            // Se deu timeout mas conseguiu conectar, considerar online
            // (algumas impressoras não respondem ~HS mas estão funcionando)
            return true;
          },
        );
      } catch (_) {
        result = false;
      }
      
      await subscription.cancel();
      await socket.close();
      
      return result;
    } catch (_) {
      try {
        await socket?.close();
      } catch (_) {}
      return false;
    }
  }

  /// Método legado: apenas tenta conectar sem verificar status
  /// Mantido para compatibilidade, mas não é recomendado usar
  @Deprecated('Use isOnline() que verifica status real com comando ZPL')
  Future<bool> _tryConnect(String ip, int port, Duration timeout) async {
    try {
      final socket = await Socket.connect(ip, port, timeout: timeout);
      await socket.close();
      return true;
    } catch (_) {
      return false;
    }
  }

  bool _isIpAddress(String host) {
    try {
      final segments = host.split('.');
      if (segments.length != 4) return false;
      for (final s in segments) {
        final n = int.parse(s);
        if (n < 0 || n > 255) return false;
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<List<String>> _resolveHost(String host) async {
    try {
      final list = await InternetAddress.lookup(host);
      return list.where((e) => e.type == InternetAddressType.IPv4).map((e) => e.address).toList();
    } catch (_) {
      return const <String>[];
    }
  }
}


