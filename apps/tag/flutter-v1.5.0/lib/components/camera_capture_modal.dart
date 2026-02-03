import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

/// Modal personalizado para captura de foto com câmera
/// CÓDIGO EXATO DO CADASTRO DE PRODUTO
class CameraCaptureModal extends StatefulWidget {
  final Function(File) onCapture;
  final String? instructionMessage; // Mensagem customizável

  const CameraCaptureModal({
    Key? key,
    required this.onCapture,
    this.instructionMessage,
  }) : super(key: key);

  @override
  State<CameraCaptureModal> createState() => _CameraCaptureModalState();
}

class _CameraCaptureModalState extends State<CameraCaptureModal> {
  CameraController? _cameraController;
  bool _isInitialized = false;
  bool _isCapturing = false;
  Offset? _focusIndicatorNormalized;
  bool _showFocusIndicator = false;
  Timer? _focusIndicatorTimer;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isNotEmpty) {
        _cameraController = CameraController(
          cameras.first,
          ResolutionPreset.high,
          enableAudio: false,
        );
        
        await _cameraController!.initialize();

        // Garantir que foco/exposição com ponto específico estão em modo automático
        try {
          await _cameraController!.setFocusMode(FocusMode.auto);
        } catch (_) {}
        try {
          await _cameraController!.setExposureMode(ExposureMode.auto);
        } catch (_) {}
        setState(() {
          _isInitialized = true;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao inicializar câmera: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _capturePhoto() async {
    if (_cameraController == null || _isCapturing) return;

    setState(() {
      _isCapturing = true;
    });

    try {
      final XFile image = await _cameraController!.takePicture();
      widget.onCapture(File(image.path));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao capturar foto: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isCapturing = false;
      });
    }
  }

  Widget _buildCornerGuide({
    bool topLeft = false,
    bool topRight = false,
    bool bottomLeft = false,
    bool bottomRight = false,
  }) {
    return SizedBox(
      width: 50,
      height: 50,
      child: CustomPaint(
        painter: CornerGuidePainter(
          topLeft: topLeft,
          topRight: topRight,
          bottomLeft: bottomLeft,
          bottomRight: bottomRight,
        ),
      ),
    );
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _focusIndicatorTimer?.cancel();
    super.dispose();
  }

  Future<void> _handleFocusTap(TapDownDetails details, Size areaSize) async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    final normalizedPoint = Offset(
      (details.localPosition.dx / areaSize.width).clamp(0.0, 1.0),
      (details.localPosition.dy / areaSize.height).clamp(0.0, 1.0),
    );

    try {
      await _cameraController!.setFocusMode(FocusMode.auto);
      await _cameraController!.setFocusPoint(normalizedPoint);
    } catch (e) {
      debugPrint('Erro ao ajustar foco: $e');
    }

    try {
      await _cameraController!.setExposureMode(ExposureMode.auto);
      await _cameraController!.setExposurePoint(normalizedPoint);
    } catch (e) {
      debugPrint('Erro ao ajustar foco: $e');
    }

    setState(() {
      _focusIndicatorNormalized = normalizedPoint;
      _showFocusIndicator = true;
    });

    _focusIndicatorTimer?.cancel();
    _focusIndicatorTimer = Timer(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _showFocusIndicator = false);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        leading: IconButton(
          icon: Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Capturar Foto',
          style: TextStyle(color: Colors.white),
        ),
        centerTitle: true,
      ),
      body: _isInitialized && _cameraController != null
          ? LayoutBuilder(
              builder: (context, constraints) {
                final indicatorSize = 70.0;
                final indicatorLeft = _focusIndicatorNormalized != null
                    ? (_focusIndicatorNormalized!.dx * constraints.maxWidth) - (indicatorSize / 2)
                    : null;
                final indicatorTop = _focusIndicatorNormalized != null
                    ? (_focusIndicatorNormalized!.dy * constraints.maxHeight) - (indicatorSize / 2)
                    : null;

                return GestureDetector(
                  behavior: HitTestBehavior.translucent,
                  onTapDown: (details) => _handleFocusTap(
                    details,
                    Size(constraints.maxWidth, constraints.maxHeight),
                  ),
                  child: Stack(
                    children: [
                      // Preview da câmera
                      Positioned.fill(
                        child: FittedBox(
                          fit: BoxFit.cover,
                          child: SizedBox(
                            width: _cameraController!.value.previewSize!.height,
                            height: _cameraController!.value.previewSize!.width,
                            child: CameraPreview(_cameraController!),
                          ),
                        ),
                      ),

                      // Indicador de foco
                      if (_showFocusIndicator &&
                          _focusIndicatorNormalized != null &&
                          indicatorLeft != null &&
                          indicatorTop != null)
                        Positioned(
                          left: indicatorLeft,
                          top: indicatorTop,
                          child: AnimatedOpacity(
                            duration: const Duration(milliseconds: 150),
                            opacity: _showFocusIndicator ? 1 : 0,
                            child: Container(
                              width: indicatorSize,
                              height: indicatorSize,
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.white, width: 2),
                                shape: BoxShape.circle,
                                color: Colors.white.withOpacity(0.05),
                              ),
                              child: const Center(
                                child: Icon(
                                  PhosphorIcons.target,
                                  color: Colors.white,
                                  size: 26,
                                ),
                              ),
                            ),
                          ),
                        ),

                      // Overlay com moldura e guias em L nos cantos
                      Positioned.fill(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 80),
                          child: Stack(
                            children: [
                              // Canto Superior Esquerdo
                              Positioned(
                                top: 0,
                                left: 0,
                                child: _buildCornerGuide(
                                  topLeft: true,
                                ),
                              ),
                              // Canto Superior Direito
                              Positioned(
                                top: 0,
                                right: 0,
                                child: _buildCornerGuide(
                                  topRight: true,
                                ),
                              ),
                              // Canto Inferior Esquerdo
                              Positioned(
                                bottom: 0,
                                left: 0,
                                child: _buildCornerGuide(
                                  bottomLeft: true,
                                ),
                              ),
                              // Canto Inferior Direito
                              Positioned(
                                bottom: 0,
                                right: 0,
                                child: _buildCornerGuide(
                                  bottomRight: true,
                                ),
                              ),

                              // Instruções (posição customizável)
                              Positioned(
                                top: widget.instructionMessage != null ? 20 : null,
                                left: 20,
                                right: 20,
                                child: widget.instructionMessage != null
                                    ? Container(
                                        padding: EdgeInsets.all(16),
                                        decoration: BoxDecoration(
                                          color: Colors.black.withOpacity(0.7),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Column(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              PhosphorIcons.camera,
                                              color: Colors.green,
                                              size: 32,
                                            ),
                                            SizedBox(height: 8),
                                            Text(
                                              widget.instructionMessage!,
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontSize: 16,
                                                fontWeight: FontWeight.w500,
                                              ),
                                              textAlign: TextAlign.center,
                                            ),
                                          ],
                                        ),
                                      )
                                    : SizedBox.shrink(),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            )
          : Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: Colors.green),
                  SizedBox(height: 16),
                  Text(
                    'Inicializando câmera...',
                    style: TextStyle(color: Colors.white),
                  ),
                ],
              ),
            ),
      bottomNavigationBar: Container(
        padding: EdgeInsets.all(20),
        color: Colors.black,
        child: SafeArea(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.green,
                  border: Border.all(
                    color: Colors.white,
                    width: 4,
                  ),
                ),
                child: IconButton(
                  onPressed: _isCapturing ? null : _capturePhoto,
                  icon: _isCapturing
                      ? SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Icon(
                          PhosphorIcons.camera,
                          color: Colors.white,
                          size: 32,
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Painter para desenhar os cantos em "L" da moldura
class CornerGuidePainter extends CustomPainter {
  final bool topLeft;
  final bool topRight;
  final bool bottomLeft;
  final bool bottomRight;

  CornerGuidePainter({
    this.topLeft = false,
    this.topRight = false,
    this.bottomLeft = false,
    this.bottomRight = false,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.green
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();

    if (topLeft) {
      // Linha horizontal (topo)
      path.moveTo(0, 0);
      path.lineTo(size.width, 0);
      // Linha vertical (esquerda)
      path.moveTo(0, 0);
      path.lineTo(0, size.height);
    } else if (topRight) {
      // Linha horizontal (topo)
      path.moveTo(0, 0);
      path.lineTo(size.width, 0);
      // Linha vertical (direita)
      path.moveTo(size.width, 0);
      path.lineTo(size.width, size.height);
    } else if (bottomLeft) {
      // Linha horizontal (baixo)
      path.moveTo(0, size.height);
      path.lineTo(size.width, size.height);
      // Linha vertical (esquerda)
      path.moveTo(0, 0);
      path.lineTo(0, size.height);
    } else if (bottomRight) {
      // Linha horizontal (baixo)
      path.moveTo(0, size.height);
      path.lineTo(size.width, size.height);
      // Linha vertical (direita)
      path.moveTo(size.width, 0);
      path.lineTo(size.width, size.height);
    }

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
