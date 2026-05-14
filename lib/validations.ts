import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha com no mínimo 6 caracteres'),
});

export const checkoutSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone inválido'),
  deliveryType: z.enum(['delivery', 'pickup']),
  address: z.object({
    street: z.string().min(1, 'Rua obrigatória'),
    number: z.string().min(1, 'Número obrigatório'),
    neighborhood: z.string().min(1, 'Bairro obrigatório'),
    city: z.string().min(1, 'Cidade obrigatória'),
  }).optional(),
  paymentMethod: z.enum(['pix', 'credit_card']),
}).refine((data) => {
  if (data.deliveryType === 'delivery' && !data.address) {
    return false;
  }
  return true;
}, {
  message: 'Endereço é obrigatório para entrega',
  path: ['address'],
});

export const connectPagBankSchema = z.object({
  email: z.string().email('E-mail da conta PagBank inválido'),
});

export const productSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(80, 'Nome muito longo'),
  description: z.string().max(300, 'Descrição muito longa').optional(),
  price: z.number().positive('Preço deve ser positivo'),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  available: z.boolean().default(true),
});
