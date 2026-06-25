export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-white rounded-card border border-gray-200 shadow-sm p-7 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
