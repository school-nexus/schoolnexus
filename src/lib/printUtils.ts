import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PrintOptions {
  elementId: string
  filename?: string
  paperSize?: 'A4' | 'A5' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  quality?: number
  scale?: number
  format?: 'print' | 'pdf'
}

export interface PaperDimensions {
  width: number
  height: number
}

export class PrintService {
  private static getPaperDimensions(paperSize: string, orientation: string): PaperDimensions {
    const dimensions: Record<string, PaperDimensions> = {
      'A4-portrait': { width: 210, height: 297 },
      'A4-landscape': { width: 297, height: 210 },
      'A5-portrait': { width: 148, height: 210 },
      'A5-landscape': { width: 210, height: 148 },
      'Letter-portrait': { width: 216, height: 279 },
      'Letter-landscape': { width: 279, height: 216 }
    }

    return dimensions[`${paperSize}-${orientation}`] || dimensions['A4-portrait']
  }

  private static getPrintCSS(options: PrintOptions): string {
    const { paperSize = 'A5', orientation = 'portrait' } = options
    const dimensions = this.getPaperDimensions(paperSize, orientation)

    return `
      @media print {
        @page {
          size: ${paperSize} ${orientation};
          margin: 0 !important;
        }
        
        /* Reset and hide everything by default */
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          width: ${dimensions.width}mm !important;
          height: ${dimensions.height}mm !important;
          overflow: hidden !important; /* Prevent extra pages */
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Hide all elements by default using visibility to preserve layout positions if needed,
           but mostly we just want to hide the rest of the UI */
        body > * {
          display: none !important;
        }

        /* Specifically show the containers that lead to our target */
        #print-source-container,
        #print-exclusive-container {
          display: block !important;
          visibility: visible !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: white !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }

        /* Show the target element and its contents */
        #${options.elementId} {
          display: flex !important;
          flex-direction: column !important;
          visibility: visible !important;
          position: relative !important;
          margin: 0 auto !important;
          width: ${dimensions.width - 10}mm !important; /* Slightly smaller than paper to avoid clipping */
          height: ${dimensions.height - 10}mm !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          background: white !important;
          z-index: 999999 !important;
          transform: none !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }

        #${options.elementId} * {
          visibility: visible !important;
          box-shadow: none !important;
        }

        /* Ensure parent portals/dialogs don't hide the content */
        [role="dialog"], .fixed, .absolute, [data-state="open"] {
          display: block !important;
          visibility: visible !important;
          background: transparent !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }

        /* Re-hide items that should NEVER be printed */
        .print\\:hidden, button, [role="header"], [role="footer"], .close-button, [aria-label="Close"] {
          display: none !important;
          visibility: hidden !important;
        }
      }
    `
  }

  private static createPrintStyles(options: PrintOptions): HTMLStyleElement {
    const style = document.createElement('style')
    style.type = 'text/css'
    style.textContent = this.getPrintCSS(options)
    style.id = 'print-styles'
    return style
  }

  private static removePrintStyles(): void {
    const existingStyles = document.getElementById('print-styles')
    if (existingStyles) {
      existingStyles.remove()
    }
  }

  private static async generateHighQualityPDF(element: HTMLElement, options: PrintOptions): Promise<void> {
    const {
      filename = 'document.pdf',
      paperSize = 'A5',
      orientation = 'portrait',
      quality = 2,
      scale = 2
    } = options

    const dimensions = this.getPaperDimensions(paperSize, orientation)

    try {
      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: dimensions.width * 3.78,
        height: dimensions.height * 3.78,
        logging: false
      })

      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: paperSize.toLowerCase() as 'a4' | 'a5' | 'letter',
      })

      const imgData = canvas.toDataURL('image/jpeg', quality)
      pdf.addImage(imgData, 'JPEG', 0, 0, dimensions.width, dimensions.height)
      pdf.save(filename)

    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Failed to generate PDF')
    }
  }

  static async print(options: PrintOptions): Promise<void> {
    const { format = 'print' } = options
    const element = document.getElementById(options.elementId)

    if (!element) {
      throw new Error(`Element with id "${options.elementId}" not found`)
    }

    try {
      // Remove any existing print styles
      this.removePrintStyles()

      // Add new print styles
      const printStyles = this.createPrintStyles(options)
      document.head.appendChild(printStyles)

      if (format === 'pdf') {
        await this.generateHighQualityPDF(element, options)
      } else {
        // Wait for rendering and images to load properly - increased delay
        setTimeout(() => {
          window.print()
          // We remove styles after a longer delay to ensure print dialog captures it
          setTimeout(() => this.removePrintStyles(), 2000)
        }, 1000)
      }

    } catch (error) {
      console.error('Printing failed:', error)
      this.removePrintStyles()
      throw error
    }
  }

  static async printInvoice(invoiceElementId: string, invoiceNumber?: string): Promise<void> {
    return this.print({
      elementId: invoiceElementId,
      filename: invoiceNumber ? `Invoice-${invoiceNumber}.pdf` : 'invoice.pdf',
      paperSize: 'A5',
      orientation: 'portrait',
      quality: 2,
      scale: 2,
      format: 'print'
    })
  }

  static async printReceipt(receiptElementId: string, receiptNumber?: string): Promise<void> {
    return this.print({
      elementId: receiptElementId,
      filename: receiptNumber ? `Receipt-${receiptNumber}.pdf` : 'receipt.pdf',
      paperSize: 'A5',
      orientation: 'landscape',
      quality: 2,
      scale: 2,
      format: 'print'
    })
  }

  static async exportInvoiceToPDF(invoiceElementId: string, invoiceNumber?: string): Promise<void> {
    return this.print({
      elementId: invoiceElementId,
      filename: invoiceNumber ? `Invoice-${invoiceNumber}.pdf` : 'invoice.pdf',
      paperSize: 'A5',
      orientation: 'portrait',
      quality: 2,
      scale: 2,
      format: 'pdf'
    })
  }

  static async exportReceiptToPDF(receiptElementId: string, receiptNumber?: string): Promise<void> {
    return this.print({
      elementId: receiptElementId,
      filename: receiptNumber ? `Receipt-${receiptNumber}.pdf` : 'receipt.pdf',
      paperSize: 'A5',
      orientation: 'landscape',
      quality: 2,
      scale: 2,
      format: 'pdf'
    })
  }

  static setupPrintPreview(elementId: string): void {
    const element = document.getElementById(elementId)
    if (!element) return

    // Add print preview enhancements
    element.style.boxSizing = 'border-box'
    element.style.overflow = 'hidden'
    element.style.pageBreakInside = 'avoid'
  }
}

// Utility functions for specific use cases
export const printInvoice = (invoiceNumber?: string) =>
  PrintService.printInvoice('invoice-content', invoiceNumber)

export const printReceipt = (receiptNumber?: string) =>
  PrintService.printReceipt('receipt-content', receiptNumber)

export const exportInvoiceToPDF = (invoiceNumber?: string) =>
  PrintService.exportInvoiceToPDF('invoice-content', invoiceNumber)

export const exportReceiptToPDF = (receiptNumber?: string) =>
  PrintService.exportReceiptToPDF('receipt-content', receiptNumber)

export const setupPrintPreview = (elementId: string) =>
  PrintService.setupPrintPreview(elementId)

export const printDiv = (elementId: string, filename?: string) =>
  PrintService.print({ elementId, filename, format: 'print' })
