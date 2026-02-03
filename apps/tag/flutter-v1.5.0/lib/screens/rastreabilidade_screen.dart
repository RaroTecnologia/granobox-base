import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../theme/app_theme.dart';
import '../components/standard_header.dart';
import 'main_screen.dart';
import 'recebimento_screen.dart';
import 'recebimentos_list_screen.dart';
import 'contagem_estoque_screen.dart';
import 'contagens_list_screen.dart';
import 'estoque_screen.dart';
import 'etiquetas_screen.dart';

class RastreabilidadeScreen extends StatelessWidget {
  const RastreabilidadeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      body: Column(
        children: [
          // Header padronizado
          StandardHeader(
            title: 'Rastreabilidade',
            subtitle: 'Gestão de recebimentos e estoque',
            showBack: false,
            showSearch: false,
            showHome: true,
            iconColor: AppTheme.primary,
            showLeading: true,
            leadingIcon: PhosphorIcons.tree,
            onHome: () {
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (context) => const MainScreen()),
                (route) => false,
              );
            },
          ),

          // Conteúdo
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Cards de funcionalidades
                  _buildFunctionCard(
                    context: context,
                    icon: PhosphorIcons.clock,
                    title: 'Controle de Etiquetas',
                    subtitle: 'Visualizar e gerenciar etiquetas',
                    color: AppTheme.primary,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const EtiquetasScreen(),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 16),

                  _buildFunctionCard(
                    context: context,
                    icon: PhosphorIcons.package,
                    title: 'Novo Recebimento',
                    subtitle: 'Registrar recebimento de produtos',
                    color: AppTheme.primary,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const RecebimentoScreen(),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 16),

                  _buildFunctionCard(
                    context: context,
                    icon: PhosphorIcons.list,
                    title: 'Lista de Recebimentos',
                    subtitle: 'Visualizar recebimentos registrados',
                    color: AppTheme.primary,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const RecebimentosListScreen(),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 16),

                  _buildFunctionCard(
                    context: context,
                    icon: PhosphorIcons.barcode,
                    title: 'Contagem de Estoque',
                    subtitle: 'Escanear e contar itens no estoque',
                    color: AppTheme.primary,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const ContagemEstoqueScreen(),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 16),

                  _buildFunctionCard(
                    context: context,
                    icon: PhosphorIcons.clipboardText,
                    title: 'Lista de Contagens',
                    subtitle: 'Visualizar contagens registradas',
                    color: AppTheme.primary,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const ContagensListScreen(),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 16),

                  _buildFunctionCard(
                    context: context,
                    icon: PhosphorIcons.package,
                    title: 'Estoque',
                    subtitle: 'Consultar estoque por produto',
                    color: AppTheme.primary,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const EstoqueScreen(),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFunctionCard({
    required BuildContext context,
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppTheme.dark800,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: color.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Row(
          children: [
            // Ícone
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: color,
                size: 28,
              ),
            ),
            const SizedBox(width: 16),
            // Textos
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.dark300,
                    ),
                  ),
                ],
              ),
            ),
            // Seta
            Icon(
              PhosphorIcons.arrowRight,
              color: AppTheme.dark400,
              size: 24,
            ),
          ],
        ),
      ),
    );
  }
}

