
import { Booking, BusinessSettings } from '../types';
import { format, addMinutes } from 'date-fns';

// Reusable date formatter for calendar standards (UTC)
const formatDateForCalendar = (d: Date) => format(d, "yyyyMMdd'T'HHmmss'Z'");

export const generateICS = (booking: Booking, settings: BusinessSettings) => {
  const { date, timeSlot } = booking;
  const { slotDuration } = settings;

  const startDateTime = new Date(`${date}T${timeSlot}`);
  const endDateTime = addMinutes(startDateTime, slotDuration);

  const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//YourAppName//NONSGML v1.0//EN
BEGIN:VEVENT
UID:${booking.id}@${window.location.hostname}
DTSTAMP:${formatDateForCalendar(new Date())}
DTSTART:${formatDateForCalendar(startDateTime)}
DTEND:${formatDateForCalendar(endDateTime)}
SUMMARY:Haircut with Yoav Malka
LOCATION:Moreshet, Levona 294
DESCRIPTION:Your upcoming haircut appointment.
END:VEVENT
END:VCALENDAR}
  `.trim();

  return icsContent;
};

export const downloadICS = (icsContent: string, filename: string) => {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateGoogleCalendarLink = (booking: Booking, settings: BusinessSettings): string => {
  const { date, timeSlot } = booking;
  const { slotDuration } = settings;

  const startDateTime = new Date(`${date}T${timeSlot}`);
  const endDateTime = addMinutes(startDateTime, slotDuration);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Haircut with Yoav Malka',
    dates: `${formatDateForCalendar(startDateTime)}/${formatDateForCalendar(endDateTime)}`,
    details: 'Your upcoming haircut appointment.',
    location: 'Moreshet, Levona 294',
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
};
