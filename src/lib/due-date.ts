export type DueDateUrgency = 'overdue' | 'soon' | 'normal';

/** "soon" = due within 24 hours. Standard 2-tier warning pattern (red/amber/neutral). */
export function getDueDateUrgency(dueDate: string): DueDateUrgency {
  const diffMs = new Date(dueDate).getTime() - Date.now();
  if (diffMs < 0) return 'overdue';
  if (diffMs <= 24 * 60 * 60 * 1000) return 'soon';
  return 'normal';
}

export function formatDueDate(dueDate: string): string {
  return new Date(dueDate).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
