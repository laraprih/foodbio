import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Pexels CDN – URLs estáveis, alta qualidade
const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600`

// Unsplash verificados (do seed original)
const uns = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=600&auto=format&fit=crop&q=80`

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'burguer-bros' } })
  if (!tenant) throw new Error('Tenant burguer-bros não encontrado. Rode seed.ts primeiro.')

  // Busca categorias existentes
  const cats = await prisma.category.findMany({ where: { tenantId: tenant.id } })
  const catMap = Object.fromEntries(cats.map((c) => [c.name, c.id]))

  // Garante nova categoria "Combos"
  const catCombos = await prisma.category.upsert({
    where: { id: 'cat-combos' },
    update: {},
    create: { id: 'cat-combos', tenantId: tenant.id, name: 'Combos', order: 0, active: true },
  })

  const catSandwiches = await prisma.category.upsert({
    where: { id: 'cat-sandwiches' },
    update: {},
    create: { id: 'cat-sandwiches', tenantId: tenant.id, name: 'Sanduíches', order: 1, active: true },
  })

  const catH  = catMap['Hambúrgueres']
  const catP  = catMap['Porções']
  const catB  = catMap['Bebidas']
  const catS  = catMap['Sobremesas']

  console.log('🏷️  Categorias mapeadas')

  const products = [
    // ── COMBOS ───────────────────────────────────────────────────────────────
    {
      id: 'prod-combo-classic',
      categoryId: catCombos.id,
      tenantId: tenant.id,
      name: 'Combo Classic Bros',
      description: 'Classic Bros + Batata Rústica (porção individual) + Refrigerante 350ml. O combo mais pedido da casa. Economize R$ 8,00 em relação ao avulso!',
      price: 45.90,
      imageUrl: px(1639557),
      available: true,
      sortOrder: 1,
    },
    {
      id: 'prod-combo-double',
      categoryId: catCombos.id,
      tenantId: tenant.id,
      name: 'Combo Double Smash',
      description: 'Double Smash + Batata Cheddar Bacon + Milkshake 300ml à sua escolha. Para quem não brinca em serviço. Economize R$ 12,00!',
      price: 62.90,
      imageUrl: px(2082102),
      available: true,
      sortOrder: 2,
    },
    {
      id: 'prod-combo-frango',
      categoryId: catCombos.id,
      tenantId: tenant.id,
      name: 'Combo Frango Crispy',
      description: 'Frango Crispy + Onion Rings (8 unid.) + Limonada Suíça 400ml. Crocante do início ao fim, direto pra sua mesa.',
      price: 55.90,
      imageUrl: px(3616956),
      available: true,
      sortOrder: 3,
    },
    {
      id: 'prod-combo-kids',
      categoryId: catCombos.id,
      tenantId: tenant.id,
      name: 'Combo Kids',
      description: 'Mini hambúrguer 100g com queijo + batata palito simples + suco de caixinha. Ideal para as crianças. Inclui brinde surpresa!',
      price: 29.90,
      imageUrl: px(1126359),
      available: true,
      sortOrder: 4,
    },
    {
      id: 'prod-combo-vegano',
      categoryId: catCombos.id,
      tenantId: tenant.id,
      name: 'Combo Vegano',
      description: 'Veggie Supreme + Batata Rústica + Suco Natural 300ml. 100% plant-based, zero compromisso com o sabor. Aprovado até por quem come carne!',
      price: 52.90,
      imageUrl: uns('1546441471-c81f0586d0a9'),
      available: true,
      sortOrder: 5,
    },

    // ── HAMBÚRGUERES EXTRAS ───────────────────────────────────────────────────
    {
      id: 'prod-spicy-fire',
      categoryId: catH,
      tenantId: tenant.id,
      name: 'Spicy Fire 🌶️',
      description: 'Blend angus 180g, pimenta jalapeño em conserva, molho buffalo artesanal, queijo pepper jack derretido, cebola crocante e maionese de habanero. Para os corajosos!',
      price: 38.90,
      imageUrl: px(1556688),
      available: true,
      sortOrder: 6,
    },
    {
      id: 'prod-mushroom-swiss',
      categoryId: catH,
      tenantId: tenant.id,
      name: 'Mushroom Swiss',
      description: 'Blend 180g, mix de cogumelos shiitake e paris salteados na manteiga, queijo suíço gruyère derretido, aioli de alho negro e rúcula fresca. Sofisticado e irresistível.',
      price: 42.90,
      imageUrl: px(3738730),
      available: true,
      sortOrder: 7,
    },
    {
      id: 'prod-hawaiian-vibes',
      categoryId: catH,
      tenantId: tenant.id,
      name: 'Hawaiian Vibes 🍍',
      description: 'Blend de frango defumado, abacaxi grelhado caramelizado, queijo provolone, presunto crocante, folhas de alface e molho teriyaki caseiro. A combinação agridoce perfeita.',
      price: 36.90,
      imageUrl: px(1893555),
      available: true,
      sortOrder: 8,
    },
    {
      id: 'prod-bbq-smoked',
      categoryId: catH,
      tenantId: tenant.id,
      name: 'BBQ Smoked',
      description: 'Blend 200g defumado no carvão, queijo cheddar maturado, bacon defumado artesanal, cebola caramelizada por 4 horas, picles de pepino e molho BBQ texano. Sabor de churrasco em cada mordida.',
      price: 44.90,
      imageUrl: uns('1553979459-d63b0197b304'),
      available: true,
      sortOrder: 9,
    },
    {
      id: 'prod-truffle-rocket',
      categoryId: catH,
      tenantId: tenant.id,
      name: 'Truffle & Rocket',
      description: 'Blend wagyu 180g, queijo brie francês, rúcula selvagem, tomate seco, lâminas de cogumelo trufado e maionese de trufa negra. A experiência premium da casa.',
      price: 54.90,
      imageUrl: px(1583884),
      available: true,
      sortOrder: 10,
    },
    {
      id: 'prod-pulled-pork',
      categoryId: catH,
      tenantId: tenant.id,
      name: 'Pulled Pork',
      description: 'Pernil suíno desfiado e temperado por 12 horas no smoker, coleslaw cremoso, picles de jalapeño, molho BBQ mel defumado e chips de cebola. Low and slow do jeito certo.',
      price: 47.90,
      imageUrl: px(699953),
      available: true,
      sortOrder: 11,
    },

    // ── SANDUÍCHES ─────────────────────────────────────────────────────────────
    {
      id: 'prod-club-sandwich',
      categoryId: catSandwiches.id,
      tenantId: tenant.id,
      name: 'Club Sandwich',
      description: 'Frango grelhado, bacon, tomate, alface americana, ovo, maionese temperada e queijo prato entre 3 camadas de pão de forma tostado. Servido com batata palito.',
      price: 32.90,
      imageUrl: px(1633578),
      available: true,
      sortOrder: 1,
    },
    {
      id: 'prod-philly-steak',
      categoryId: catSandwiches.id,
      tenantId: tenant.id,
      name: 'Philly Cheesesteak',
      description: 'Filé de alcatra fatiado fininho, pimentões coloridos e cebola caramelizada na chapa, queijo provolone derretido em pão hoagie crocante. Direto da Filadélfia para você.',
      price: 39.90,
      imageUrl: px(3384472),
      available: true,
      sortOrder: 2,
    },
    {
      id: 'prod-bruschettas',
      categoryId: catSandwiches.id,
      tenantId: tenant.id,
      name: 'Bruschetta Caprese',
      description: '4 fatias de ciabatta grelhada, tomate concassée, muçarela de búfala fresca, manjericão, azeite extravirgem e flor de sal. Entrada ou petisco perfeito.',
      price: 22.90,
      imageUrl: px(1640777),
      available: true,
      sortOrder: 3,
    },

    // ── PORÇÕES EXTRAS ────────────────────────────────────────────────────────
    {
      id: 'prod-batata-simples',
      categoryId: catP,
      tenantId: tenant.id,
      name: 'Batata Palito Simples',
      description: 'Batatas fritas palito douradas e crocantes, temperadas com sal e páprica. Porção individual com ketchup ou mostarda. Perfeito como acompanhamento.',
      price: 14.90,
      imageUrl: uns('1573080496219-bb080dd4f877'),
      available: true,
      sortOrder: 4,
    },
    {
      id: 'prod-batata-cheddar-bacon',
      categoryId: catP,
      tenantId: tenant.id,
      name: 'Batata Cheddar Bacon',
      description: 'Batata rústica coberta com generosa camada de molho cheddar quente e bacon artesanal crocante picado. Finalizada com cebolinha e pimenta do reino. Porção para 2 pessoas.',
      price: 32.90,
      imageUrl: px(1583884),
      available: true,
      sortOrder: 5,
    },
    {
      id: 'prod-mozzarella-sticks',
      categoryId: catP,
      tenantId: tenant.id,
      name: 'Mozzarella Sticks',
      description: '6 palitos de muçarela empanados em farinha panko, fritos até dourar. Com fio de queijo puxando em cada mordida. Acompanham molho marinara artesanal.',
      price: 28.90,
      imageUrl: px(958545),
      available: true,
      sortOrder: 6,
    },
    {
      id: 'prod-mini-burgers',
      categoryId: catP,
      tenantId: tenant.id,
      name: 'Mini Burgers (4 un.)',
      description: '4 mini hambúrgueres artesanais no pão de brioche, queijo cheddar, picles e molho especial. Perfeito para compartilhar ou quando a fome é média. Servidos em tábua.',
      price: 36.90,
      imageUrl: px(1126359),
      available: true,
      sortOrder: 7,
    },
    {
      id: 'prod-chicken-wings',
      categoryId: catP,
      tenantId: tenant.id,
      name: 'Chicken Wings (8 un.)',
      description: '8 asas de frango marinadas por 6h, assadas e finalizadas na brasa com molho buffalo picante. Acompanham molho blue cheese artesanal e talos de aipo.',
      price: 34.90,
      imageUrl: px(60616),
      available: true,
      sortOrder: 8,
    },
    {
      id: 'prod-pao-alho',
      categoryId: catP,
      tenantId: tenant.id,
      name: 'Pão de Alho Artesanal',
      description: 'Baguete de fermentação natural, fatiada e untada com manteiga de alho assado, ervas finas e queijo parmesão. 6 fatias douradas na chapa. O petisco mais viciante da casa.',
      price: 18.90,
      imageUrl: px(2097090),
      available: true,
      sortOrder: 9,
    },
    {
      id: 'prod-nachos',
      categoryId: catP,
      tenantId: tenant.id,
      name: 'Nachos Loaded',
      description: 'Chips de milho artesanais cobertos com queijo nacho derretido, pico de gallo, jalapeños, sour cream, guacamole e carne temperada. Porção generosa para 2-3 pessoas.',
      price: 39.90,
      imageUrl: px(1640777),
      available: true,
      sortOrder: 10,
    },

    // ── BEBIDAS EXTRAS ────────────────────────────────────────────────────────
    {
      id: 'prod-milkshake-morango',
      categoryId: catB,
      tenantId: tenant.id,
      name: 'Milkshake Morango',
      description: 'Sorvete artesanal de morango batido com leite integral e polpa de morango natural. Coberto com chantilly, calda de morango e morango fresco. 500ml.',
      price: 21.90,
      imageUrl: px(338713),
      available: true,
      sortOrder: 5,
    },
    {
      id: 'prod-milkshake-oreo',
      categoryId: catB,
      tenantId: tenant.id,
      name: 'Milkshake Oreo',
      description: 'Sorvete de creme batido com Oreo triturado e leite integral. Finalizado com chantilly, calda de chocolate e biscoito inteiro. 500ml de indulgência pura.',
      price: 23.90,
      imageUrl: px(2480828),
      available: true,
      sortOrder: 6,
    },
    {
      id: 'prod-suco-laranja',
      categoryId: catB,
      tenantId: tenant.id,
      name: 'Suco de Laranja Natural',
      description: 'Suco de laranja pera espremido na hora, coado e servido bem gelado com ou sem açúcar. Feito com laranjas selecionadas da época. 400ml.',
      price: 12.90,
      imageUrl: px(775031),
      available: true,
      sortOrder: 7,
    },
    {
      id: 'prod-limonada-tradicional',
      categoryId: catB,
      tenantId: tenant.id,
      name: 'Limonada Tradicional',
      description: 'Suco de limão siciliano espremido na hora, água gelada, açúcar e hortelã fresca. Refrescante e natural. 400ml.',
      price: 11.90,
      imageUrl: uns('1513558003720-343f3a99d97b'),
      available: true,
      sortOrder: 8,
    },
    {
      id: 'prod-cerveja-artesanal',
      categoryId: catB,
      tenantId: tenant.id,
      name: 'Cerveja Artesanal IPA',
      description: 'Long neck 355ml da cervejaria local parceira. IPA encorpada com notas cítricas de lúpulo americano e amargor equilibrado. Servida gelada em copo gelado.',
      price: 18.90,
      imageUrl: px(3724228),
      available: true,
      sortOrder: 9,
    },
    {
      id: 'prod-cerveja-lager',
      categoryId: catB,
      tenantId: tenant.id,
      name: 'Cerveja Lager Gelada',
      description: 'Long neck 355ml de lager premium importada. Suave, refrescante e o acompanhamento perfeito para qualquer hambúrguer da casa.',
      price: 14.90,
      imageUrl: px(2531186),
      available: true,
      sortOrder: 10,
    },
    {
      id: 'prod-agua-mineral',
      categoryId: catB,
      tenantId: tenant.id,
      name: 'Água Mineral 500ml',
      description: 'Água mineral natural sem gás ou com gás. Geladinha e sempre fresquinha.',
      price: 6.90,
      imageUrl: px(1548839),
      available: true,
      sortOrder: 11,
    },
    {
      id: 'prod-guarana',
      categoryId: catB,
      tenantId: tenant.id,
      name: 'Guaraná Antarctica Lata',
      description: 'Guaraná Antarctica em lata 350ml. Geladinho, do jeitinho que você curte.',
      price: 7.90,
      imageUrl: uns('1513558161293-cdaf765ed2fd'),
      available: true,
      sortOrder: 12,
    },

    // ── SOBREMESAS EXTRAS ─────────────────────────────────────────────────────
    {
      id: 'prod-petit-gateau',
      categoryId: catS,
      tenantId: tenant.id,
      name: 'Petit Gâteau',
      description: 'Bolinho de chocolate belga 70% cacau com centro cremoso quente, servido com sorvete de creme artesanal e raspas de chocolate. O clássico das sobremesas.',
      price: 22.90,
      imageUrl: px(45202),
      available: true,
      sortOrder: 3,
    },
    {
      id: 'prod-cheesecake-frutas',
      categoryId: catS,
      tenantId: tenant.id,
      name: 'Cheesecake Frutas Vermelhas',
      description: 'Cheesecake cremoso de cream cheese com base de biscoito amanteigado e cobertura de calda quente de frutas vermelhas (morango, framboesa e mirtilo). Fatia generosa.',
      price: 21.90,
      imageUrl: px(3407777),
      available: true,
      sortOrder: 4,
    },
    {
      id: 'prod-sorvete-2bolas',
      categoryId: catS,
      tenantId: tenant.id,
      name: 'Sorvete 2 Bolas',
      description: 'Escolha 2 sabores artesanais: Creme, Chocolate Belga, Morango, Doce de Leite, Pistache ou Maracujá. Servido em casquinha crocante ou copo. Coberturas à escolha.',
      price: 14.90,
      imageUrl: uns('1497034825429-c343d7c6a68f'),
      available: true,
      sortOrder: 5,
    },
    {
      id: 'prod-torta-limao',
      categoryId: catS,
      tenantId: tenant.id,
      name: 'Torta de Limão',
      description: 'Torta gelada de limão siciliano com base de biscoito, creme azedinho no ponto certo e cobertura de merengue tostado. Leve e refrescante para fechar a refeição.',
      price: 18.90,
      imageUrl: px(1099680),
      available: true,
      sortOrder: 6,
    },
    {
      id: 'prod-pudim',
      categoryId: catS,
      tenantId: tenant.id,
      name: 'Pudim de Leite Condensado',
      description: 'Pudim artesanal de leite condensado assado em banho-maria, com calda de caramelo queimado. Receita da avó, do tamanho individual. A sobremesa brasileira mais amada.',
      price: 13.90,
      imageUrl: px(291528),
      available: true,
      sortOrder: 7,
    },
    {
      id: 'prod-bolo-chocolate',
      categoryId: catS,
      tenantId: tenant.id,
      name: 'Fatia de Bolo de Chocolate',
      description: 'Bolo úmido de chocolate belga com ganache cremosa, raspas de chocolate e nozes caramelizadas. Fatia grande. Para os amantes de chocolate de plantão.',
      price: 16.90,
      imageUrl: uns('1606313564200-e75d5e394746'),
      available: true,
      sortOrder: 8,
    },
  ]

  // Filtra produtos com imageUrl duplicada na lógica do Philly (erro de digitação acima)
  const uniqueProducts = products.filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
  )

  let created = 0
  for (const product of uniqueProducts) {
    // Corrige possível campo duplicado no Philly Steak
    const { ...data } = product as any
    if (Array.isArray(data.imageUrl)) data.imageUrl = data.imageUrl[1]

    await prisma.product.upsert({
      where: { id: data.id },
      update: {},
      create: data,
    })
    created++
    process.stdout.write(`  ✓ ${data.name}\n`)
  }

  // Invalida cache para forçar recarregar dados frescos
  console.log(`\n✅ ${created} novos produtos cadastrados!`)
  console.log('\n📊 Cardápio atual:')

  const counts = await prisma.category.findMany({
    where: { tenantId: tenant.id },
    include: { _count: { select: { products: true } } },
    orderBy: { order: 'asc' },
  })
  for (const c of counts) {
    console.log(`   ${c.name}: ${c._count.products} produtos`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
