import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Botones de la marca HECIAN LC v0.1.0 (src/marca/hecian-botones.css). Los colores salen de los tokens del portal
// (src/hmi/tokens.css → «Puente con la marca»), así siguen al tema y al color del portal.
// - primario (default): uno por pantalla o diálogo; secundario (secondary/outline): neutro con borde gris;
//   terciario (ghost/link): solo texto; destructivo: texto y borde burdeos, nunca relleno y SIEMPRE con confirmación.
// - Nunca colores de estado (rojo, naranja, amarillo, violeta) en un botón: son de las alarmas (guía hmi-industrial).
// - Altos: 32 px en la computadora (24 con «compacto», 44 con «tactil»); en el celular siempre 44 (blanco táctil).
// - barra / barra-primario: sobre el negro mate del menú y del encabezado del celular.
const buttonVariants = cva(
  'hlc-btn max-md:[--alto:44px]',
  {
    variants: {
      variant: {
        default: 'hlc-btn--primario',
        secondary: 'hlc-btn--secundario',
        outline: 'hlc-btn--secundario',
        ghost: 'hlc-btn--terciario',
        link: 'hlc-btn--terciario',
        destructive: 'hlc-btn--destructivo',
        barra: 'hlc-btn--barra',
        'barra-primario': 'hlc-btn--barra-primario'
      },
      size: {
        default: '',
        sm: '',
        compacto: 'hlc-btn--compacto',
        lg: 'hlc-btn--tactil',
        tactil: 'hlc-btn--tactil',
        icon: 'hlc-btn--icono'
      }
    },
    defaultVariants: { variant: 'default', size: 'default' }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = 'Button'

export { buttonVariants }
