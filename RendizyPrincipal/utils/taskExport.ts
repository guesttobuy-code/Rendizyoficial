import { ServiceTicket, ServiceTask } from '../types/funnels';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  includeTasks: boolean;
  includeSubtasks: boolean;
  includeComments: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  statusFilter?: string[];
  priorityFilter?: string[];
}

/**
 * Exporta tickets para CSV
 */
export function exportToCSV(tickets: ServiceTicket[], options: ExportOptions): string {
  const headers = [
    'ID',
    'Título',
    'Status',
    'Prioridade',
    'Etapa',
    'Atribuído a',
    'Progresso',
    'Data Criação',
    'Data Atualização',
  ];

  if (options.includeTasks) {
    headers.push('Tarefas', 'Tarefas Completas', 'Total de Tarefas');
  }

  const rows: string[][] = [headers];

  tickets.forEach(ticket => {
    const row = [
      ticket.id,
      ticket.title,
      ticket.status,
      ticket.priority || 'medium',
      ticket.stageId,
      ticket.assignedToName || 'Não atribuído',
      `${ticket.progress}%`,
      format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      format(new Date(ticket.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    ];

    if (options.includeTasks) {
      const completedTasks = ticket.tasks.filter(t => t.status === 'COMPLETED').length;
      const totalTasks = ticket.tasks.length;
      row.push(
        ticket.tasks.map(t => t.title).join('; '),
        completedTasks.toString(),
        totalTasks.toString()
      );
    }

    rows.push(row);
  });

  // Converter para CSV
  return rows.map(row =>
    row.map(cell => {
      const cellStr = String(cell || '');
      // Escapar aspas e quebras de linha
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',')
  ).join('\n');
}

/**
 * Exporta tickets para JSON
 */
export function exportToJSON(tickets: ServiceTicket[], options: ExportOptions): string {
  const data = tickets.map(ticket => {
    const base = {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      stageId: ticket.stageId,
      assignedTo: ticket.assignedTo,
      assignedToName: ticket.assignedToName,
      progress: ticket.progress,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };

    if (options.includeTasks) {
      return {
        ...base,
        tasks: ticket.tasks.map(task => {
          const taskBase = {
            id: task.id,
            title: task.title,
            type: task.type,
            status: task.status,
            assignedTo: task.assignedTo,
            assignedToName: task.assignedToName,
            dueDate: task.dueDate,
          };

          if (options.includeSubtasks) {
            return {
              ...taskBase,
              subtasks: task.subtasks,
            };
          }

          return taskBase;
        }),
      };
    }

    return base;
  });

  return JSON.stringify(data, null, 2);
}

/**
 * Faz download do arquivo
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta tickets com as opções especificadas
 */
export function exportTickets(tickets: ServiceTicket[], options: ExportOptions) {
  let content: string;
  let filename: string;
  let mimeType: string;

  switch (options.format) {
    case 'csv':
      content = exportToCSV(tickets, options);
      filename = `tickets-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      mimeType = 'text/csv;charset=utf-8;';
      break;
    case 'json':
      content = exportToJSON(tickets, options);
      filename = `tickets-${format(new Date(), 'yyyy-MM-dd')}.json`;
      mimeType = 'application/json';
      break;
    default:
      throw new Error('Formato não suportado');
  }

  downloadFile(content, filename, mimeType);
}

