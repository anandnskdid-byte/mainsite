'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import { Order } from '@/app/customer/orders/[id]/page';

interface DownloadInvoiceButtonProps {
  order: Order;
  className?: string;
}

export function DownloadInvoiceButton({ order, className = '' }: DownloadInvoiceButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <PDFDownloadLink
      document={<InvoicePDF order={order} />}
      fileName={`invoice-${order.id}.pdf`}
      onClick={() => setIsGenerating(true)}
    >
      {({ loading }) => (
        <Button
          variant="outline"
          className={className}
          disabled={loading || isGenerating}
        >
          {(loading || isGenerating) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download Invoice
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
