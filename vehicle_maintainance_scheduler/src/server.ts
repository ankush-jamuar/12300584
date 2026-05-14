import app from './app';
import { logger } from 'logging_middleware';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger('backend', 'info', 'service', `Vehicle Maintenance Scheduler running on port ${PORT}`);
});