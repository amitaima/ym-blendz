
import { Booking, BusinessSettings } from '../types';
import { format, addMinutes } from 'date-fns';
import { getBarberName } from '../constants';

const formatUTC = (d: Date) => format(d, "yyyyMMdd'T'HHmmss'Z'");
const formatTimeZone = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");

export const generateICS = (booking: Booking, settings: BusinessSettings) => {
  const { date, timeSlot } = booking;
  const { slotDuration } = settings;
  const barberName = booking.barberName || getBarberName(booking.barberId);

  const startDateTime = new Date(`${date}T${timeSlot}`);
  const endDateTime = addMinutes(startDateTime, slotDuration);
  const tz = 'Asia/Jerusalem';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//YMBlendz//NONSGML v1.0//EN',
    'BEGIN:VEVENT',
    `UID:${booking.id || Date.now()}@${typeof window !== 'undefined' ? window.location.hostname : 'ymblendz.app'}`,
    `DTSTAMP:${formatUTC(new Date())}`,
    `DTSTART;TZID=${tz}:${formatTimeZone(startDateTime)}`,
    `DTEND;TZID=${tz}:${formatTimeZone(endDateTime)}`,
    `SUMMARY:תספורת אצל ${barberName}`,
    'LOCATION:מורשת, לבונה 294',
    `DESCRIPTION:תספורת שנקבעה אצל ${barberName} ב-YM Blendz`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
};

export const createICSDataURI = (icsContent: string) => {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
};

export const generateGoogleCalendarLink = (booking: Booking, settings: BusinessSettings): string => {
  const { date, timeSlot } = booking;
  const { slotDuration } = settings;
  const barberName = booking.barberName || getBarberName(booking.barberId);

  const startDateTime = new Date(`${date}T${timeSlot}`);
  const endDateTime = addMinutes(startDateTime, slotDuration);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `תספורת אצל ${barberName} - YM Blendz`,
    dates: `${formatUTC(startDateTime)}/${formatUTC(endDateTime)}`,
    details: `תור לתספורת אצל ${barberName}`,
    location: 'מורשת, לבונה 294',
    ctz: 'Asia/Jerusalem'
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
};

