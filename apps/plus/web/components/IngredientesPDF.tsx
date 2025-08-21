import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { Ingrediente } from '@/types';

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 10,
    position: 'relative',
    minHeight: '100%',
  },
  header: {
    marginBottom: 30,
    borderBottom: '1 solid #ccc',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
    minHeight: 30,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 5,
    fontSize: 10,
  },
  col1: {
    width: '30%',
  },
  col2: {
    width: '15%',
  },
  col3: {
    width: '15%',
  },
  col4: {
    width: '20%',
  },
  col5: {
    width: '20%',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#666',
    fontSize: 10,
    borderTop: '1 solid #ccc',
    paddingTop: 10,
    backgroundColor: '#ffffff',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  footerLeft: {
    textAlign: 'left',
  },
  footerCenter: {
    textAlign: 'center',
  },
  footerRight: {
    textAlign: 'right',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 10,
    color: '#666',
  },
});

interface IngredientesPDFProps {
  ingredientes: Ingrediente[];
}

const IngredientesPDF = ({ ingredientes }: IngredientesPDFProps) => {
  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const horaAtual = new Date().toLocaleTimeString('pt-BR');
  const totalIngredientes = ingredientes.length;
  const totalValorEstoque = ingredientes.reduce((total, item) => total + (item.estoqueAtual * item.custoUnitario), 0);

  // Dividir os ingredientes em grupos de 20 para cada página
  const ingredientesPorPagina = 20;
  const paginas = [];
  for (let i = 0; i < ingredientes.length; i += ingredientesPorPagina) {
    paginas.push(ingredientes.slice(i, i + ingredientesPorPagina));
  }

  return (
    <PDFViewer style={{ width: '100%', height: '100vh' }}>
      <Document>
        {paginas.map((ingredientesPagina, index) => (
          <Page key={index} size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Lista de Ingredientes</Text>
              <Text style={styles.subtitle}>Granobox - Sistema de Gestão</Text>
              <Text style={styles.subtitle}>Gerado em: {dataAtual} às {horaAtual}</Text>
            </View>

            {/* Tabela de Ingredientes */}
            <View>
              <View style={styles.table}>
                {/* Cabeçalho da Tabela */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, styles.col1]}>Ingrediente</Text>
                  <Text style={[styles.tableCell, styles.col2]}>Estoque Atual</Text>
                  <Text style={[styles.tableCell, styles.col3]}>Estoque Mínimo</Text>
                  <Text style={[styles.tableCell, styles.col4]}>Custo Unitário</Text>
                  <Text style={[styles.tableCell, styles.col5]}>Fornecedor</Text>
                </View>
                {ingredientesPagina.map((ingrediente, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.col1]}>{ingrediente.nome}</Text>
                    <Text style={[styles.tableCell, styles.col2]}>{ingrediente.estoqueAtual} {ingrediente.unidade}</Text>
                    <Text style={[styles.tableCell, styles.col3]}>{ingrediente.estoqueMinimo} {ingrediente.unidade}</Text>
                    <Text style={[styles.tableCell, styles.col4]}>R$ {ingrediente.custoUnitario.toFixed(2)}</Text>
                    <Text style={[styles.tableCell, styles.col5]}>{ingrediente.fornecedor || '-'}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text>© 2024 Granobox - Sistema de Gestão para Panificadoras</Text>
              <View style={styles.footerContent}>
                <View style={styles.footerLeft}>
                  <Text>Total de Ingredientes: {totalIngredientes}</Text>
                  <Text>Valor Total em Estoque: R$ {totalValorEstoque.toFixed(2)}</Text>
                </View>
                <View style={styles.footerCenter}>
                  <Text>Documento Gerado Automaticamente</Text>
                  <Text>Data: {dataAtual} às {horaAtual}</Text>
                </View>
                <View style={styles.footerRight}>
                  <Text>www.granobox.com.br</Text>
                  <Text>contato@granobox.com.br</Text>
                </View>
              </View>
            </View>

            {/* Número da Página */}
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
              `${pageNumber} / ${totalPages}`
            )} />
          </Page>
        ))}
      </Document>
    </PDFViewer>
  );
};

export default IngredientesPDF; 