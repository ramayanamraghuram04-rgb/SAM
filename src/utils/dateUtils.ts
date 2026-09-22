/**
 * Date formatting and deadline calculation utilities.
 */

export function formatDate(isoOrString: string): string {
  if (!isoOrString) return '—';
  try {
    const d = new Date(isoOrString);
    if (isNaN(d.getTime())) return isoOrString;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoOrString;
  }
}

export function formatDateTime(isoOrString: string): string {
  if (!isoOrString) return '—';
  try {
    const d = new Date(isoOrString);
    if (isNaN(d.getTime())) return isoOrString;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoOrString;
  }
}

export function getDaysRemaining(dueDateStr: string): { text: string; isOverdue: boolean; isUrgent: boolean } {
  if (!dueDateStr) return { text: '', isOverdue: false, isUrgent: false };
  try {
    let due: Date;
    if (dueDateStr.includes('T')) {
      due = new Date(dueDateStr);
    } else {
      const parts = dueDateStr.split('-');
      if (parts.length === 3) {
        due = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        due = new Date(dueDateStr);
      }
    }

    if (isNaN(due.getTime())) {
      return { text: '', isOverdue: false, isUrgent: false };
    }

    const now = new Date();
    // Compare date boundaries at start of day
    const dueZero = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.round((dueZero - nowZero) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const pastDays = Math.abs(diffDays);
      return {
        text: `Overdue by ${pastDays} day${pastDays > 1 ? 's' : ''}`,
        isOverdue: true,
        isUrgent: true,
      };
    } else if (diffDays === 0) {
      return {
        text: 'Due Today',
        isOverdue: false,
        isUrgent: true,
      };
    } else if (diffDays === 1) {
      return {
        text: 'Due Tomorrow',
        isOverdue: false,
        isUrgent: true,
      };
    } else {
      return {
        text: `${diffDays} days left`,
        isOverdue: false,
        isUrgent: diffDays <= 3,
      };
    }
  } catch {
    return { text: '', isOverdue: false, isUrgent: false };
  }
}

export type AssignmentDisplayStatus = 'NEW' | 'PENDING' | 'SUBMITTED' | 'RETURNED' | 'GRADED' | 'OVERDUE';

/**
 * Resolve display status for student assignment cards according to Step 11 requirements:
 * NEW, PENDING, SUBMITTED, RETURNED, GRADED, OVERDUE
 */
export function getAssignmentDisplayStatus(
  assignment: { dueDate: string; createdAt: string },
  submission?: { status: string } | null
): AssignmentDisplayStatus {
  if (submission) {
    if (submission.status === 'checked') return 'GRADED';
    if (submission.status === 'returned') return 'RETURNED';
    if (submission.status === 'submitted' || submission.status === 'under_review') return 'SUBMITTED';
  }

  const deadline = getDaysRemaining(assignment.dueDate);
  if (deadline.isOverdue) return 'OVERDUE';

  // Check if created recently within the last 3 days
  try {
    const createdTime = new Date(assignment.createdAt).getTime();
    if (!isNaN(createdTime)) {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      if (createdTime > threeDaysAgo) return 'NEW';
    }
  } catch {
    // ignore
  }

  return 'PENDING';
}
