/**
 * VECTRYS Agent de Terrain - API Routes
 * Gestion des missions terrain, incidents, SOS, évacuations
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { uploadMultiple, getFileUrl } from '../services/upload.service.js';
import { validateGeofence, validateGPSAccuracy, getValidationRadius } from '../services/geolocation.service.js';
import securityAlertService from '../services/security-alert.service.js';

const { createGPSDistanceAlert, createGPSAccuracyAlert, createUnauthorizedDeviceAlert, setSocketIO } = securityAlertService;

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Socket.IO for real-time alerts
export function initializeSocketIO(io) {
  setSocketIO(io);
  console.log('✅ Socket.IO initialized for security alerts');
}

// ============================================================================
// MISSIONS
// ============================================================================

/**
 * GET /api/agent-terrain/missions
 * Liste des missions pour un agent
 */
router.get('/missions', async (req, res) => {
  try {
    const { housekeeperId, status, date } = req.query;

    if (!housekeeperId) {
      return res.status(400).json({ success: false, error: 'housekeeperId required' });
    }

    const where = { housekeeper_id: housekeeperId };

    if (status) where.status = status;

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.scheduled_date = { gte: startOfDay, lte: endOfDay };
    }

    const missions = await prisma.mission.findMany({
      where,
      include: {
        incidents: true,
        sos_events: true,
        evacuation_event: true,
        checkin_pointage: true,
        checkout_pointage: true,
        mission_report: true
      },
      orderBy: { scheduled_date: 'asc' }
    });

    res.json({ success: true, data: missions });
  } catch (error) {
    console.error('Error fetching missions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent-terrain/missions/:id
 */
router.get('/missions/:id', async (req, res) => {
  try {
    const mission = await prisma.mission.findUnique({
      where: { id: req.params.id },
      include: {
        incidents: true,
        sos_events: true,
        evacuation_event: true,
        checkin_pointage: true,
        checkout_pointage: true,
        mission_report: true
      }
    });

    if (!mission) {
      return res.status(404).json({ success: false, error: 'Mission not found' });
    }

    res.json({ success: true, data: mission });
  } catch (error) {
    console.error('Error fetching mission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/agent-terrain/missions/:id/status
 */
router.patch('/missions/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'assigned', 'accepted', 'in_progress', 'paused', 'completed', 'validated', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const mission = await prisma.mission.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.json({ success: true, data: mission });
  } catch (error) {
    console.error('Error updating mission status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/agent-terrain/missions/:id/tasks
 */
router.patch('/missions/:id/tasks', async (req, res) => {
  try {
    const mission = await prisma.mission.update({
      where: { id: req.params.id },
      data: { tasks: req.body.tasks }
    });

    res.json({ success: true, data: mission });
  } catch (error) {
    console.error('Error updating tasks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// POINTAGE
// ============================================================================

/**
 * POST /api/agent-terrain/checkin
 */
router.post('/checkin', async (req, res) => {
  try {
    const { missionId, method, gpsPosition, qrData } = req.body;

    if (!missionId || !method) {
      return res.status(400).json({ success: false, error: 'missionId and method required' });
    }

    // Validate QR code if method is 'qr'
    let validationData = null;
    let verified = method !== 'manual';

    if (method === 'qr') {
      if (!qrData || !qrData.property_id) {
        return res.status(400).json({ success: false, error: 'QR data required for QR check-in' });
      }

      // Get mission with housekeeper info
      const mission = await prisma.mission.findUnique({
        where: { id: missionId },
        include: {
          housekeeper: true
        }
      });

      if (!mission) {
        return res.status(404).json({ success: false, error: 'Mission not found' });
      }

      // Validate property ID matches
      const missionPropertyId = mission.property?.id;
      if (missionPropertyId && qrData.property_id !== missionPropertyId) {
        return res.status(400).json({
          success: false,
          error: 'QR code does not match mission property'
        });
      }

      // Validate device ID if housekeeper has registered phone
      if (mission.housekeeper && mission.housekeeper.registered_phone_id) {
        const deviceId = qrData.device_id;

        if (!deviceId) {
          return res.status(400).json({
            success: false,
            error: 'Device identification required'
          });
        }

        if (deviceId !== mission.housekeeper.registered_phone_id) {
          // Create security alert
          await createUnauthorizedDeviceAlert(
            mission.housekeeper_id,
            missionId,
            {
              housekeeperName: `${mission.housekeeper.first_name} ${mission.housekeeper.last_name}`,
              propertyName: mission.property?.name,
              attemptedLocation: qrData.gps_position,
              expectedLocation: mission.property?.coordinates
            },
            {
              attemptedDeviceId: deviceId,
              registeredDeviceId: mission.housekeeper.registered_phone_id
            }
          );

          return res.status(403).json({
            success: false,
            error: 'Unauthorized device - this phone is not registered for this account'
          });
        }
      }

      // Validate GPS position is present
      if (!qrData.gps_position) {
        return res.status(400).json({
          success: false,
          error: 'GPS position required for QR check-in'
        });
      }

      // Validate GPS accuracy
      const accuracyCheck = validateGPSAccuracy(qrData.gps_position.accuracy);
      if (!accuracyCheck.valid) {
        // Create security alert
        await createGPSAccuracyAlert(
          mission.housekeeper_id,
          missionId,
          {
            housekeeperName: `${mission.housekeeper.first_name} ${mission.housekeeper.last_name}`,
            propertyName: mission.property?.name,
            attemptedLocation: qrData.gps_position,
            expectedLocation: mission.property?.coordinates
          },
          {
            accuracy: accuracyCheck.accuracy,
            required: 50
          }
        );

        return res.status(400).json({
          success: false,
          error: accuracyCheck.message,
          details: {
            accuracy: accuracyCheck.accuracy,
            required: 50
          }
        });
      }

      // Validate geofencing - agent must be at property location
      const propertyCoordinates = mission.property?.coordinates;
      if (propertyCoordinates && propertyCoordinates.lat && propertyCoordinates.lng) {
        const validationRadius = getValidationRadius(mission.mission_type, 'urban');
        const geofenceCheck = validateGeofence(
          qrData.gps_position,
          propertyCoordinates,
          validationRadius
        );

        if (!geofenceCheck.valid) {
          // Create security alert
          await createGPSDistanceAlert(
            mission.housekeeper_id,
            missionId,
            {
              housekeeperName: `${mission.housekeeper.first_name} ${mission.housekeeper.last_name}`,
              missionType: mission.mission_type,
              propertyName: mission.property.name,
              attemptedLocation: qrData.gps_position,
              expectedLocation: propertyCoordinates
            },
            {
              distance: geofenceCheck.distance,
              maxRadius: validationRadius,
              propertyName: mission.property.name
            }
          );

          return res.status(403).json({
            success: false,
            error: geofenceCheck.message,
            details: {
              distance: geofenceCheck.distance,
              maxDistance: validationRadius,
              propertyName: mission.property.name
            }
          });
        }

        // Add geofence validation info to data
        validationData = {
          ...qrData,
          geofence_validation: {
            distance: geofenceCheck.distance,
            maxRadius: validationRadius,
            validated: true,
            timestamp: new Date().toISOString()
          }
        };
      } else {
        validationData = qrData;
      }

      verified = true;
    } else if (method === 'gps') {
      validationData = gpsPosition;
    }

    const pointage = await prisma.pointage.create({
      data: {
        mission_checkin_id: missionId,
        pointage_method: method,
        gps_position: validationData || null,
        verified
      }
    });

    await prisma.mission.update({
      where: { id: missionId },
      data: { status: 'in_progress' }
    });

    res.json({ success: true, data: pointage });
  } catch (error) {
    console.error('Error creating checkin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/agent-terrain/checkout
 */
router.post('/checkout', async (req, res) => {
  try {
    const { missionId, method, gpsPosition, qrData } = req.body;

    if (!missionId || !method) {
      return res.status(400).json({ success: false, error: 'missionId and method required' });
    }

    // Validate QR code if method is 'qr'
    let validationData = null;
    let verified = method !== 'manual';

    if (method === 'qr') {
      if (!qrData || !qrData.property_id) {
        return res.status(400).json({ success: false, error: 'QR data required for QR check-out' });
      }

      // Get mission with housekeeper info
      const mission = await prisma.mission.findUnique({
        where: { id: missionId },
        include: {
          housekeeper: true
        }
      });

      if (!mission) {
        return res.status(404).json({ success: false, error: 'Mission not found' });
      }

      // Validate property ID matches
      const missionPropertyId = mission.property?.id;
      if (missionPropertyId && qrData.property_id !== missionPropertyId) {
        return res.status(400).json({
          success: false,
          error: 'QR code does not match mission property'
        });
      }

      // Validate device ID if housekeeper has registered phone
      if (mission.housekeeper && mission.housekeeper.registered_phone_id) {
        const deviceId = qrData.device_id;

        if (!deviceId) {
          return res.status(400).json({
            success: false,
            error: 'Device identification required'
          });
        }

        if (deviceId !== mission.housekeeper.registered_phone_id) {
          // Create security alert
          await createUnauthorizedDeviceAlert(
            mission.housekeeper_id,
            missionId,
            {
              housekeeperName: `${mission.housekeeper.first_name} ${mission.housekeeper.last_name}`,
              propertyName: mission.property?.name,
              attemptedLocation: qrData.gps_position,
              expectedLocation: mission.property?.coordinates
            },
            {
              attemptedDeviceId: deviceId,
              registeredDeviceId: mission.housekeeper.registered_phone_id
            }
          );

          return res.status(403).json({
            success: false,
            error: 'Unauthorized device - this phone is not registered for this account'
          });
        }
      }

      // Validate GPS position is present
      if (!qrData.gps_position) {
        return res.status(400).json({
          success: false,
          error: 'GPS position required for QR check-out'
        });
      }

      // Validate GPS accuracy
      const accuracyCheck = validateGPSAccuracy(qrData.gps_position.accuracy);
      if (!accuracyCheck.valid) {
        // Create security alert
        await createGPSAccuracyAlert(
          mission.housekeeper_id,
          missionId,
          {
            housekeeperName: `${mission.housekeeper.first_name} ${mission.housekeeper.last_name}`,
            propertyName: mission.property?.name,
            attemptedLocation: qrData.gps_position,
            expectedLocation: mission.property?.coordinates
          },
          {
            accuracy: accuracyCheck.accuracy,
            required: 50
          }
        );

        return res.status(400).json({
          success: false,
          error: accuracyCheck.message,
          details: {
            accuracy: accuracyCheck.accuracy,
            required: 50
          }
        });
      }

      // Validate geofencing - agent must be at property location
      const propertyCoordinates = mission.property?.coordinates;
      if (propertyCoordinates && propertyCoordinates.lat && propertyCoordinates.lng) {
        const validationRadius = getValidationRadius(mission.mission_type, 'urban');
        const geofenceCheck = validateGeofence(
          qrData.gps_position,
          propertyCoordinates,
          validationRadius
        );

        if (!geofenceCheck.valid) {
          // Create security alert
          await createGPSDistanceAlert(
            mission.housekeeper_id,
            missionId,
            {
              housekeeperName: `${mission.housekeeper.first_name} ${mission.housekeeper.last_name}`,
              missionType: mission.mission_type,
              propertyName: mission.property.name,
              attemptedLocation: qrData.gps_position,
              expectedLocation: propertyCoordinates
            },
            {
              distance: geofenceCheck.distance,
              maxRadius: validationRadius,
              propertyName: mission.property.name
            }
          );

          return res.status(403).json({
            success: false,
            error: geofenceCheck.message,
            details: {
              distance: geofenceCheck.distance,
              maxDistance: validationRadius,
              propertyName: mission.property.name
            }
          });
        }

        // Add geofence validation info to data
        validationData = {
          ...qrData,
          geofence_validation: {
            distance: geofenceCheck.distance,
            maxRadius: validationRadius,
            validated: true,
            timestamp: new Date().toISOString()
          }
        };
      } else {
        validationData = qrData;
      }

      verified = true;
    } else if (method === 'gps') {
      validationData = gpsPosition;
    }

    const pointage = await prisma.pointage.create({
      data: {
        mission_checkout_id: missionId,
        pointage_method: method,
        gps_position: validationData || null,
        verified
      }
    });

    await prisma.mission.update({
      where: { id: missionId },
      data: { status: 'completed' }
    });

    res.json({ success: true, data: pointage });
  } catch (error) {
    console.error('Error creating checkout:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// INCIDENTS
// ============================================================================

/**
 * POST /api/agent-terrain/incidents
 */
router.post('/incidents', async (req, res) => {
  try {
    const { missionId, incidentType, severity, gpsPosition, evidence, managerCalled, notes } = req.body;

    if (!missionId || !incidentType || !severity) {
      return res.status(400).json({ success: false, error: 'missionId, incidentType, and severity required' });
    }

    const incident = await prisma.incident.create({
      data: {
        mission_id: missionId,
        incident_type: incidentType,
        severity,
        gps_position: gpsPosition || null,
        evidence: evidence || [],
        manager_called: managerCalled || false,
        manager_called_at: managerCalled ? new Date() : null,
        notes
      }
    });

    res.json({ success: true, data: incident });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/agent-terrain/incidents/:id
 */
router.patch('/incidents/:id', async (req, res) => {
  try {
    const incident = await prisma.incident.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json({ success: true, data: incident });
  } catch (error) {
    console.error('Error updating incident:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/agent-terrain/incidents/:id/resolve
 */
router.post('/incidents/:id/resolve', async (req, res) => {
  try {
    const incident = await prisma.incident.update({
      where: { id: req.params.id },
      data: {
        resolved_at: new Date(),
        resolution: req.body.resolution
      }
    });

    res.json({ success: true, data: incident });
  } catch (error) {
    console.error('Error resolving incident:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// SOS
// ============================================================================

/**
 * POST /api/agent-terrain/sos
 */
router.post('/sos', async (req, res) => {
  try {
    const { missionId, sosCategory, sosAction, gpsPosition } = req.body;

    if (!missionId || !sosCategory) {
      return res.status(400).json({ success: false, error: 'missionId and sosCategory required' });
    }

    const sosEvent = await prisma.sOSEvent.create({
      data: {
        mission_id: missionId,
        sos_category: sosCategory,
        sos_action: sosAction || null,
        gps_position: gpsPosition || null
      }
    });

    res.json({ success: true, data: sosEvent });
  } catch (error) {
    console.error('Error creating SOS event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/agent-terrain/sos/:id/resolve
 */
router.post('/sos/:id/resolve', async (req, res) => {
  try {
    const sosEvent = await prisma.sOSEvent.update({
      where: { id: req.params.id },
      data: {
        resolved: true,
        resolved_at: new Date()
      }
    });

    res.json({ success: true, data: sosEvent });
  } catch (error) {
    console.error('Error resolving SOS:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// EVACUATION
// ============================================================================

/**
 * POST /api/agent-terrain/evacuation
 */
router.post('/evacuation', async (req, res) => {
  try {
    const { missionId, motivationId, motivationLabel, customReason, gpsPosition, employerNotified } = req.body;

    if (!missionId || !motivationId || !motivationLabel) {
      return res.status(400).json({ success: false, error: 'missionId, motivationId, and motivationLabel required' });
    }

    const evacuationEvent = await prisma.evacuationEvent.create({
      data: {
        mission_id: missionId,
        motivation_id: motivationId,
        motivation_label: motivationLabel,
        custom_reason: customReason || null,
        gps_position: gpsPosition || null,
        employer_notified: employerNotified || false,
        employer_notified_at: employerNotified ? new Date() : null
      }
    });

    await prisma.mission.update({
      where: { id: missionId },
      data: { status: 'cancelled' }
    });

    res.json({ success: true, data: evacuationEvent });
  } catch (error) {
    console.error('Error creating evacuation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// RAPPORTS
// ============================================================================

/**
 * POST /api/agent-terrain/reports
 */
router.post('/reports', async (req, res) => {
  try {
    const { missionId, reportType, validity, tasksCompleted, tasksTotal, notes, photos, pendingEvidence, signature } = req.body;

    if (!missionId || !reportType || !validity) {
      return res.status(400).json({ success: false, error: 'missionId, reportType, and validity required' });
    }

    const report = await prisma.missionReport.create({
      data: {
        mission_id: missionId,
        report_type: reportType,
        validity,
        tasks_completed: tasksCompleted || 0,
        tasks_total: tasksTotal || 0,
        notes: notes || null,
        photos: photos || [],
        pending_evidence: pendingEvidence || [],
        signature: signature || null
      }
    });

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent-terrain/reports/:missionId
 */
router.get('/reports/:missionId', async (req, res) => {
  try {
    const report = await prisma.missionReport.findUnique({
      where: { mission_id: req.params.missionId },
      include: {
        mission: {
          include: {
            incidents: true,
            evacuation_event: true,
            checkin_pointage: true,
            checkout_pointage: true
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/agent-terrain/reports/:id/validate
 */
router.patch('/reports/:id/validate', async (req, res) => {
  try {
    const report = await prisma.missionReport.update({
      where: { id: req.params.id },
      data: { validity: req.body.validity }
    });

    await prisma.mission.update({
      where: { id: report.mission_id },
      data: { status: 'validated' }
    });

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error validating report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// UPLOAD PHOTOS
// ============================================================================

/**
 * POST /api/agent-terrain/upload
 * Upload photos (evidence pour incidents)
 */
router.post('/upload', uploadMultiple, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucun fichier uploadé' });
    }

    // Convert files to evidence format
    const evidence = req.files.map(file => ({
      id: file.filename,
      type: 'photo',
      uri: getFileUrl(file.filename),
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      timestamp: new Date().toISOString(),
      status: 'pending_validation'
    }));

    res.json({ success: true, data: evidence });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// DEVICE REGISTRATION
// ============================================================================

/**
 * POST /api/agent-terrain/register-device
 * Register or update device ID for a housekeeper
 */
router.post('/register-device', async (req, res) => {
  try {
    const { housekeeperId, deviceId } = req.body;

    if (!housekeeperId || !deviceId) {
      return res.status(400).json({
        success: false,
        error: 'housekeeperId and deviceId required'
      });
    }

    // Update housekeeper with registered device ID
    const housekeeper = await prisma.housekeeper.update({
      where: { id: housekeeperId },
      data: { registered_phone_id: deviceId }
    });

    res.json({
      success: true,
      data: {
        housekeeperId: housekeeper.id,
        deviceId: housekeeper.registered_phone_id,
        registered: true
      }
    });
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent-terrain/device-status/:housekeeperId
 * Check if device is registered for a housekeeper
 */
router.get('/device-status/:housekeeperId', async (req, res) => {
  try {
    const { housekeeperId } = req.params;
    const { deviceId } = req.query;

    const housekeeper = await prisma.housekeeper.findUnique({
      where: { id: housekeeperId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        registered_phone_id: true
      }
    });

    if (!housekeeper) {
      return res.status(404).json({ success: false, error: 'Housekeeper not found' });
    }

    const isRegistered = !!housekeeper.registered_phone_id;
    const isCurrentDevice = deviceId && deviceId === housekeeper.registered_phone_id;

    res.json({
      success: true,
      data: {
        housekeeperId: housekeeper.id,
        name: `${housekeeper.first_name} ${housekeeper.last_name}`,
        isRegistered,
        isCurrentDevice,
        needsRegistration: !isRegistered
      }
    });
  } catch (error) {
    console.error('Error checking device status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// SECURITY ALERTS
// ============================================================================

import { getRecentAlerts, getAlertStatistics, markAlertAsRead, acknowledgeAlert, resolveAlert, dismissAlert } from '../services/security-alert.service.js';

/**
 * GET /api/agent-terrain/security-alerts
 * Get security alerts with filters
 */
router.get('/security-alerts', async (req, res) => {
  try {
    const { status, severity, limit, housekeeperId } = req.query;

    const alerts = await getRecentAlerts({
      status: status || 'all',
      severity,
      limit: parseInt(limit) || 50,
      housekeeperId
    });

    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent-terrain/security-alerts/stats
 * Get security alert statistics
 */
router.get('/security-alerts/stats', async (req, res) => {
  try {
    const { timeRange } = req.query;

    const stats = await getAlertStatistics(timeRange || '7d');

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching alert statistics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/agent-terrain/security-alerts/:id/read
 * Mark alert as read
 */
router.patch('/security-alerts/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { managerId } = req.body;

    const alert = await markAlertAsRead(id, managerId || 'manager1');

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/agent-terrain/security-alerts/:id/acknowledge
 * Acknowledge alert
 */
router.patch('/security-alerts/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const { managerId, notes } = req.body;

    const alert = await acknowledgeAlert(id, managerId || 'manager1', notes);

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/agent-terrain/security-alerts/:id/resolve
 * Resolve alert
 */
router.patch('/security-alerts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { managerId, notes } = req.body;

    const alert = await resolveAlert(id, managerId || 'manager1', notes);

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/agent-terrain/security-alerts/:id/dismiss
 * Dismiss alert
 */
router.patch('/security-alerts/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    const { managerId, notes } = req.body;

    const alert = await dismissAlert(id, managerId || 'manager1', notes);

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
