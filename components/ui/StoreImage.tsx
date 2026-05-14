import Image from 'next/image'

interface Props {
  src: string
  alt: string
  fill?: boolean
  className?: string
  width?: number
  height?: number
  referrerPolicy?: React.HTMLAttributeReferrerPolicy
}

export function StoreImage({ src, alt, fill, className, width, height, referrerPolicy }: Props) {
  if (src.startsWith('data:')) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } : undefined}
        width={width}
        height={height}
      />
    )
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      referrerPolicy={referrerPolicy}
    />
  )
}
