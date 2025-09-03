# 🔤 Fontes Customizadas para Etiquetas ZPL

## 📋 **Visão Geral**

Este diretório contém fontes TTF que podem ser usadas nas etiquetas ZPL para manter a identidade visual do Granobox Tag.

## 🎯 **Fontes Disponíveis**

### **Manrope (Recomendada)**
- **Arquivo**: `MANROPE.TTF`
- **Estilo**: Moderna, legível, mesma do Granobox Tag
- **Uso**: Títulos e textos principais
- **Compatibilidade**: ZPL 203 DPI

### **Como Usar**

#### **1. Na Interface Web:**
- ✅ Marcar checkbox "Usar fonte Manrope"
- ✅ Clicar em "Imprimir Etiqueta 6x6"
- ✅ A fonte será aplicada automaticamente

#### **2. Via API:**
```json
{
  "ip": "192.168.1.100",
  "port": 9100,
  "zpl": "^XA^FO0,0^FDTexto^FS^XZ",
  "useCustomFont": true
}
```

## 🔧 **Implementação Técnica**

### **Comandos ZPL Adicionados:**
```
^XA^CWZ,E:MANROPE.TTF^CI28^FS
```

- **`^CWZ,E:MANROPE.TTF`**: Define fonte customizada
- **`^CI28`**: Define encoding UTF-8
- **`^FS`**: Finaliza comando

### **Localização da Fonte:**
- **Desenvolvimento**: `fonts/MANROPE.TTF`
- **Produção**: `Contents/Resources/fonts/MANROPE.TTF`

## 📱 **Compatibilidade**

### **Impressoras Suportadas:**
- ✅ Zebra ZD220, ZD230
- ✅ Zebra ZD410, ZD420
- ✅ Zebra ZD500, ZD600
- ✅ Outras com suporte a fontes TTF

### **Resoluções:**
- ✅ 203 DPI (padrão)
- ✅ 300 DPI
- ✅ 600 DPI

## 🚀 **Próximas Melhorias**

- [ ] **Mais fontes**: Roboto, Inter, Open Sans
- [ ] **Estilos**: Bold, Italic, Condensed
- [ ] **Tamanhos**: Variáveis e responsivos
- [ ] **Fallbacks**: Fontes alternativas

## 📞 **Suporte**

Para problemas com fontes:
- Verificar se a impressora suporta TTF
- Confirmar encoding UTF-8
- Testar com fonte padrão primeiro

---

**🎨 Agora suas etiquetas terão a mesma identidade visual do Granobox Tag!**
