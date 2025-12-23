
import { Booking, BusinessSettings } from '../types';
import { format, addMinutes } from 'date-fns';

const formatUTC = (d: Date) => format(d, "yyyyMMdd'T'HHmmss'Z'");
const formatTimeZone = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");

export const generateICS = (booking: Booking, settings: BusinessSettings) => {
  const { date, timeSlot } = booking;
  const { slotDuration } = settings;

  const startDateTime = new Date(`${date}T${timeSlot}`);
  const endDateTime = addMinutes(startDateTime, slotDuration);
  const tz = 'Asia/Jerusalem';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//YourAppName//NONSGML v1.0//EN',
    'BEGIN:VEVENT',
    `UID:${booking.id}@${window.location.hostname}`,
    `DTSTAMP:${formatUTC(new Date())}`,
    `DTSTART;TZID=${tz}:${formatTimeZone(startDateTime)}`,
    `DTEND;TZID=${tz}:${formatTimeZone(endDateTime)}`,
    'SUMMARY:תספורת אצל יואב',
    'LOCATION:מורשת, לבונה 294',
    'DESCRIPTION:התספורת הבאה שלך',
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

  // Google Calendar links work best with UTC times.
  // The initial Date object is created in the client's local timezone.
  // formatUTC correctly converts it to a UTC string for the link.
  const startDateTime = new Date(`${date}T${timeSlot}`);
  const endDateTime = addMinutes(startDateTime, slotDuration);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Haircut with Yoav Malka',
    dates: `${formatUTC(startDateTime)}/${formatUTC(endDateTime)}`,
    details: 'Your upcoming haircut appointment.',
    location: 'Moreshet, Levona 294',
    ctz: 'Asia/Jerusalem' // Adding the timezone hint for Google
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
};
