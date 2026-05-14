import { Request, Response } from 'express';
import { fetchDepotData, fetchVehicleTasks } from '../services/apiclient';
import { computeOptimalSchedule } from '../scheduler/knapsack';
import { logger } from 'logging_middleware';

export const generateSchedule = async (req: Request, res: Response) => {
  const depotId = req.params.depotId as string;

  try {
    logger('backend', 'info', 'controller', `Starting schedule generation for depot: ${depotId}`);

    const [depotData, tasks] = await Promise.all([
      fetchDepotData(depotId),
      fetchVehicleTasks(depotId)
    ]);

    const { MechanicHours } = depotData;
    const schedule = computeOptimalSchedule(MechanicHours, tasks);

    logger('backend', 'info', 'controller', `Schedule generated successfully. Selected ${schedule.selectedTasks.length} tasks.`);

    res.status(200).json({ depotId, ...schedule });
  } catch (error: any) {
    logger('backend', 'error', 'controller', `Schedule generation failed: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error during schedule generation' });
  }
};