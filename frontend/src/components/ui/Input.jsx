export default function Input({ label, error, id, className = '', ...props }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full px-3.5 py-3 rounded-lg text-sm
          border bg-white text-gray-800 placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-offset-0
          ${error
            ? 'border-danger-400 focus:ring-danger-400'
            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-danger-600">{error}</p>}
    </div>
  )
}
