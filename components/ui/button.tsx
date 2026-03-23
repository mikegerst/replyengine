import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const variantStyles = {
  primary:
    'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400',
  secondary:
    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100',
  danger:
    'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:text-gray-300',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-medium rounded-md transition-colors disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
