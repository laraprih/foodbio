import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha com no mínimo 6 caracteres'),
});

const addressSchema = z.object({
  cep: z.string().refine(v => v.replace(/\D/g, '').length === 8, 'CEP inválido'),
  street: z.string().min(1, 'Rua obrigatória'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro obrigatório'),
  city: z.string().min(1, 'Cidade obrigatória'),
  state: z.string().min(2, 'Estado obrigatório'),
});

export const checkoutSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().refine(v => v.replace(/\D/g, '').length >= 10, 'Telefone inválido'),
  deliveryType: z.enum(['delivery', 'pickup']),
  address: addressSchema.optional(),
  paymentMethod: z.enum(['pix', 'credit_card']),
}).superRefine((data, ctx) => {
  if (data.deliveryType !== 'delivery') return;
  const addr = data.address;
  if (!addr?.cep || addr.cep.replace(/\D/g, '').length !== 8) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'CEP inválido', path: ['address', 'cep'] });
  }
  if (!addr?.street) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Rua obrigatória', path: ['address', 'street'] });
  }
  if (!addr?.number) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Número obrigatório', path: ['address', 'number'] });
  }
  if (!addr?.neighborhood) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bairro obrigatório', path: ['address', 'neighborhood'] });
  }
  if (!addr?.city) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Cidade obrigatória', path: ['address', 'city'] });
  }
  if (!addr?.state || addr.state.length < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Estado obrigatório', path: ['address', 'state'] });
  }
});

export const connectPagBankSchema = z.object({
  email: z.string().email('E-mail da conta PagBank inválido'),
});

export const productSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(80, 'Nome muito longo'),
  description: z.string().max(300, 'Descrição muito longa').optional(),
  price: z.number().positive('Preço deve ser positivo'),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  available: z.boolean(),
});
