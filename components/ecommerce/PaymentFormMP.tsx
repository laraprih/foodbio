'use client'

import CardPaymentForm from './CardPaymentForm'

interface PaymentFormMPProps {
  amount: number
  onSuccess: (token: string) => void
  loading?: boolean
}

export default function PaymentFormMP(props: PaymentFormMPProps) {
  return <CardPaymentForm {...props} gateway="mercadopago" />
}
