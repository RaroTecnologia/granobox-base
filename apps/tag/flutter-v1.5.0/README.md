# Granobox Tag - App Flutter

App mobile para impressão de etiquetas do sistema Granobox Tag, desenvolvido em Flutter.

## 🚀 Funcionalidades

- **Tela de Login**: Interface de autenticação com validação de formulários
- **Tema Adaptativo**: Suporte a tema claro e escuro
- **Validação de Formulários**: Validação em tempo real com feedback visual
- **Design Responsivo**: Interface adaptada para diferentes tamanhos de tela

## 🛠️ Tecnologias

- **Flutter**: Framework de desenvolvimento mobile
- **Dart**: Linguagem de programação
- **Provider**: Gerenciamento de estado
- **Go Router**: Navegação e roteamento
- **Phosphor Icons**: Biblioteca de ícones
- **Shared Preferences**: Armazenamento local

## 📱 Estrutura do Projeto

```
lib/
├── components/          # Componentes reutilizáveis
│   ├── form_input.dart
│   └── theme_toggle.dart
├── hooks/              # Hooks personalizados
│   └── use_form_validation.dart
├── screens/            # Telas do aplicativo
│   └── login_screen.dart
├── theme/              # Configurações de tema
│   ├── app_theme.dart
│   └── theme_provider.dart
└── main.dart           # Ponto de entrada da aplicação
```

## 🎨 Temas

O app suporta dois temas:

- **Tema Escuro**: Cores escuras com destaque verde
- **Tema Claro**: Cores claras com destaque verde

## 🔧 Configuração

### Pré-requisitos

- Flutter SDK 3.9.0 ou superior
- Dart SDK 3.9.0 ou superior
- Android Studio / VS Code com extensões Flutter

### Instalação

1. Clone o repositório
2. Navegue para a pasta do projeto:
   ```bash
   cd apps/tag/flutter
   ```

3. Instale as dependências:
   ```bash
   flutter pub get
   ```

4. Execute o projeto:
   ```bash
   flutter run
   ```

## 📋 Dependências

- `flutter`: SDK Flutter
- `go_router`: Navegação e roteamento
- `provider`: Gerenciamento de estado
- `form_validator`: Validação de formulários
- `fluttertoast`: Notificações toast
- `shared_preferences`: Armazenamento local
- `phosphor_flutter`: Ícones

## 🚀 Próximos Passos

- [ ] Implementar autenticação real
- [ ] Adicionar tela de dashboard
- [ ] Implementar funcionalidade de impressão de etiquetas
- [ ] Adicionar testes unitários e de widget
- [ ] Configurar CI/CD

## 📄 Licença

© 2025 Wdezoito Tecnologia - CNPJ 26.058.346/0001-34. Todos os direitos reservados.
