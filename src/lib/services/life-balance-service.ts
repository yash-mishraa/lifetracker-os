import { LifeArea, LifeBalanceData, LifeBalanceScore } from "@/lib/types/life-balance";
import { getTasks } from "./task-service";
import { getHabits, getHabitLogs } from "./habit-service";
import { getGoals } from "./goal-service";
import { getHealthLogs } from "./health-service";

export async function getLifeBalanceData(): Promise<LifeBalanceData> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDateStr = thirtyDaysAgo.toISOString();

  // 1. Fetch all raw data (in a real app, we'd filter by date in the DB query, 
  // but for local/demo purposes we fetch and filter).
  const [allTasks, allHabits, allHabitLogs, allGoals, allHealthLogs] = await Promise.all([
    getTasks(),
    getHabits(),
    getHabitLogs(),
    getGoals(),
    getHealthLogs()
  ]);

  // Filter for last 30 days where applicable
  const recentTasks = allTasks.filter(t => t.created_at >= startDateStr || (t.completed_at && t.completed_at >= startDateStr));
  const recentHabitLogs = allHabitLogs.filter(log => new Date(log.date) >= thirtyDaysAgo);
  const recentHealthLogs = allHealthLogs.filter(log => new Date(log.date) >= thirtyDaysAgo);

  // Initialize scores
  const scores: Record<LifeArea, number> = {
    Work: 0,
    Health: 0,
    Learning: 0,
    Personal: 0,
    Finance: 0,
    Social: 0,
  };

  // Helper calculation functions
  
  // -- Calculate Work Score --
  // Based on Tasks (Project contains work/career), Goals (Career), Habits (Productivity)
  const workTasks = recentTasks.filter(t => 
    t.project?.name.toLowerCase().includes('work') || 
    t.tags.some(tag => tag.toLowerCase().includes('work') || tag.toLowerCase().includes('career'))
  );
  const workGoals = allGoals.filter(g => g.category === 'Career');
  const workHabits = allHabits.filter(h => h.category === 'Productivity');
  
  const workTaskScore = calculateTaskCompletionScore(workTasks);
  const workHabitScore = calculateHabitCompletionScore(workHabits, recentHabitLogs);
  const workGoalScore = Math.min((workGoals.length * 10), 100); // Simple proxy: having career goals adds points
  
  scores.Work = averageScores([workTaskScore, workHabitScore, workGoalScore]);

  // -- Calculate Health Score --
  // Based on Health Logs, Habits (Health & Fitness), Goals (Health)
  const healthTasks = recentTasks.filter(t => 
    t.project?.name.toLowerCase().includes('health') || 
    t.tags.some(tag => ['health', 'workout', 'fitness', 'medical'].includes(tag.toLowerCase()))
  );
  const healthGoals = allGoals.filter(g => g.category === 'Health');
  const healthHabits = allHabits.filter(h => h.category === 'Health & Fitness');
  
  const healthHabitScore = calculateHabitCompletionScore(healthHabits, recentHabitLogs);
  const healthMetricScore = calculateHealthMetricScore(recentHealthLogs);
  const healthTaskScore = calculateTaskCompletionScore(healthTasks);
  const healthGoalScore = Math.min((healthGoals.length * 10), 100);

  scores.Health = averageScores([healthHabitScore, healthMetricScore, healthTaskScore, healthGoalScore]);

  // -- Calculate Learning Score --
  // Based on Tasks (Learning), Goals (Learning), Habits (Learning)
  const learningTasks = recentTasks.filter(t => 
    t.project?.name.toLowerCase().includes('learn') || 
    t.tags.some(tag => ['learning', 'study', 'course', 'reading'].includes(tag.toLowerCase()))
  );
  const learningGoals = allGoals.filter(g => g.category === 'Learning');
  const learningHabits = allHabits.filter(h => h.category === 'Learning');

  const learningTaskScore = calculateTaskCompletionScore(learningTasks);
  const learningHabitScore = calculateHabitCompletionScore(learningHabits, recentHabitLogs);
  const learningGoalScore = Math.min((learningGoals.length * 10), 100);

  scores.Learning = averageScores([learningTaskScore, learningHabitScore, learningGoalScore]);

  // -- Calculate Personal Score --
  // Based on Tasks (Personal), Goals (Personal), Habits (Mindfulness)
  const personalTasks = recentTasks.filter(t => 
    t.project?.name.toLowerCase().includes('personal') || 
    t.tags.some(tag => ['personal', 'errand', 'home'].includes(tag.toLowerCase()))
  );
  const personalGoals = allGoals.filter(g => g.category === 'Personal');
  const personalHabits = allHabits.filter(h => h.category === 'Mindfulness' || h.category === 'Other');

  const personalTaskScore = calculateTaskCompletionScore(personalTasks);
  const personalHabitScore = calculateHabitCompletionScore(personalHabits, recentHabitLogs);
  const personalGoalScore = Math.min((personalGoals.length * 10), 100);

  scores.Personal = averageScores([personalTaskScore, personalHabitScore, personalGoalScore]);

  // -- Calculate Finance Score --
  // Based on Tasks (Finance), Goals (Finance), Habits (Finance)
  const financeTasks = recentTasks.filter(t => 
    t.project?.name.toLowerCase().includes('finance') || 
    t.tags.some(tag => ['finance', 'money', 'budget', 'bills'].includes(tag.toLowerCase()))
  );
  const financeGoals = allGoals.filter(g => g.category === 'Finance');
  const financeHabits = allHabits.filter(h => h.category === 'Finance');

  const financeTaskScore = calculateTaskCompletionScore(financeTasks);
  const financeHabitScore = calculateHabitCompletionScore(financeHabits, recentHabitLogs);
  const financeGoalScore = Math.min((financeGoals.length * 10), 100);

  scores.Finance = averageScores([financeTaskScore, financeHabitScore, financeGoalScore]);

  // -- Calculate Social Score --
  // Based on Tasks (Social tags)
  const socialTasks = recentTasks.filter(t => 
    t.project?.name.toLowerCase().includes('social') || 
    t.tags.some(tag => ['social', 'friends', 'family', 'event', 'party'].includes(tag.toLowerCase()))
  );
  const socialTaskScore = calculateTaskCompletionScore(socialTasks);
  
  // If there's barely any social data tracked natively, let's bump it up slightly based on weekends or generic activity
  scores.Social = socialTasks.length > 0 ? socialTaskScore : 50; 


  // Formatting for Recharts Output
  const radarScores: LifeBalanceScore[] = [
    { area: "Work", score: scores.Work, label: "Work", fullMark: 100 },
    { area: "Health", score: scores.Health, label: "Health", fullMark: 100 },
    { area: "Learning", score: scores.Learning, label: "Learning", fullMark: 100 },
    { area: "Personal", score: scores.Personal, label: "Personal", fullMark: 100 },
    { area: "Finance", score: scores.Finance, label: "Finance", fullMark: 100 },
    { area: "Social", score: scores.Social, label: "Social", fullMark: 100 },
  ];

  const validScores = Object.values(scores).filter(s => s > 0);
  const overallBalanceScore = validScores.length > 0 
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : 0;

  return {
    scores: radarScores,
    overallBalanceScore,
    lastUpdated: new Date().toISOString()
  };
}

// --- Scoring Helpers ---

function averageScores(scores: number[]): number {
  const activeScores = scores.filter(s => s > 0);
  if (activeScores.length === 0) return 30; // Base score if no data is tracked
  const sum = activeScores.reduce((a, b) => a + b, 0);
  return Math.round(sum / activeScores.length);
}

function calculateTaskCompletionScore(tasks: any[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

function calculateHabitCompletionScore(habits: any[], logs: any[]): number {
  if (habits.length === 0) return 0;
  
  let totalExpectedCompletions = 0;
  let totalActualCompletions = 0;

  habits.forEach(habit => {
    // Assuming simple calculation for demo: 1 completion per day tracked
    totalExpectedCompletions += 30; 
    const habitLogs = logs.filter(l => l.habit_id === habit.id && l.completed);
    totalActualCompletions += habitLogs.length;
  });

  return Math.round((totalActualCompletions / totalExpectedCompletions) * 100);
}

function calculateHealthMetricScore(logs: any[]): number {
  if (logs.length === 0) return 0;
  
  let scoreSum = 0;
  logs.forEach(log => {
    let dayScore = 0;
    if (log.sleep_hours >= 7) dayScore += 30;
    else if (log.sleep_hours >= 5) dayScore += 15;
    
    if (log.water_intake >= 2000) dayScore += 30; // Assuming ml
    else if (log.water_intake >= 4) dayScore += 30; // Assuming glasses
    else if (log.water_intake > 0) dayScore += 15;

    if (log.workout_done) dayScore += 40;
    else if (log.steps >= 8000) dayScore += 40;
    else if (log.steps >= 4000) dayScore += 20;

    scoreSum += Math.min(dayScore, 100);
  });

  return Math.round(scoreSum / logs.length);
}
