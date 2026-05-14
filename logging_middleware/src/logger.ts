import axios from 'axios';

export type StackType = 'backend' | 'frontend';
export type LevelType = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type PackageType = 'cache' | 'controller' | 'cron_job' | 'db' | 'domain' | 'handler' | 'repository' | 'route' | 'service' | 'auth' | 'config' | 'middleware' | 'utils' | 'api' | 'component' | 'hook' | 'page' | 'state' | 'style';

const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhbmt1c2guamFtdWFyQGdtYWlsLmNvbSIsImV4cCI6MTc3ODc2NDAyNSwiaWF0IjoxNzc4NzYzMTI1LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNzhkMzBhNTQtYzc0YS00YzllLTkzN2UtNDVhMDlhY2FiNDI0IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoiYW5rdXNoIiwic3ViIjoiNjNlY2Y4MDQtMWE0Zi00MWU4LWIwN2ItZTQyODUwYjRiMTAyIn0sImVtYWlsIjoiYW5rdXNoLmphbXVhckBnbWFpbC5jb20iLCJuYW1lIjoiYW5rdXNoIiwicm9sbE5vIjoiMTIzMDA1ODQiLCJhY2Nlc3NDb2RlIjoiVFJ2WldxIiwiY2xpZW50SUQiOiI2M2VjZjgwNC0xYTRmLTQxZTgtYjA3Yi1lNDI4NTBiNGIxMDIiLCJjbGllbnRTZWNyZXQiOiJwaFBDellYcmVCWnFjZlJYIn0.JuQiCnGe5aI0ouZMQC_IRkp2ew4tunxvOgOAApedsTA"; 
const LOG_API_URL = "http://4.224.186.213/evaluation-service/logs";

export const logger = async (stack: StackType, level: LevelType, pkg: PackageType, message: string) => {

  const safeMessage = message.substring(0, 48);

  try {
    const response = await axios.post(
      LOG_API_URL,
      { stack, level, package: pkg, message: safeMessage },
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`[${level.toUpperCase()}] Log sent! ID:`, response.data.logID);
  } catch (error: any) {
    console.error("❌ Failed to send remote log:", error?.response?.data || error.message);
  }
};