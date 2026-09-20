
import React from 'react';
import { BarberConfig, BarberId, BusinessSettings } from './types';

export const BARBERS: Record<BarberId, BarberConfig> = {
  yoav: {
    id: 'yoav',
    name: 'יואב מלכה',
    price: 50,
    role: 'main'
  },
  dvir: {
    id: 'dvir',
    name: 'דביר חניה',
    price: 35,
    role: 'secondary'
  }
};

export const DEFAULT_DVIR_COMMISSION = 10;

export const DEFAULT_SETTINGS = {
  openDays: [0, 1, 2, 3, 4], // Sun to Thu
  startTime: '09:00',
  endTime: '19:00',
  slotDuration: 30,
  pricePerCut: 50,
  dvirYoavCommission: DEFAULT_DVIR_COMMISSION,
  barbers: {
    yoav: {
      id: 'yoav' as BarberId,
      name: 'יואב מלכה',
      price: 50,
      role: 'main' as const
    },
    dvir: {
      id: 'dvir' as BarberId,
      name: 'דביר חניה',
      price: 35,
      role: 'secondary' as const,
      yoavCommission: DEFAULT_DVIR_COMMISSION
    }
  }
};

export const getBarberName = (barberId?: string | BarberId): string => {
  if (barberId === 'dvir') return BARBERS.dvir.name;
  return BARBERS.yoav.name;
};

export const getBarberPrice = (settings?: Partial<BusinessSettings>, barberId?: string | BarberId): number => {
  const normalizedId: BarberId = barberId === 'dvir' ? 'dvir' : 'yoav';
  if (settings?.barbers?.[normalizedId]?.price !== undefined) {
    return settings.barbers[normalizedId]!.price;
  }
  return BARBERS[normalizedId].price;
};

export const getDvirCommission = (settings?: Partial<BusinessSettings>): number => {
  if (settings?.barbers?.dvir?.yoavCommission !== undefined && !isNaN(settings.barbers.dvir.yoavCommission)) {
    return Number(settings.barbers.dvir.yoavCommission);
  }
  if (settings?.dvirYoavCommission !== undefined && !isNaN(settings.dvirYoavCommission)) {
    return Number(settings.dvirYoavCommission);
  }
  return DEFAULT_DVIR_COMMISSION;
};

export const GOLD_GRADIENT_CLASS = "bg-gradient-to-br from-gold-dark via-gold-light to-gold-bronze";
export const PINK_GRADIENT_CLASS = "bg-gradient-to-r from-pinkAccent to-rose-600";

