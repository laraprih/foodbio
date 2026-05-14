'use client'

import CardPaymentForm from './CardPaymentForm'

interface PaymentFormPBProps {
  amount: number
  onSuccess: (encryptedCard: string) => void
  loading?: boolean
}

export default function PaymentFormPB(props: PaymentFormPBProps) {
  return <CardPaymentForm {...props} gateway="pagbank" />
}
