/**
 * Security Alert Service
 * Gestion des alertes de sécurité pour les managers
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Socket.IO instance (will be set by routes)
let ioInstance = null;

export function setSocketIO(io) {
  ioInstance = io;
}

/**
 * Types d'alertes
 */
export const ALERT_TYPES = {
  UNAUTHORIZED_DEVICE: 'unauthorized_device',
  GPS_TOO_FAR: 'gps_too_far',
  GPS_IMPRECISE: 'gps_imprecise',
  WRONG_PROPERTY: 'wrong_property',
  SUSPICIOUS_TIMING: 'suspicious_timing',
  MULTIPLE_FAILED_ATTEMPTS: 'multiple_failed_attempts'
};

/**
 * Niveaux de sévérité
 */
export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Create security alert
 * @param {object} alertData - Alert data
 * @returns {Promise<object>} Created alert
 */
export async function createSecurityAlert(alertData) {
  const {
    housekeeperId,
    missionId,
    alertType,
    severity,
    title,
    message,
    details,
    attemptedLocation,
    expectedLocation
  } = alertData;

  try {
    const alert = await prisma.securityAlert.create({
      data: {
        housekeeper_id: housekeeperId,
        mission_id: missionId || null,
        alert_type: alertType,
        severity,
        title,
        message,
        details: details || null,
        attempted_location: attemptedLocation || null,
        expected_location: expectedLocation || null,
        status: 'unread'
      },
      include: {
        housekeeper: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true
          }
        },
        mission: {
          select: {
            id: true,
            mission_type: true,
            property: true,
            scheduled_date: true
          }
        }
      }
    });

    // Emit real-time notification to all managers
    if (ioInstance) {
      ioInstance.emit('security:alert:new', {
        alert,
        timestamp: new Date().toISOString()
      });
      console.log(`🔔 Real-time alert emitted: ${alert.alert_type} - ${alert.severity}`);
    }

    return alert;
  } catch (error) {
    console.error('Error creating security alert:', error);
    throw error;
  }
}

/**
 * Create GPS distance alert
 */
export async function createGPSDistanceAlert(housekeeperId, missionId, missionData, distanceInfo) {
  const { distance, maxRadius, propertyName } = distanceInfo;

  return await createSecurityAlert({
    housekeeperId,
    missionId,
    alertType: ALERT_TYPES.GPS_TOO_FAR,
    severity: distance > maxRadius * 2 ? SEVERITY_LEVELS.HIGH : SEVERITY_LEVELS.MEDIUM,
    title: `Tentative de pointage à distance`,
    message: `${missionData.housekeeperName} a tenté un pointage à ${distance}m du bien "${propertyName}" (max: ${maxRadius}m)`,
    details: {
      distance,
      maxRadius,
      ratio: (distance / maxRadius).toFixed(2),
      missionType: missionData.missionType,
      propertyName
    },
    attemptedLocation: missionData.attemptedLocation,
    expectedLocation: missionData.expectedLocation
  });
}

/**
 * Create GPS accuracy alert
 */
export async function createGPSAccuracyAlert(housekeeperId, missionId, missionData, accuracyInfo) {
  const { accuracy, required } = accuracyInfo;

  return await createSecurityAlert({
    housekeeperId,
    missionId,
    alertType: ALERT_TYPES.GPS_IMPRECISE,
    severity: SEVERITY_LEVELS.LOW,
    title: `Signal GPS imprécis détecté`,
    message: `${missionData.housekeeperName} a tenté un pointage avec un signal GPS imprécis (±${accuracy}m, requis ±${required}m)`,
    details: {
      accuracy,
      required,
      propertyName: missionData.propertyName
    },
    attemptedLocation: missionData.attemptedLocation,
    expectedLocation: missionData.expectedLocation
  });
}

/**
 * Create unauthorized device alert
 */
export async function createUnauthorizedDeviceAlert(housekeeperId, missionId, missionData, deviceInfo) {
  return await createSecurityAlert({
    housekeeperId,
    missionId,
    alertType: ALERT_TYPES.UNAUTHORIZED_DEVICE,
    severity: SEVERITY_LEVELS.CRITICAL,
    title: `Tentative avec appareil non autorisé`,
    message: `${missionData.housekeeperName} a tenté un pointage avec un appareil non enregistré`,
    details: {
      attemptedDeviceId: deviceInfo.attemptedDeviceId,
      registeredDeviceId: deviceInfo.registeredDeviceId,
      propertyName: missionData.propertyName
    },
    attemptedLocation: missionData.attemptedLocation,
    expectedLocation: missionData.expectedLocation
  });
}

/**
 * Create wrong property alert
 */
export async function createWrongPropertyAlert(housekeeperId, missionId, missionData, propertyInfo) {
  return await createSecurityAlert({
    housekeeperId,
    missionId,
    alertType: ALERT_TYPES.WRONG_PROPERTY,
    severity: SEVERITY_LEVELS.HIGH,
    title: `QR code incorrect scanné`,
    message: `${missionData.housekeeperName} a scanné le QR code d'une autre propriété`,
    details: {
      expectedProperty: propertyInfo.expectedProperty,
      scannedProperty: propertyInfo.scannedProperty
    }
  });
}

/**
 * Get recent alerts for dashboard
 * @param {object} filters - Filter options
 * @returns {Promise<Array>} Alerts
 */
export async function getRecentAlerts(filters = {}) {
  const {
    status = 'unread',
    severity,
    limit = 50,
    housekeeperId
  } = filters;

  const where = {};

  if (status && status !== 'all') {
    where.status = status;
  }

  if (severity) {
    where.severity = severity;
  }

  if (housekeeperId) {
    where.housekeeper_id = housekeeperId;
  }

  const alerts = await prisma.securityAlert.findMany({
    where,
    include: {
      housekeeper: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true
        }
      },
      mission: {
        select: {
          id: true,
          mission_type: true,
          property: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    },
    take: limit
  });

  return alerts;
}

/**
 * Get alert statistics
 */
export async function getAlertStatistics(timeRange = '7d') {
  const now = new Date();
  const startDate = new Date();

  // Calculate start date based on time range
  if (timeRange === '24h') {
    startDate.setHours(now.getHours() - 24);
  } else if (timeRange === '7d') {
    startDate.setDate(now.getDate() - 7);
  } else if (timeRange === '30d') {
    startDate.setDate(now.getDate() - 30);
  }

  const alerts = await prisma.securityAlert.findMany({
    where: {
      created_at: {
        gte: startDate
      }
    }
  });

  // Group by type
  const byType = alerts.reduce((acc, alert) => {
    acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
    return acc;
  }, {});

  // Group by severity
  const bySeverity = alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {});

  // Group by status
  const byStatus = alerts.reduce((acc, alert) => {
    acc[alert.status] = (acc[alert.status] || 0) + 1;
    return acc;
  }, {});

  return {
    total: alerts.length,
    byType,
    bySeverity,
    byStatus,
    timeRange
  };
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId, managerId) {
  return await prisma.securityAlert.update({
    where: { id: alertId },
    data: {
      status: 'read',
      acknowledged_by: managerId,
      acknowledged_at: new Date()
    }
  });
}

/**
 * Acknowledge alert with notes
 */
export async function acknowledgeAlert(alertId, managerId, notes) {
  return await prisma.securityAlert.update({
    where: { id: alertId },
    data: {
      status: 'acknowledged',
      acknowledged_by: managerId,
      acknowledged_at: new Date(),
      resolution_notes: notes
    }
  });
}

/**
 * Resolve alert
 */
export async function resolveAlert(alertId, managerId, notes) {
  return await prisma.securityAlert.update({
    where: { id: alertId },
    data: {
      status: 'resolved',
      acknowledged_by: managerId,
      acknowledged_at: new Date(),
      resolution_notes: notes
    }
  });
}

/**
 * Dismiss alert
 */
export async function dismissAlert(alertId, managerId, notes) {
  return await prisma.securityAlert.update({
    where: { id: alertId },
    data: {
      status: 'dismissed',
      acknowledged_by: managerId,
      acknowledged_at: new Date(),
      resolution_notes: notes
    }
  });
}

export default {
  setSocketIO,
  createSecurityAlert,
  createGPSDistanceAlert,
  createGPSAccuracyAlert,
  createUnauthorizedDeviceAlert,
  createWrongPropertyAlert,
  getRecentAlerts,
  getAlertStatistics,
  markAlertAsRead,
  acknowledgeAlert,
  resolveAlert,
  dismissAlert,
  ALERT_TYPES,
  SEVERITY_LEVELS
};
