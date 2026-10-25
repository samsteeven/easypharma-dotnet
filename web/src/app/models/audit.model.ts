export interface AuditLog {
    id: string;
    userId: string;
    username: string;
    action: string;
    entityType: string;
    entityId: string;
    details: string;
    ipAddress: string;
    timestamp: string;
    pharmacyId: string;
    status: string;
}

export interface AuditLogResponse {
    content: AuditLog[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}
