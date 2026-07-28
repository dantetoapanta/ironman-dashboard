export default function StarIcon({ className = "h-5 w-5", color = "currentColor" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1.5l3.09 6.26 6.91 1.01-5 4.87 1.18 6.88L12 17.27l-6.18 3.25 1.18-6.88-5-4.87 6.91-1.01L12 1.5z" />
    </svg>
  );
}
