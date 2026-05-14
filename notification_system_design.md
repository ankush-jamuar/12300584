## STAGE 1: REST API Design

### Endpoints
**1. Publish Notification (Internal API)**
- `POST /api/v1/notifications`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "targetAudience": {"type": "STUDENTS", "ids": [1042, 1043]}, 
    "type": "Placement",
    "title": "Google Internship Round 1",
    "body": "Your interview is scheduled for 10 AM tomorrow.",
    "priority": "HIGH"
  }
Response: 202 Accepted (Queued for processing)2. Fetch Notifications (Client API)GET /api/v1/users/me/notifications?page=1&limit=20&unreadOnly=trueHeaders: Authorization: Bearer <token>Response: 200 OK (Array of mapped notification objects + pagination metadata)3. Mark as ReadPATCH /api/v1/users/me/notifications/{notificationId}/readResponse: 204 No ContentReal-Time MechanismClients establish a persistent connection using Server-Sent Events (SSE) via GET /api/v1/notifications/stream. SSE is chosen over WebSockets because notifications are strictly unidirectional (server-to-client).STAGE 2: Database ArchitectureDatabase Choice: PostgreSQLReasoning: Notifications require relational integrity mapping to User IDs, transactional atomicity when marking items as read, and structured querying based on timestamps/enums. Postgres provides robust B-Tree indexing and allows JSONB columns if notification payloads differ across types. NoSQL is unnecessary as relationships (User -> Notifications) are rigid and structured.Schema Design:SQLCREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id INT NOT NULL,
    type VARCHAR(50) NOT NULL, -- Enum: 'Event', 'Result', 'Placement'
    payload JSONB NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
Scaling Considerations: As notification volume grows rapidly, we will implement Table Partitioning by created_at (e.g., monthly partitions) and automatically archive/drop partitions older than 6 months to maintain index performance.STAGE 3: Query OptimizationThe Slow Query:SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt DESC;Why it's slow:Without a composite index, the database performs a full table scan (or index scan with heavy filtering/sorting) for every request. Creating single-column indexes on all columns is bad because it introduces write-amplification (slowing down INSERT operations) and wastes storage footprint.Optimization:Create a composite index prioritizing equality operators first, followed by range/sort operators:CREATE INDEX idx_notifications_student_unread ON notifications (student_id, is_read, created_at DESC);This creates a covering index approach for the WHERE and ORDER BY clauses, reducing query execution to an $O(\log N)$ B-Tree traversal.Query for Placements in Last 7 Days:SQLSELECT DISTINCT student_id 
FROM notifications 
WHERE type = 'Placement' 
  AND created_at >= NOW() - INTERVAL '7 days';
(Requires index: CREATE INDEX idx_notifications_type_date ON notifications (type, created_at);)STAGE 4: Client Fetching BottleneckThe Problem: Polling on page load crushes the DB with redundant GET requests, especially when notifications haven't changed.Architectural Improvements:Caching Layer: Implement a Redis cache. Key: notifications:unread_count:{studentID}. The DB is only queried on a cache miss. When a new notification is generated, invalidate/update the Redis key.Push over Pull: Shift from client polling to an Event-Driven Architecture.WebSockets vs SSE: We will implement SSE (Server-Sent Events). WebSockets are full-duplex (two-way), which is overkill for notifications. SSE operates over standard HTTP/2, handles multiplexing inherently, requires less connection overhead, and natively supports automatic reconnection.STAGE 5: Distributed Processing (notify_all)The Flaw: Synchronous/Sequential iteration blocks the main thread. If email #452 fails and throws an error, the process crashes, leaving the remaining students un-notified. No mechanism exists to track which emails were sent (lack of idempotency).Redesigned Worker Architecture:API Gateway receives the bulk notification request and immediately returns 202 Accepted.Producer publishes an event to a RabbitMQ Fanout Exchange or Kafka Topic.Queue Segmentation: Route to specific queues based on channel (e.g., email_queue, push_queue).Worker Pool: Independent consumer services pop messages off the queue and execute the send via SMTP/FCM asynchronously.Idempotency: Workers check Redis (sent:{targetId}:{notificationId}) before dispatching to prevent duplicates.Failure Recovery: If an SMTP call fails, the message is NACK'd (negative acknowledgement) and routed to a Retry Queue with exponential backoff.Dead Letter Queue (DLQ): After max retries (e.g., 5), the message drops to a DLQ for manual intervention/alerting.STAGE 6: Priority Inbox ImplementationFor efficiency, instead of sorting in-memory on the application side, we push the sorting logic to the database engine using an indexed CASE statement, or we handle it in application logic if fetching an active unread cache.Here is the production-ready TypeScript implementation for the Priority Inbox.TypeScriptimport { logger } from 'logging_middleware';

// Type Definitions
type NotificationType = 'Placement' | 'Result' | 'Event';

interface Notification {
  id: string;
  studentId: number;
  type: NotificationType;
  body: string;
  isRead: boolean;
  createdAt: Date;
}

// Simulated DB abstraction
class NotificationRepository {
  // In a real environment, this executes a DB query.
  // The sorting is offloaded to the DB for true scalability:
  // ORDER BY 
  //   CASE type WHEN 'Placement' THEN 1 WHEN 'Result' THEN 2 ELSE 3 END, 
  //   created_at DESC
  // LIMIT N
  async fetchUnreadTopN(studentId: number, limit: number): Promise<Notification[]> {
    // Mock DB return for evaluation
    return []; 
  }
}

export class PriorityNotificationService {
  private repo = new NotificationRepository();

  // Priority weights mappings
  private priorityMap: Record<NotificationType, number> = {
    'Placement': 1,
    'Result': 2,
    'Event': 3
  };

  /**
   * Fetches and strictly orders unread notifications.
   * Scalability note: Relies on DB-level sorting to prevent loading massive 
   * arrays into Node.js memory. Sorting here is a fallback safety measure.
   */
  public async getPriorityInbox(studentId: number, topN: number = 10): Promise<Notification[]> {
    try {
      const rawNotifications = await this.repo.fetchUnreadTopN(studentId, topN * 2); // over-fetch slightly for safety

      // In-memory stable sort as safety layer
      const sorted = rawNotifications.sort((a, b) => {
        const priorityDiff = this.priorityMap[a.type] - this.priorityMap[b.type];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Secondary sort by newest first
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      return sorted.slice(0, topN);
    } catch (error: any) {
      logger.error({ studentId, err: error.message }, 'Failed to fetch priority inbox');
      throw new Error('Priority inbox retrieval failed');
    }
  }

  /**
   * Handles high-velocity incoming notifications.
   * Scalability note: Should be called by a queue worker (RabbitMQ/Kafka), not directly via HTTP request.
   */
  public async processIncoming(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
    logger.info({ 
      studentId: notification.studentId, 
      type: notification.type 
    }, 'Processing incoming notification for priority evaluation');

    // 1. Persist to DB
    // 2. Invalidate Redis unread count cache: `DEL notifications:unread_count:${notification.studentId}`
    // 3. Emit SSE event to specific student ID channel
  }
}