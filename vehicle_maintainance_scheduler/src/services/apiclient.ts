import axios from 'axios';
import { logger } from 'logging_middleware';

const DEPOT_API_URL = process.env.DEPOT_API_URL || 'http://dummy-depot-api';
const TASKS_API_URL = process.env.TASKS_API_URL || 'http://dummy-tasks-api';

export const fetchDepotData = async (depotId: string) => {
  try {
    const res = await axios.get(`${DEPOT_API_URL}/depots/${depotId}`);
    return res.data; 
  } catch (error: any) {
    logger('backend', 'error', 'service', `Failed to fetch depot data for ${depotId}: ${error.message}`);
    throw error;
  }
};

export const fetchVehicleTasks = async (depotId: string) => {
  try {
    const res = await axios.get(`${TASKS_API_URL}/depots/${depotId}/tasks`);
    return res.data; 
  } catch (error: any) {
    logger('backend', 'error', 'service', `Failed to fetch vehicle tasks for ${depotId}: ${error.message}`);
    throw error;
  }
};