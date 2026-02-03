import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/connectivity_provider.dart';
import '../theme/app_theme.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

class ConnectivityStatusWidget extends StatelessWidget {
  const ConnectivityStatusWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<ConnectivityProvider>(
      builder: (context, connectivityProvider, child) {
        if (!connectivityProvider.showDisconnectedBanner) {
          return const SizedBox.shrink(); // Não mostrar nada se conectado ou ainda não passou 10s
        }

        return Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          decoration: BoxDecoration(
            color: AppTheme.primary, // Verde da aplicação
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: SafeArea(
            bottom: false,
            child: Row(
              children: [
                Icon(
                  PhosphorIcons.wifiSlash,
                  color: Colors.white,
                  size: 24,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    'Sem conexão com a internet',
                    style: TextStyle(
                      fontFamily: 'Manrope',
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 18,
                      decoration: TextDecoration.none,
                    ),
                  ),
                ),
                TextButton(
                  onPressed: () async {
                    await connectivityProvider.checkConnectivity();
                  },
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    backgroundColor: Colors.white,
                    foregroundColor: AppTheme.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(22),
                    ),
                    splashFactory: NoSplash.splashFactory,
                    overlayColor: Colors.transparent,
                  ),
                  child: Text(
                    'Tentar',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                      decoration: TextDecoration.none,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class ConnectivityBanner extends StatelessWidget {
  final Widget child;
  
  const ConnectivityBanner({
    Key? key,
    required this.child,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const ConnectivityStatusWidget(),
        Expanded(child: child),
      ],
    );
  }
}

class ConnectivityOverlay extends StatelessWidget {
  final Widget child;
  
  const ConnectivityOverlay({
    Key? key,
    required this.child,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<ConnectivityProvider>(
      builder: (context, connectivityProvider, _) {
        return Stack(
          children: [
            child,
            if (connectivityProvider.showDisconnectedBanner)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.primary,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    bottom: false,
                    child: Row(
                      children: [
                        Icon(
                          PhosphorIcons.wifiSlash,
                          color: Colors.white,
                          size: 24,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Text(
                            'Sem conexão com a internet',
                            style: TextStyle(
                              fontFamily: 'Manrope',
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                              fontSize: 18,
                              decoration: TextDecoration.none,
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: () async {
                            await connectivityProvider.checkConnectivity();
                          },
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                            backgroundColor: Colors.white,
                            foregroundColor: AppTheme.primary,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(22),
                            ),
                            splashFactory: NoSplash.splashFactory,
                            overlayColor: Colors.transparent,
                          ),
                          child: Text(
                            'Tentar',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                              decoration: TextDecoration.none,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

