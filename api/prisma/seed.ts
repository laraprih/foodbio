import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // ── Tenant ──────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'burguer-bros' },
    update: {},
    create: {
      slug: 'burguer-bros',
      name: 'Burguer Bros',
      phone: '(11) 91234-5678',
      address: 'Rua Augusta, 1200',
      city: 'São Paulo',
      state: 'SP',
      logoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&auto=format&fit=crop&q=80',
      deliveryFee: 5.90,
      minOrderValue: 25.00,
      deliveryRadius: 8.0,
      plan: 'pro',
      active: true,
      openingHours: {
        seg: { open: '11:00', close: '23:00' },
        ter: { open: '11:00', close: '23:00' },
        qua: { open: '11:00', close: '23:00' },
        qui: { open: '11:00', close: '23:00' },
        sex: { open: '11:00', close: '00:00' },
        sab: { open: '12:00', close: '00:00' },
        dom: { open: '12:00', close: '22:00' },
      },
    },
  })

  console.log(`✅ Tenant criado: ${tenant.name} (slug: ${tenant.slug})`)

  // ── Admin user ───────────────────────────────────────────────────────────────
  const passwordHash = await argon2.hash('admin123')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@burguerbros.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Admin Burguer Bros',
      email: 'admin@burguerbros.com',
      phone: '(11) 91234-5678',
      passwordHash,
      role: 'admin',
      active: true,
    },
  })

  console.log(`✅ Admin criado: ${admin.email} / senha: admin123`)

  // ── Categories ───────────────────────────────────────────────────────────────
  const catHamburguer = await prisma.category.upsert({
    where: { id: 'cat-hamburguer' },
    update: {},
    create: { id: 'cat-hamburguer', tenantId: tenant.id, name: 'Hambúrgueres', order: 1, active: true },
  })
  const catPorcoes = await prisma.category.upsert({
    where: { id: 'cat-porcoes' },
    update: {},
    create: { id: 'cat-porcoes', tenantId: tenant.id, name: 'Porções', order: 2, active: true },
  })
  const catBebidas = await prisma.category.upsert({
    where: { id: 'cat-bebidas' },
    update: {},
    create: { id: 'cat-bebidas', tenantId: tenant.id, name: 'Bebidas', order: 3, active: true },
  })
  const catSobremesas = await prisma.category.upsert({
    where: { id: 'cat-sobremesas' },
    update: {},
    create: { id: 'cat-sobremesas', tenantId: tenant.id, name: 'Sobremesas', order: 4, active: true },
  })

  console.log('✅ 4 categorias criadas')

  // ── Products ─────────────────────────────────────────────────────────────────
  const products = [
    // Hambúrgueres
    {
      id: 'prod-classic-bros',
      categoryId: catHamburguer.id,
      tenantId: tenant.id,
      name: 'Classic Bros',
      description: 'Blend artesanal 180g grelhado na brasa, queijo cheddar inglês derretido, alface americana crocante, tomate, picles artesanal e molho especial da casa. Servido em pão de brioche tostado.',
      price: 32.90,
      imageUrl: 'https://images.unsplash.com/photo-1561758033-f8ff74d6494a?w=600&auto=format&fit=crop&q=80',
      available: true,
      sortOrder: 1,
    },
    {
      id: 'prod-double-smash',
      categoryId: catHamburguer.id,
      tenantId: tenant.id,
      name: 'Double Smash',
      description: 'Dois smash patties de 90g, cheddar americano, bacon artesanal crocante, cebola caramelizada no vinho tinto e molho barbecue defumado. O favorito da casa!',
      price: 46.90,
      imageUrl: 'https://images.unsplash.com/photo-1567446991062-e8a1209f70b4?w=600&auto=format&fit=crop&q=80',
      available: true,
      sortOrder: 2,
    },
    {
      id: 'prod-frango-crispy',
      categoryId: catHamburguer.id,
      tenantId: tenant.id,
      name: 'Frango Crispy',
      description: 'Filé de frango empanado em panko crocante, aioli de alho assado, repolho roxo marinado, jalapeño em conserva e maionese de sriracha. Delicioso e crocante do início ao fim.',
      price: 34.90,
      imageUrl: 'https://images.unsplash.com/photo-1703219342329-fce8488cf443?w=600&auto=format&fit=crop&q=80',
      available: true,
      sortOrder: 3,
    },
    {
      id: 'prod-veggie-supreme',
      categoryId: catHamburguer.id,
      tenantId: tenant.id,
      name: 'Veggie Supreme',
      description: 'Blend de grão-de-bico, beterraba e cogumelos, queijo vegano derretido, rúcula fresca, tomate seco e molho de ervas finas. 100% plant-based sem abrir mão do sabor.',
      price: 33.90,
      imageUrl: 'https://images.unsplash.com/photo-1546441471-c81f0586d0a9?w=600&auto=format&fit=crop&q=80',
      available: true,
      sortOrder: 4,
    },
    {
      id: 'prod-bacon-lovers',
      categoryId: catHamburguer.id,
      tenantId: tenant.id,
      name: 'Bacon Lovers',
      description: 'Blend angus 200g, três fatias de bacon defumado, queijo gouda derretido, ovo caipira frito, rúcula e molho de mostarda mel. Para quem ama bacon de verdade.',
      price: 49.90,
      imageUrl: 'https://images.unsplash.com/photo-1553979459-d63b0197b304?w=600&auto=format&fit=crop&q=80',
      available: true,
      sortOrder: 5,
    },
    // Porções
    {
      id: 'prod-batata-rustica',
      categoryId: catPorcoes.id,
      tenantId: tenant.id,
      name: 'Batata Rústica',
      description: 'Batatas cortadas em palitos grossos com casca, temperadas com alecrim, alho e páprica defumada. Servidas com molho cheddar cremoso. Porção para 2 pessoas.',
      price: 24.90,
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
      available: true,
      sortOrder: 1,
    },
    {
      id: 'prod-onion-rings',
      categoryId: catPorcoes.id,
      tenantId: tenant.id,
      name: 'Onion Rings',
      description: 'Anéis de cebola empanados em massa de cerveja, dourados e crocantes. Acompanham molho barbecue artesanal defumado. 8 unidades grandes.',
      price: 22.90,
      imageUrl: 'https://images.unsplash.com/photo-1630825533949-74f62f54553a?w=600&auto=format&fit=crop&q=80',
      available: true,
      sortOrder: 2,
    },
    {
      id: 'prod-nuggets-bros',
      categoryId: catPorcoes.id,
      tenantId: tenant.id,
      name: 'Nuggets Bros',
      description: 'Nuggets artesanais de frango empanados em panko, assados até dourar. 10 unidades servidas com molho honey mustard e molho ranch. Crocantes por fora, macios por dentro.',
      price: 26.90,
      imageUrl: 'https://plus.unsplash.com/premium_photo-1661668648046-f2bc1091e4b8?w=600&auto=format&fit=crop&q=80',
      available: true,
      sortOrder: 3,
    },
    // Bebidas
    {
      id: 'prod-milkshake-baunilha',
      categoryId: catBebidas.id,
      tenantId: tenant.id,
      name: 'Milkshake Baunilha',
      description: 'Sorvete artesanal de baunilha de Madagascar batido com leite integral gelado. Coberto com chantilly fresco e calda de caramelo. 500ml de puro prazer.',
      price: 21.90,
      imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
      available: true,
      sortOrder: 1,
    },
    {
      id: 'prod-milkshake-chocolate',
      categoryId: catBebidas.id,
      tenantId: tenant.id,
      name: 'Milkshake Chocolate',
      description: 'Sorvete de chocolate belga 70% cacau batido com leite e achocolatado artesanal. Finalizado com chantilly e raspas de chocolate. 500ml.',
      price: 22.90,
      imageUrl: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600&auto=format&fit=crop&q=80',
      available: true,
      sortOrder: 2,
    },
    {
      id: 'prod-limonada-suica',
      categoryId: catBebidas.id,
      tenantId: tenant.id,
      name: 'Limonada Suíça',
      description: 'Limão siciliano fresco, leite condensado, leite de coco e gelo triturado. Batida na hora para manter a cremosidade perfeita. 400ml refrescante.',
      price: 14.90,
      imageUrl: 'https://images.unsplash.com/photo-1513558003720-343f3a99d97b?w=600&auto=format&fit=crop&q=80',
      available: true,
      sortOrder: 3,
    },
    {
      id: 'prod-coca-cola',
      categoryId: catBebidas.id,
      tenantId: tenant.id,
      name: 'Coca-Cola 350ml',
      description: 'Coca-Cola gelada em lata 350ml. Geladíssima, do jeito que você gosta.',
      price: 8.90,
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f5a4b8e8c8a?w=600&auto=format&fit=crop&q=80',
      available: true,
      sortOrder: 4,
    },
    // Sobremesas
    {
      id: 'prod-brownie-quente',
      categoryId: catSobremesas.id,
      tenantId: tenant.id,
      name: 'Brownie Quente',
      description: 'Brownie de chocolate belga assado na hora, servido quente com sorvete de creme artesanal, calda de chocolate amargo e granulado crocante. A combinação quente/frio é irresistível.',
      price: 19.90,
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e394746?w=600&auto=format&fit=crop&q=80',
      available: true,
      sortOrder: 1,
    },
    {
      id: 'prod-cookie-recheado',
      categoryId: catSobremesas.id,
      tenantId: tenant.id,
      name: 'Cookie Recheado',
      description: 'Cookie de chocolate chips com centro de Nutella derretido, assado na hora. Crocante por fora, cremoso por dentro. Servido com sorvete de creme. 2 unidades.',
      price: 17.90,
      imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop&q=80',
      available: true,
      sortOrder: 2,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    })
  }

  console.log(`✅ ${products.length} produtos criados`)

  // ── Option groups for Classic Bros ───────────────────────────────────────────
  await prisma.optionGroup.upsert({
    where: { id: 'og-ponto-carne' },
    update: {},
    create: {
      id: 'og-ponto-carne',
      productId: 'prod-classic-bros',
      name: 'Ponto da carne',
      required: true,
      maxChoices: 1,
      minChoices: 1,
      options: {
        create: [
          { id: 'opt-mal-passado', name: 'Mal passado', priceModifier: 0, available: true },
          { id: 'opt-ao-ponto', name: 'Ao ponto', priceModifier: 0, available: true },
          { id: 'opt-bem-passado', name: 'Bem passado', priceModifier: 0, available: true },
        ],
      },
    },
  })

  await prisma.optionGroup.upsert({
    where: { id: 'og-extras-classic' },
    update: {},
    create: {
      id: 'og-extras-classic',
      productId: 'prod-classic-bros',
      name: 'Extras (opcional)',
      required: false,
      maxChoices: 3,
      minChoices: 0,
      options: {
        create: [
          { id: 'opt-bacon-extra', name: 'Bacon extra', priceModifier: 5.00, available: true },
          { id: 'opt-ovo-extra', name: 'Ovo caipira', priceModifier: 3.00, available: true },
          { id: 'opt-cheddar-extra', name: 'Cheddar extra', priceModifier: 3.00, available: true },
        ],
      },
    },
  })

  console.log('✅ Grupos de opções criados')

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('\n📋 Resumo:')
  console.log('   Loja:  http://localhost:3000/burguer-bros')
  console.log('   Login admin: admin@burguerbros.com / admin123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
