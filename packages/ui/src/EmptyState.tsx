interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = "🌱",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 text-center py-16 space-y-3">
      <p className="text-4xl">{icon}</p>
      <p className="font-semibold text-gray-700">{title}</p>
      {description && (
        <p className="text-sm text-gray-400 max-w-xs mx-auto">{description}</p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
