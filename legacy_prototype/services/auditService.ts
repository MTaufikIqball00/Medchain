export interface AuditLog {
  id: string;
  timestamp: number;
  action: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'MFA_REQUEST' | 'MFA_SUCCESS';
  userId?: string;
  details: string;
  ip: string;
  device: string;
}

export const logAudit = (action: AuditLog['action'], userId: string | undefined, details: string) => {
  const log: AuditLog = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    action,
    userId,
    details,
    ip: '192.168.1.X', // Mock IP
    device: navigator.userAgent
  };

  const existingLogs = JSON.parse(localStorage.getItem('medchain_audit_logs') || '[]');
  existingLogs.push(log);
  localStorage.setItem('medchain_audit_logs', JSON.stringify(existingLogs));
  console.log(`[AUDIT TRAIL] ${action}: ${details}`, log);
};
