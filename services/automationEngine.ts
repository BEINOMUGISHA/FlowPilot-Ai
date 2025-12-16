
import { AutomationRule, Task, AppNotification, TriggerType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface AutomationResult {
  updatedTasks: Task[];
  newNotifications: AppNotification[];
  triggeredRules: string[]; // IDs of rules that fired
}

export const runAutomations = (
  tasks: Task[], 
  rules: AutomationRule[], 
  triggerContext: TriggerType, 
  relatedTask?: Task
): AutomationResult => {
  let updatedTasks = [...tasks];
  const newNotifications: AppNotification[] = [];
  const triggeredRules: string[] = [];

  // Filter active rules that match the trigger context
  const activeRules = rules.filter(r => r.active && r.triggerType === triggerContext);

  activeRules.forEach(rule => {
    let shouldFire = false;
    let targetTask = relatedTask;

    // 1. Check Conditions
    switch (rule.triggerType) {
      case 'ON_CREATE':
        // Checks if new task matches conditions (e.g., priority or keyword)
        if (targetTask) {
          shouldFire = true; 
        }
        break;

      case 'KEYWORD_MATCH':
        if (targetTask && rule.triggerCondition) {
          const keyword = rule.triggerCondition.toLowerCase();
          shouldFire = targetTask.title.toLowerCase().includes(keyword) || 
                       (targetTask.description || '').toLowerCase().includes(keyword);
        }
        break;

      case 'ON_COMPLETE':
        if (targetTask && targetTask.status === 'completed') {
          shouldFire = true;
        }
        break;

      case 'ON_OVERDUE':
        // Handled slightly differently - we scan ALL tasks
        const overdueTasks = updatedTasks.filter(t => 
          t.status !== 'completed' && 
          new Date(t.dueDate).getTime() < Date.now()
        );
        if (overdueTasks.length > 0) {
          // Fire for each overdue task? Or once? 
          // For simplicity, we'll fire once per run if any are overdue
          // In a real app, you'd track which tasks were already processed for this rule
          shouldFire = true;
          // We pick the first one as the 'target' for context in notification
          targetTask = overdueTasks[0]; 
        }
        break;
    }

    // 2. Execute Action if Fired
    if (shouldFire) {
      triggeredRules.push(rule.id);

      switch (rule.actionType) {
        case 'NOTIFY':
          newNotifications.push({
            id: uuidv4(),
            type: 'automation',
            source: 'FlowPilot',
            title: `Automation: ${rule.name}`,
            message: rule.actionTarget || `Rule triggered by task: ${targetTask?.title}`,
            timestamp: new Date().toISOString(),
            read: false,
            priority: 'normal'
          });
          break;

        case 'SET_PRIORITY':
          if (targetTask && rule.actionTarget) {
            updatedTasks = updatedTasks.map(t => 
              t.id === targetTask!.id 
                ? { ...t, priority: rule.actionTarget as any } 
                : t
            );
          }
          break;
          
        case 'DELETE':
           if (targetTask) {
             updatedTasks = updatedTasks.filter(t => t.id !== targetTask!.id);
           }
           break;
      }
    }
  });

  return { updatedTasks, newNotifications, triggeredRules };
};
