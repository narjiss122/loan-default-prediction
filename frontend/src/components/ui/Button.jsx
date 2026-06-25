const VARIANTS = {
  primary:   'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-400',
  danger:    'bg-danger-600 text-white hover:bg-danger-700 focus-visible:ring-danger-500',
}

export default function Button({
  variant = 'primary',
  disabled = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        px-5 py-3 rounded-lg text-sm font-medium
        transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-none
        ${VARIANTS[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
