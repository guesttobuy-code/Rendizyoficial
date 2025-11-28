import { ServiceTicket, ServiceTask } from '../types/funnels';

export interface EmailReminder {
  id: string;
  taskId: string;
  ticketId: string;
  userId: string;
  userEmail: string;
  reminderType: 'due_soon' | 'overdue' | 'assigned' | 'custom';
  scheduledFor: string; // ISO date
  sent: boolean;
  sentAt?: string;
  createdAt: string;
}

class EmailReminderService {
  private reminders: EmailReminder[] = [];

  /**
   * Agenda um lembrete por email
   */
  scheduleReminder(
    taskId: string,
    ticketId: string,
    userId: string,
    userEmail: string,
    reminderType: EmailReminder['reminderType'],
    scheduledFor: Date
  ): EmailReminder {
    const reminder: EmailReminder = {
      id: `reminder-${Date.now()}-${Math.random()}`,
      taskId,
      ticketId,
      userId,
      userEmail,
      reminderType,
      scheduledFor: scheduledFor.toISOString(),
      sent: false,
      createdAt: new Date().toISOString(),
    };

    this.reminders.push(reminder);
    this.persist();

    return reminder;
  }

  /**
   * Verifica lembretes que devem ser enviados
   */
  getPendingReminders(now: Date = new Date()): EmailReminder[] {
    return this.reminders.filter(
      reminder => !reminder.sent && new Date(reminder.scheduledFor) <= now
    );
  }

  /**
   * Marca lembrete como enviado
   */
  markAsSent(reminderId: string) {
    const reminder = this.reminders.find(r => r.id === reminderId);
    if (reminder) {
      reminder.sent = true;
      reminder.sentAt = new Date().toISOString();
      this.persist();
    }
  }

  /**
   * Cancela um lembrete
   */
  cancelReminder(reminderId: string) {
    this.reminders = this.reminders.filter(r => r.id !== reminderId);
    this.persist();
  }

  /**
   * Busca lembretes de uma tarefa
   */
  getRemindersByTask(taskId: string): EmailReminder[] {
    return this.reminders.filter(r => r.taskId === taskId);
  }

  /**
   * Gera lembretes automáticos para tarefas com prazo próximo
   */
  generateAutoReminders(tickets: ServiceTicket[]): EmailReminder[] {
    const newReminders: EmailReminder[] = [];
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const twoDays = 2 * oneDay;

    tickets.forEach(ticket => {
      ticket.tasks.forEach(task => {
        if (!task.dueDate || task.status === 'COMPLETED' || !task.assignedTo) return;

        const dueDate = new Date(task.dueDate);
        const timeUntilDue = dueDate.getTime() - now.getTime();

        // Lembrete 24h antes
        if (timeUntilDue > 0 && timeUntilDue <= oneDay) {
          const reminder24h = this.scheduleReminder(
            task.id,
            ticket.id,
            task.assignedTo,
            task.assignedToName || '',
            'due_soon',
            new Date(now.getTime() + timeUntilDue - oneDay)
          );
          newReminders.push(reminder24h);
        }

        // Lembrete 48h antes
        if (timeUntilDue > oneDay && timeUntilDue <= twoDays) {
          const reminder48h = this.scheduleReminder(
            task.id,
            ticket.id,
            task.assignedTo,
            task.assignedToName || '',
            'due_soon',
            new Date(now.getTime() + timeUntilDue - twoDays)
          );
          newReminders.push(reminder48h);
        }

        // Lembrete para tarefas atrasadas
        if (timeUntilDue < 0) {
          const overdueReminder = this.scheduleReminder(
            task.id,
            ticket.id,
            task.assignedTo,
            task.assignedToName || '',
            'overdue',
            now
          );
          newReminders.push(overdueReminder);
        }
      });
    });

    return newReminders;
  }

  /**
   * Envia email (simulado - em produção, integrar com serviço de email)
   */
  async sendEmail(reminder: EmailReminder, task: ServiceTask, ticket: ServiceTicket): Promise<boolean> {
    // Simulação - em produção, usar serviço de email real
    console.log('Enviando email de lembrete:', {
      to: reminder.userEmail,
      subject: `Lembrete: ${task.title}`,
      body: `A tarefa "${task.title}" do ticket "${ticket.title}" está com prazo próximo.`,
    });

    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 100));

    this.markAsSent(reminder.id);
    return true;
  }

  private persist() {
    try {
      localStorage.setItem('rendizy_email_reminders', JSON.stringify(this.reminders));
    } catch (error) {
      console.error('Erro ao persistir lembretes:', error);
    }
  }

  load() {
    try {
      const stored = localStorage.getItem('rendizy_email_reminders');
      if (stored) {
        this.reminders = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar lembretes:', error);
      this.reminders = [];
    }
  }
}

export const emailReminderService = new EmailReminderService();

if (typeof window !== 'undefined') {
  emailReminderService.load();
}

