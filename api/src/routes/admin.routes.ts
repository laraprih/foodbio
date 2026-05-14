import { FastifyInstance, FastifyRequest } from 'fastify';
import prisma from '@/lib/prisma';
import { invalidateMenu, invalidateTenant } from '@/services/cache.service';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

// Extract tenantId from JWT token
function getTenantId(request: FastifyRequest): string | null {
  try {
    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    const token = auth.slice(7);
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.tenantId ?? null;
  } catch {
    return null;
  }
}

export async function adminRoutes(fastify: FastifyInstance) {

  // ── Tenant / Store Settings ──────────────────────────────────────────────────

  fastify.get('/tenant', async (request: any, reply) => {
    const tenantId = getTenantId(request);
    if (!tenantId) return reply.status(401).send({ error: 'Não autorizado' });
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true, phone: true, address: true, city: true, state: true, logoUrl: true, logoFormat: true, coverUrl: true, deliveryFee: true, minOrderValue: true, deliveryRadius: true },
    });
    if (!tenant) return reply.status(404).send({ error: 'Restaurante não encontrado' });
    return tenant;
  });

  fastify.patch('/tenant', async (request: any, reply) => {
    const tenantId = getTenantId(request);
    if (!tenantId) return reply.status(401).send({ error: 'Não autorizado' });
    const { name, phone, address, city, state, logoUrl, logoFormat, coverUrl, deliveryFee, minOrderValue, deliveryRadius } = request.body;
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (address !== undefined) data.address = address;
    if (city !== undefined) data.city = city;
    if (state !== undefined) data.state = state;
    if (logoUrl !== undefined) data.logoUrl = logoUrl;
    if (logoFormat !== undefined) data.logoFormat = logoFormat;
    if (coverUrl !== undefined) data.coverUrl = coverUrl;
    if (deliveryFee !== undefined) data.deliveryFee = deliveryFee;
    if (minOrderValue !== undefined) data.minOrderValue = minOrderValue;
    if (deliveryRadius !== undefined) data.deliveryRadius = deliveryRadius;
    const tenant = await prisma.tenant.update({ where: { id: tenantId }, data });
    await invalidateTenant(tenant.slug);
    return tenant;
  });

  // ── Orders ──────────────────────────────────────────────────────────────────

  fastify.get('/orders', async (request: any) => {
    const tenantId = getTenantId(request) ?? request.query.tenantId;
    return prisma.order.findMany({
      where: { tenantId },
      include: { items: { include: { product: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  });

  fastify.patch('/orders/:id/status', async (request: any) => {
    const { id } = request.params;
    const { status } = request.body;
    return prisma.order.update({ where: { id }, data: { status } });
  });

  // ── Metrics / Reports ────────────────────────────────────────────────────────

  fastify.get('/reports/summary', async (request: any) => {
    const tenantId = getTenantId(request) ?? request.query.tenantId;
    const orders = await prisma.order.findMany({ where: { tenantId } });
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    return { totalRevenue, orderCount: orders.length };
  });

  // ── Menu ─────────────────────────────────────────────────────────────────────

  fastify.get('/menu', async (request: any) => {
    const tenantId = getTenantId(request) ?? request.query.tenantId;
    const categories = await prisma.category.findMany({
      where: { tenantId },
      include: {
        products: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
    return { categories };
  });

  // ── Categories ───────────────────────────────────────────────────────────────

  fastify.post('/menu/categories', async (request: any, reply) => {
    const tenantId = getTenantId(request);
    if (!tenantId) return reply.status(401).send({ error: 'Não autorizado' });
    const { name, order } = request.body;
    const category = await prisma.category.create({
      data: { tenantId, name, order: order ?? 0 },
    });
    await invalidateMenu(tenantId);
    return reply.status(201).send(category);
  });

  fastify.patch('/menu/categories/:id', async (request: any, reply) => {
    const tenantId = getTenantId(request);
    if (!tenantId) return reply.status(401).send({ error: 'Não autorizado' });
    const { id } = request.params;
    const { name, order, active } = request.body;
    const category = await prisma.category.update({
      where: { id, tenantId },
      data: { ...(name !== undefined && { name }), ...(order !== undefined && { order }), ...(active !== undefined && { active }) },
    });
    await invalidateMenu(tenantId);
    return category;
  });

  fastify.delete('/menu/categories/:id', async (request: any, reply) => {
    const tenantId = getTenantId(request);
    if (!tenantId) return reply.status(401).send({ error: 'Não autorizado' });
    const { id } = request.params;
    const count = await prisma.product.count({ where: { categoryId: id, tenantId } });
    if (count > 0) return reply.status(400).send({ error: `Categoria tem ${count} produto(s). Remova-os primeiro.` });
    await prisma.category.delete({ where: { id, tenantId } });
    await invalidateMenu(tenantId);
    return reply.status(204).send();
  });

  // ── Products ─────────────────────────────────────────────────────────────────

  fastify.post('/menu/products', async (request: any, reply) => {
    const tenantId = getTenantId(request);
    if (!tenantId) return reply.status(401).send({ error: 'Não autorizado' });
    const { name, description, price, categoryId, imageUrl, available, sortOrder } = request.body;
    const product = await prisma.product.create({
      data: { tenantId, categoryId, name, description, price, imageUrl, available: available ?? true, sortOrder: sortOrder ?? 0 },
    });
    await invalidateMenu(tenantId);
    return reply.status(201).send(product);
  });

  fastify.patch('/menu/products/:id', async (request: any, reply) => {
    const tenantId = getTenantId(request);
    if (!tenantId) return reply.status(401).send({ error: 'Não autorizado' });
    const { id } = request.params;
    const { name, description, price, categoryId, imageUrl, available, sortOrder } = request.body;
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = price;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (available !== undefined) data.available = available;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    const product = await prisma.product.update({ where: { id, tenantId }, data });
    await invalidateMenu(tenantId);
    return product;
  });

  fastify.patch('/menu/products/:id/availability', async (request: any, reply) => {
    const tenantId = getTenantId(request);
    if (!tenantId) return reply.status(401).send({ error: 'Não autorizado' });
    const { id } = request.params;
    const current = await prisma.product.findUnique({ where: { id, tenantId } });
    if (!current) return reply.status(404).send({ error: 'Produto não encontrado' });
    const product = await prisma.product.update({ where: { id, tenantId }, data: { available: !current.available } });
    await invalidateMenu(tenantId);
    return product;
  });

  fastify.delete('/menu/products/:id', async (request: any, reply) => {
    const tenantId = getTenantId(request);
    if (!tenantId) return reply.status(401).send({ error: 'Não autorizado' });
    const { id } = request.params;
    await prisma.product.delete({ where: { id, tenantId } });
    await invalidateMenu(tenantId);
    return reply.status(204).send();
  });

  // ── Image Upload ─────────────────────────────────────────────────────────────

  fastify.post('/upload', async (request: any, reply) => {
    const tenantId = getTenantId(request);
    if (!tenantId) return reply.status(401).send({ error: 'Não autorizado' });

    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'Nenhum arquivo enviado' });

    const ext = path.extname(data.filename).toLowerCase() || '.jpg';
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!allowed.includes(ext)) return reply.status(400).send({ error: 'Formato não permitido' });

    const filename = `${randomUUID()}${ext}`;
    const uploadsDir = path.join(process.cwd(), '..', 'public', 'uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });

    const buffer = await data.toBuffer();
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    return { url: `${frontendUrl}/uploads/${filename}` };
  });
}
