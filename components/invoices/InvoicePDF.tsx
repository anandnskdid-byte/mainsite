import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register font if needed (optional)
// Font.register({
//   family: 'Your-Font',
//   src: '/path/to/font.ttf',
// });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#111827',
    fontWeight: 'medium',
  },
  table: {
    width: '100%',
    marginTop: 20,
    border: '1px solid #e5e7eb',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    padding: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    padding: 12,
  },
  tableCol: {
    flex: 1,
  },
  tableColSmall: {
    width: '15%',
  },
  tableCell: {
    fontSize: 12,
    color: '#111827',
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '30%',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  grandTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #e5e7eb',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 10,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
});

interface Product {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface InvoicePDFProps {
  order: {
    id: string;
    products: Product[];
    totalAmount: number;
    status: string;
    createdAt: number;
    address: string;
    paymentMethod: string;
    phone: string;
    customerName: string;
  };
  sellerInfo?: {
    name: string;
    address: string;
    email: string;
    phone: string;
    gstin?: string;
  };
}

export const InvoicePDF = ({ order, sellerInfo = {
  name: 'Shri Karni E-Store',
  address: '123 Business Street, City, State, 123456',
  email: 'contact@shrikarni.com',
  phone: '+91 98765 43210',
  gstin: '22AAAAA0000A1Z5'
} }: InvoicePDFProps) => {
  const invoiceDate = new Date(order.createdAt);
  const dueDate = new Date(order.createdAt);
  dueDate.setDate(dueDate.getDate() + 7);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={styles.subtitle}>#{order.id}</Text>
        </View>

        {/* Seller and Customer Info */}
        <View style={[styles.row, { marginBottom: 30 }]}>
          <View style={[styles.col, { marginRight: 20 }]}>
            <Text style={styles.label}>From</Text>
            <Text style={[styles.value, { marginBottom: 10 }]}>{sellerInfo.name}</Text>
            <Text style={styles.value}>{sellerInfo.address}</Text>
            <Text style={styles.value}>{sellerInfo.email}</Text>
            <Text style={styles.value}>{sellerInfo.phone}</Text>
            {sellerInfo.gstin && (
              <Text style={[styles.value, { marginTop: 5 }]}>GSTIN: {sellerInfo.gstin}</Text>
            )}
          </View>
          
          <View style={styles.col}>
            <Text style={styles.label}>Bill To</Text>
            <Text style={[styles.value, { marginBottom: 10 }]}>{order.customerName}</Text>
            <Text style={styles.value}>{order.address}</Text>
            <Text style={styles.value}>{order.phone}</Text>
            
            <View style={{ marginTop: 10 }}>
              <View style={styles.row}>
                <Text style={[styles.label, { marginRight: 10 }]}>Invoice Date:</Text>
                <Text style={styles.value}>{format(invoiceDate, 'MMM dd, yyyy')}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { marginRight: 10 }]}>Due Date:</Text>
                <Text style={styles.value}>{format(dueDate, 'MMM dd, yyyy')}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { marginRight: 10 }]}>Status:</Text>
                <Text style={[styles.value, { 
                  color: order.status === 'completed' ? '#10B981' : 
                         order.status === 'processing' ? '#F59E0B' : '#EF4444' 
                }]}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Products Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.tableCol, { flex: 3 }]}>
              <Text style={styles.tableHeaderCell}>Item</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColSmall]}>
              <Text style={[styles.tableHeaderCell, { textAlign: 'right' }]}>Price</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColSmall]}>
              <Text style={[styles.tableHeaderCell, { textAlign: 'center' }]}>Qty</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColSmall]}>
              <Text style={[styles.tableHeaderCell, { textAlign: 'right' }]}>Total</Text>
            </View>
          </View>

          {/* Table Rows */}
          {order.products.map((product, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCol, { flex: 3 }]}>
                <Text style={styles.tableCell}>{product.name}</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColSmall]}>
                <Text style={[styles.tableCell, { textAlign: 'right' }]}>
                  ₹{product.price.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.tableCol, styles.tableColSmall]}>
                <Text style={[styles.tableCell, { textAlign: 'center' }]}>
                  {product.quantity}
                </Text>
              </View>
              <View style={[styles.tableCol, styles.tableColSmall]}>
                <Text style={[styles.tableCell, { textAlign: 'right' }]}>
                  ₹{(product.price * product.quantity).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>₹{order.totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Shipping:</Text>
            <Text style={styles.totalValue}>₹0.00</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (0%):</Text>
            <Text style={styles.totalValue}>₹0.00</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 10 }]}>
            <Text style={styles.grandTotal}>Total:</Text>
            <Text style={styles.grandTotal}>₹{order.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text>If you have any questions about this invoice, please contact {sellerInfo.email}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
