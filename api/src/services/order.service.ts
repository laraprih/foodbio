import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export async function createOrder(data: any) {
  const { restaurantId, items, customerName, customerPhone, deliveryType, address, paymentMethod } = data;

  // Calculate totals and fetch item info from DB to ensure prices are correct
  let total = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: { options: true },
    });

    if (!product) throw new Error(`Produto ${item.productId} não encontrado`);

    let itemPrice = product.price;
    const selectedOptions = [];

    if (item.options) {
      for (const optId of item.options) {
        const opt = product.options.find((o) => o.id === optId);
        if (opt) {
          itemPrice += opt.price;
          selectedOptions.push({ id: opt.id, name: opt.name, price: opt.price });
        }
      }
    }

    total += itemPrice * item.quantity;
    orderItems.push({
      productId: product.id,
      quantity: item.quantity,
      price: product.price,
      options: selectedOptions,
    });
  }

  // TODO: Add delivery fee logic from Tenant settings
  total += 5.99;

  const order = await prisma.order.create({
    data: {
      tenantId: restaurantId,
      total,
      customerName,
      customerPhone,
      deliveryType,
      address,
      paymentMethod,
      status: 'PENDING',
      items: {
        create: orderItems,
      },
    },
    include: {
      items: { include: { product: true } },
    },
  });

  return order;
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
    },
  });
}
