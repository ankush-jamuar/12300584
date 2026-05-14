import express from 'express';
import { requestLogger, requireAuth } from 'logging_middleware';
import { generateSchedule } from './controllers/scheduleController';

const app = express();

app.use(express.json());
app.use(requestLogger);

app.post('/api/v1/depots/:depotId/schedule', requireAuth, generateSchedule);

export default app;