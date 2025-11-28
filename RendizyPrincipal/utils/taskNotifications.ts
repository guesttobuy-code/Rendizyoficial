import { ServiceTicket, ServiceTask } from '../types/funnels';

export interface TaskNotification {
  id: string;
  type: 'due_soon' | 'overdue' | 'assigned' | 'completed' | 'comment';
  taskId: string;
  ticketId: string;
  taskTitle: string;
  ticketTitle: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  createdAt: string;
  read: boolean;
}

/**
 * Verifica tarefas com prazo próximo (24h, 48h, 1 semana)
 */
export function checkDueSoonTasks(tickets: ServiceTicket[]): TaskNotification[] {
  const notifications: TaskNotification[] = [];
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const twoDays = 2 * oneDay;
  const oneWeek = 7 * oneDay;

  tickets.forEach(ticket => {
    ticket.tasks.forEach(task => {
      if (!task.dueDate || task.status === 'COMPLETED') return;

      const dueDate = new Date(task.dueDate);
      const timeUntilDue = dueDate.getTime() - now.getTime();

      if (timeUntilDue > 0 && timeUntilDue <= oneWeek) {
        let message = '';
        if (timeUntilDue <= oneDay) {
          message = `Tarefa "${task.title}" vence em menos de 24 horas`;
        } else if (timeUntilDue <= twoDays) {
          message = `Tarefa "${task.title}" vence em menos de 48 horas`;
        } else {
          message = `Tarefa "${task.title}" vence em ${Math.ceil(timeUntilDue / oneDay)} dias`;
        }

        notifications.push({
          id: `due-soon-${task.id}`,
          type: 'due_soon',
          taskId: task.id,
          ticketId: ticket.id,
          taskTitle: task.title,
          ticketTitle: ticket.title,
          message,
          priority: ticket.priority || 'medium',
          dueDate: task.dueDate,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    });
  });

  return notifications;
}

/**
 * Verifica tarefas atrasadas
 */
export function checkOverdueTasks(tickets: ServiceTicket[]): TaskNotification[] {
  const notifications: TaskNotification[] = [];
  const now = new Date();

  tickets.forEach(ticket => {
    ticket.tasks.forEach(task => {
      if (!task.dueDate || task.status === 'COMPLETED') return;

      const dueDate = new Date(task.dueDate);
      if (dueDate < now) {
        notifications.push({
          id: `overdue-${task.id}`,
          type: 'overdue',
          taskId: task.id,
          ticketId: ticket.id,
          taskTitle: task.title,
          ticketTitle: ticket.title,
          message: `Tarefa "${task.title}" está atrasada`,
          priority: ticket.priority || 'medium',
          dueDate: task.dueDate,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    });
  });

  return notifications;
}

/**
 * Gera todas as notificações de tarefas
 */
export function generateTaskNotifications(tickets: ServiceTicket[]): TaskNotification[] {
  const dueSoon = checkDueSoonTasks(tickets);
  const overdue = checkOverdueTasks(tickets);
  
  return [...dueSoon, ...overdue].sort((a, b) => {
    // Ordenar por prioridade e data
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Se mesma prioridade, ordenar por data
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0;
  });
}

