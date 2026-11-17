import { Subscription } from '../domain/subscription';
import { PaymentTransaction } from '../domain/payment';
import { formatPaise } from './currency';
import { calculateGSTInclusive } from './gst';

export class ExportService {
  /**
   * Generates a CSV string of subscriptions for data portability.
   */
  static exportSubscriptionsToCSV(subscriptions: Subscription[]): string {
    const headers = [
      'Name',
      'Category',
      'Amount (INR)',
      'Billing Cycle',
      'Next Renewal Date',
      'Status',
      'Has AutoPay',
      'Has GST',
      'Notes',
    ];

    const rows = subscriptions.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      s.category,
      (s.amountPaise / 100).toFixed(2),
      s.billingCycle,
      s.nextRenewalDate.split('T')[0],
      s.status,
      s.hasAutoPay ? 'YES' : 'NO',
      s.hasGST ? 'YES' : 'NO',
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Generates a CSV string of payment transactions ledger.
   */
  static exportLedgerToCSV(payments: PaymentTransaction[]): string {
    const headers = [
      'Receipt No',
      'Date',
      'Subscription',
      'Amount (INR)',
      'GST Included (INR)',
      'Payment Method',
      'Status',
    ];

    const rows = payments.map((p) => [
      p.receiptNumber,
      p.date.split('T')[0],
      `"${p.subscriptionName.replace(/"/g, '""')}"`,
      (p.amountPaise / 100).toFixed(2),
      (p.gstPaise / 100).toFixed(2),
      `"${p.paymentMethodName.replace(/"/g, '""')}"`,
      p.status,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Generates a clean JSON backup payload.
   */
  static generateBackupJSON(data: {
    subscriptions: Subscription[];
    payments: PaymentTransaction[];
    timestamp: string;
  }): string {
    return JSON.stringify(
      {
        appName: 'Recurly',
        version: 1,
        exportedAt: data.timestamp || new Date().toISOString(),
        subscriptions: data.subscriptions,
        payments: data.payments,
      },
      null,
      2
    );
  }

  /**
   * Generates HTML for printing/saving PDF receipt.
   */
  static generateReceiptHTML(payment: PaymentTransaction): string {
    const gst = calculateGSTInclusive(payment.amountPaise, 18);
    const dateFormatted = new Date(payment.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Recurly Receipt - ${payment.receiptNumber}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 40px;
            color: #161616;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #E5ECE7;
            padding-bottom: 20px;
          }
          .brand {
            font-size: 26px;
            font-weight: 800;
            color: #0F9D8A;
          }
          .receipt-badge {
            background: #E8F5E9;
            color: #2E7D32;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 700;
          }
          .details {
            margin: 30px 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .label {
            font-size: 12px;
            color: #63736D;
            text-transform: uppercase;
            font-weight: 600;
          }
          .value {
            font-size: 15px;
            font-weight: 600;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
          }
          th {
            text-align: left;
            padding: 12px;
            background: #F4F8F6;
            font-size: 12px;
            text-transform: uppercase;
          }
          td {
            padding: 14px 12px;
            border-bottom: 1px solid #E5ECE7;
            font-size: 14px;
          }
          .total-row {
            font-weight: 800;
            font-size: 18px;
          }
          .disclaimer {
            margin-top: 40px;
            padding: 15px;
            background: #FAF8F5;
            border-radius: 8px;
            font-size: 11px;
            color: #7A8982;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Recurly</div>
            <div style="font-size: 13px; color: #63736D; margin-top: 4px;">Subscription Financial Vault</div>
          </div>
          <div class="receipt-badge">PAID • ELECTRONIC RECORD</div>
        </div>

        <div class="details">
          <div>
            <div class="label">Receipt Number</div>
            <div class="value">${payment.receiptNumber}</div>
          </div>
          <div>
            <div class="label">Payment Date</div>
            <div class="value">${dateFormatted}</div>
          </div>
          <div>
            <div class="label">Service Name</div>
            <div class="value">${payment.subscriptionName}</div>
          </div>
          <div>
            <div class="label">Payment Method</div>
            <div class="value">${payment.paymentMethodName}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Base Subscription Cost</td>
              <td style="text-align: right;">${formatPaise(gst.basePaise, 'INR')}</td>
            </tr>
            <tr>
              <td>CGST (9%)</td>
              <td style="text-align: right;">${formatPaise(gst.cgstPaise, 'INR')}</td>
            </tr>
            <tr>
              <td>SGST (9%)</td>
              <td style="text-align: right;">${formatPaise(gst.sgstPaise, 'INR')}</td>
            </tr>
            <tr class="total-row">
              <td>Total Paid (INR)</td>
              <td style="text-align: right;">${formatPaise(payment.amountPaise, 'INR')}</td>
            </tr>
          </tbody>
        </table>

        <div class="disclaimer">
          <strong>STATUTORY NOTICE:</strong> This document is an electronic personal financial record generated by Recurly for tracking purposes and is NOT a statutory tax invoice issued under Section 31 of the Central Goods and Services Tax (CGST) Act, 2017.
        </div>
      </body>
    </html>
    `;
  }
}

