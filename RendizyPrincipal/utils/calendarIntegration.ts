import { ServiceTicket, ServiceTask } from '../types/funnels';
import { format } from 'date-fns';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  location?: string;
  url?: string;
}

/**
 * Gera URL para Google Calendar
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${format(event.start, 'yyyyMMddTHHmmss')}/${format(event.end, 'yyyyMMddTHHmmss')}`,
    details: event.description,
    location: event.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Gera arquivo .ics para Outlook/Apple Calendar
 */
export function generateICSFile(event: CalendarEvent): string {
  const formatDate = (date: Date) => format(date, "yyyyMMdd'T'HHmmss");
  
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rendizy//Task Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@rendizy.com`,
    `DTSTART:${formatDate(event.start)}`,
    `DTEND:${formatDate(event.end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    event.location ? `LOCATION:${event.location}` : '',
    event.url ? `URL:${event.url}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

/**
 * Converte tarefa em evento de calendário
 */
export function taskToCalendarEvent(task: ServiceTask, ticket: ServiceTicket): CalendarEvent | null {
  if (!task.dueDate) return null;

  const dueDate = new Date(task.dueDate);
  const start = new Date(dueDate);
  start.setHours(9, 0, 0, 0); // 9h da manhã
  
  const end = new Date(start);
  end.setHours(start.getHours() + (task.estimatedHours || 1)); // Duração baseada na estimativa

  return {
    id: `task-${task.id}`,
    title: `${task.title} - ${ticket.title}`,
    description: `Tarefa: ${task.title}\nTicket: ${ticket.title}\n${task.description || ''}`,
    start,
    end,
    url: `${window.location.origin}/crm/services?ticket=${ticket.id}`,
  };
}

/**
 * Faz download do arquivo .ics
 */
export function downloadICS(event: CalendarEvent) {
  const icsContent = generateICSFile(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Abre Google Calendar em nova aba
 */
export function openGoogleCalendar(event: CalendarEvent) {
  const url = generateGoogleCalendarUrl(event);
  window.open(url, '_blank');
}

