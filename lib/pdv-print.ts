import type { CartItem, PaymentLine, OrderType, AddressState } from '@/components/pdv/types'

const METHOD_LABEL: Record<string, string> = {
  cash:        'Dinheiro',
  pix:         'PIX',
  credit_card: 'Crédito',
  debit_card:  'Débito',
}

const TYPE_LABEL: Record<string, string> = {
  pickup:   'Retirada no balcão',
  in_store: 'Mesa',
  delivery: 'Delivery',
}

export interface PrintReceiptData {
  orderId: string
  tenantName: string
  items: CartItem[]
  subtotal: number
  discountAmount: number
  deliveryFee: number
  total: number
  customerName: string
  customerPhone: string
  orderType: OrderType
  tableNumber: number | null
  payments: PaymentLine[]
  change: number
  address?: AddressState
}

export function printPDVReceipt(data: PrintReceiptData) {
  const win = window.open('', '_blank', 'width=400,height=680')
  if (!win) return

  const now = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const itemsHtml = data.items.map(i => `
    <div class="row">
      <span>${i.quantity}x ${i.name}</span>
      <span>R$ ${(i.unitPrice * i.quantity).toFixed(2)}</span>
    </div>
    ${i.options.map(o => `<div class="indent">+ ${o.name}${o.priceModifier !== 0 ? ` (R$ ${o.priceModifier.toFixed(2)})` : ''}</div>`).join('')}
    ${i.notes ? `<div class="indent obs">* ${i.notes}</div>` : ''}
  `).join('')

  const addressHtml = data.address && data.orderType === 'delivery' ? `
    <div class="divider"></div>
    <div class="bold">Endereço de entrega:</div>
    <div>${data.address.street}, ${data.address.number}${data.address.complement ? ` - ${data.address.complement}` : ''}</div>
    <div>${data.address.neighborhood} — ${data.address.city}/${data.address.state}</div>
    <div>CEP: ${data.address.cep}</div>
  ` : ''

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Courier New',monospace; font-size:11px; width:78mm; padding:4mm; color:#000; }
  .center { text-align:center; }
  .bold { font-weight:bold; }
  .large { font-size:14px; font-weight:bold; }
  .divider { border-top:1px dashed #000; margin:5px 0; }
  .row { display:flex; justify-content:space-between; margin:1px 0; }
  .indent { padding-left:10px; color:#444; font-size:10px; }
  .obs { font-style:italic; }
  .total-row { font-size:13px; font-weight:bold; }
  .change { font-size:13px; font-weight:bold; background:#000; color:#fff; padding:2px 4px; }
  @media print { @page { margin:0; size:80mm auto; } }
</style>
</head><body>
  <div class="center large">${data.tenantName}</div>
  <div class="center">CUPOM NÃO FISCAL</div>
  <div class="divider"></div>
  <div class="row"><span>${now}</span><span>#${data.orderId.slice(-8).toUpperCase()}</span></div>
  <div class="row"><span>Cliente:</span><span>${data.customerName}</span></div>
  ${data.customerPhone ? `<div class="row"><span>Telefone:</span><span>${data.customerPhone}</span></div>` : ''}
  <div class="row"><span>Tipo:</span><span>${TYPE_LABEL[data.orderType] ?? data.orderType}${data.tableNumber ? ` ${data.tableNumber}` : ''}</span></div>
  <div class="divider"></div>
  ${itemsHtml}
  <div class="divider"></div>
  <div class="row"><span>Subtotal</span><span>R$ ${data.subtotal.toFixed(2)}</span></div>
  ${data.discountAmount > 0 ? `<div class="row"><span>Desconto</span><span>-R$ ${data.discountAmount.toFixed(2)}</span></div>` : ''}
  ${data.deliveryFee > 0 ? `<div class="row"><span>Taxa de entrega</span><span>R$ ${data.deliveryFee.toFixed(2)}</span></div>` : ''}
  <div class="divider"></div>
  <div class="row total-row"><span>TOTAL</span><span>R$ ${data.total.toFixed(2)}</span></div>
  ${data.payments.map(p => `
    <div class="row" style="margin-top:2px">
      <span>${METHOD_LABEL[p.method] ?? p.method}</span>
      <span>R$ ${p.amount.toFixed(2)}</span>
    </div>
    ${p.method === 'cash' && (p.received ?? 0) > p.amount
      ? `<div class="row"><span>  Recebido</span><span>R$ ${(p.received ?? 0).toFixed(2)}</span></div>` : ''}
  `).join('')}
  ${data.change > 0 ? `<div class="row change"><span>TROCO</span><span>R$ ${data.change.toFixed(2)}</span></div>` : ''}
  ${addressHtml}
  <div class="divider"></div>
  <div class="center">Obrigado pela preferência!</div>
  <div class="center" style="font-size:9px;margin-top:3px">Powered by FoodBio</div>
</body></html>`

  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}

export function printKitchenTicket(data: PrintReceiptData) {
  const win = window.open('', '_blank', 'width=400,height=500')
  if (!win) return

  const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const itemsHtml = data.items.map(i => `
    <div class="item-row">
      <span class="qty">${i.quantity}x</span>
      <span class="name">${i.name}</span>
    </div>
    ${i.options.map(o => `<div class="opt">  → ${o.name}</div>`).join('')}
    ${i.notes ? `<div class="opt obs">  ⚠ ${i.notes}</div>` : ''}
  `).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Courier New',monospace; font-size:12px; width:78mm; padding:4mm; color:#000; }
  .center { text-align:center; }
  .divider { border-top:2px solid #000; margin:5px 0; }
  .divider-dashed { border-top:1px dashed #000; margin:4px 0; }
  .header { font-size:20px; font-weight:bold; text-align:center; }
  .sub { font-size:14px; font-weight:bold; }
  .item-row { display:flex; gap:8px; font-size:14px; font-weight:bold; margin:3px 0; }
  .qty { font-size:16px; min-width:24px; }
  .opt { font-size:11px; padding-left:10px; }
  .obs { font-weight:bold; }
  @media print { @page { margin:0; size:80mm auto; } }
</style>
</head><body>
  <div class="header">COZINHA</div>
  <div class="divider"></div>
  <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:bold">
    <span>#${data.orderId.slice(-6).toUpperCase()}</span>
    <span>${now}</span>
  </div>
  <div class="sub">${TYPE_LABEL[data.orderType] ?? data.orderType}${data.tableNumber ? ` — Mesa ${data.tableNumber}` : ''}</div>
  <div>${data.customerName}</div>
  <div class="divider"></div>
  ${itemsHtml}
  <div class="divider-dashed"></div>
  <div class="center" style="font-size:10px">${data.tenantName}</div>
</body></html>`

  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}
