export interface Task {
  TaskID: string;
  Duration: number;
  Impact: number;
}

export interface ScheduleResult {
  selectedTasks: Task[];
  totalImpact: number;
  totalDuration: number;
}

export const computeOptimalSchedule = (mechanicHours: number, tasks: Task[]): ScheduleResult => {
  const n = tasks.length;
  const dp: number[][] = Array(n + 1).fill(0).map(() => Array(mechanicHours + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const task = tasks[i - 1];
    for (let w = 0; w <= mechanicHours; w++) {
      if (task.Duration <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - task.Duration] + task.Impact);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  let res = dp[n][mechanicHours];
  let w = mechanicHours;
  const selectedTasks: Task[] = [];
  let totalDuration = 0;

  for (let i = n; i > 0 && res > 0; i--) {
    if (res !== dp[i - 1][w]) {
      const task = tasks[i - 1];
      selectedTasks.push(task);
      res -= task.Impact;
      w -= task.Duration;
      totalDuration += task.Duration;
    }
  }

  return {
    selectedTasks: selectedTasks.reverse(),
    totalImpact: dp[n][mechanicHours],
    totalDuration
  };
};
