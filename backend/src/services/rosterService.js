const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Create a new roster shift
 */
const createShift = async (shiftData, createdBy) => {
  try {
    const {
      userId,
      title,
      startTime,
      endTime,
      location,
      department,
      isRecurring,
      recurringPattern,
      color,
      notes
    } = shiftData;

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      throw new Error('Start time must be before end time');
    }

    // Check for shift conflicts (overlapping shifts for the same user)
    const overlapping = await prisma.rosterShift.findMany({
      where: {
        userId,
        OR: [
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gt: start } }
            ]
          }
        ]
      }
    });

    if (overlapping.length > 0) {
      throw new Error('This shift overlaps with an existing shift for this employee');
    }

    // Create shift
    const shift = await prisma.rosterShift.create({
      data: {
        userId,
        title,
        startTime: start,
        endTime: end,
        location: location || null,
        department: department || null,
        isRecurring: isRecurring || false,
        recurringPattern: recurringPattern ? JSON.stringify(recurringPattern) : null,
        color: color || '#10B981',
        notes: notes || null,
        createdBy
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                displayName: true,
                profilePhoto: true
              }
            }
          }
        }
      }
    });

    logger.info(`Roster shift created: ${shift.id} for user ${userId} by ${createdBy}`);

    return shift;
  } catch (error) {
    logger.error('Error creating roster shift:', error);
    throw error;
  }
};

/**
 * Get roster shifts for a date range
 */
const getShifts = async (startDate, endDate, filters = {}) => {
  try {
    const { userId, department, location } = filters;

    const whereClause = {
      OR: [
        {
          AND: [
            { startTime: { lte: new Date(endDate) } },
            { endTime: { gte: new Date(startDate) } }
          ]
        }
      ]
    };

    if (userId) {
      whereClause.userId = userId;
    }

    if (department) {
      whereClause.department = department;
    }

    if (location) {
      whereClause.location = location;
    }

    const shifts = await prisma.rosterShift.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                displayName: true,
                profilePhoto: true,
                phoneNumber: true
              }
            }
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    // Parse recurring patterns
    const shiftsWithParsedPattern = shifts.map(shift => ({
      ...shift,
      recurringPattern: shift.recurringPattern ? JSON.parse(shift.recurringPattern) : null
    }));

    return shiftsWithParsedPattern;
  } catch (error) {
    logger.error('Error getting roster shifts:', error);
    throw error;
  }
};

/**
 * Get a single shift by ID
 */
const getShiftById = async (shiftId) => {
  try {
    const shift = await prisma.rosterShift.findUnique({
      where: { id: shiftId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                displayName: true,
                profilePhoto: true,
                phoneNumber: true
              }
            }
          }
        }
      }
    });

    if (shift && shift.recurringPattern) {
      shift.recurringPattern = JSON.parse(shift.recurringPattern);
    }

    return shift;
  } catch (error) {
    logger.error('Error getting shift by ID:', error);
    throw error;
  }
};

/**
 * Update a roster shift
 */
const updateShift = async (shiftId, updateData) => {
  try {
    const {
      title,
      startTime,
      endTime,
      location,
      department,
      isRecurring,
      recurringPattern,
      color,
      notes
    } = updateData;

    const existingShift = await prisma.rosterShift.findUnique({
      where: { id: shiftId }
    });

    if (!existingShift) {
      throw new Error('Shift not found');
    }

    // Validate times if provided
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
        throw new Error('Start time must be before end time');
      }

      // Check for conflicts with other shifts (excluding this one)
      const overlapping = await prisma.rosterShift.findMany({
        where: {
          userId: existingShift.userId,
          id: { not: shiftId },
          OR: [
            {
              AND: [
                { startTime: { lt: end } },
                { endTime: { gt: start } }
              ]
            }
          ]
        }
      });

      if (overlapping.length > 0) {
        throw new Error('This shift overlaps with an existing shift for this employee');
      }
    }

    const updatePayload = {};

    if (title !== undefined) updatePayload.title = title;
    if (startTime !== undefined) updatePayload.startTime = new Date(startTime);
    if (endTime !== undefined) updatePayload.endTime = new Date(endTime);
    if (location !== undefined) updatePayload.location = location;
    if (department !== undefined) updatePayload.department = department;
    if (isRecurring !== undefined) updatePayload.isRecurring = isRecurring;
    if (recurringPattern !== undefined) {
      updatePayload.recurringPattern = recurringPattern ? JSON.stringify(recurringPattern) : null;
    }
    if (color !== undefined) updatePayload.color = color;
    if (notes !== undefined) updatePayload.notes = notes;

    const updatedShift = await prisma.rosterShift.update({
      where: { id: shiftId },
      data: updatePayload,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                displayName: true,
                profilePhoto: true
              }
            }
          }
        }
      }
    });

    if (updatedShift.recurringPattern) {
      updatedShift.recurringPattern = JSON.parse(updatedShift.recurringPattern);
    }

    logger.info(`Roster shift ${shiftId} updated`);

    return updatedShift;
  } catch (error) {
    logger.error('Error updating roster shift:', error);
    throw error;
  }
};

/**
 * Delete a roster shift
 */
const deleteShift = async (shiftId) => {
  try {
    const shift = await prisma.rosterShift.findUnique({
      where: { id: shiftId }
    });

    if (!shift) {
      throw new Error('Shift not found');
    }

    await prisma.rosterShift.delete({
      where: { id: shiftId }
    });

    logger.info(`Roster shift ${shiftId} deleted`);

    return { success: true, message: 'Shift deleted successfully' };
  } catch (error) {
    logger.error('Error deleting roster shift:', error);
    throw error;
  }
};

/**
 * Get shifts for a specific user
 */
const getUserShifts = async (userId, startDate, endDate) => {
  try {
    const shifts = await prisma.rosterShift.findMany({
      where: {
        userId,
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(endDate) } },
              { endTime: { gte: new Date(startDate) } }
            ]
          }
        ]
      },
      orderBy: { startTime: 'asc' }
    });

    const shiftsWithParsedPattern = shifts.map(shift => ({
      ...shift,
      recurringPattern: shift.recurringPattern ? JSON.parse(shift.recurringPattern) : null
    }));

    return shiftsWithParsedPattern;
  } catch (error) {
    logger.error('Error getting user shifts:', error);
    throw error;
  }
};

/**
 * Get organization-wide roster view
 */
const getOrganizationRoster = async (startDate, endDate, filters = {}) => {
  try {
    const { department, location, role } = filters;

    const whereClause = {
      OR: [
        {
          AND: [
            { startTime: { lte: new Date(endDate) } },
            { endTime: { gte: new Date(startDate) } }
          ]
        }
      ]
    };

    if (department) {
      whereClause.department = department;
    }

    if (location) {
      whereClause.location = location;
    }

    const userWhereClause = {};
    if (role) {
      userWhereClause.role = role;
    }

    const shifts = await prisma.rosterShift.findMany({
      where: whereClause,
      include: {
        user: {
          where: userWhereClause,
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                displayName: true,
                profilePhoto: true,
                phoneNumber: true
              }
            }
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    // Filter out shifts where user doesn't match the role filter
    const filteredShifts = role ? shifts.filter(shift => shift.user !== null) : shifts;

    const shiftsWithParsedPattern = filteredShifts.map(shift => ({
      ...shift,
      recurringPattern: shift.recurringPattern ? JSON.parse(shift.recurringPattern) : null
    }));

    return shiftsWithParsedPattern;
  } catch (error) {
    logger.error('Error getting organization roster:', error);
    throw error;
  }
};

/**
 * Get roster statistics
 */
const getRosterStatistics = async (startDate, endDate) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const shifts = await prisma.rosterShift.findMany({
      where: {
        OR: [
          {
            AND: [
              { startTime: { lte: end } },
              { endTime: { gte: start } }
            ]
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            role: true
          }
        }
      }
    });

    // Calculate statistics
    const totalShifts = shifts.length;
    const uniqueEmployees = [...new Set(shifts.map(s => s.userId))].length;

    const byDepartment = {};
    const byLocation = {};

    shifts.forEach(shift => {
      // Department stats
      if (shift.department) {
        if (!byDepartment[shift.department]) {
          byDepartment[shift.department] = 0;
        }
        byDepartment[shift.department]++;
      }

      // Location stats
      if (shift.location) {
        if (!byLocation[shift.location]) {
          byLocation[shift.location] = 0;
        }
        byLocation[shift.location]++;
      }
    });

    return {
      totalShifts,
      uniqueEmployees,
      byDepartment,
      byLocation,
      dateRange: {
        start: startDate,
        end: endDate
      }
    };
  } catch (error) {
    logger.error('Error getting roster statistics:', error);
    throw error;
  }
};

/**
 * Get available employees (not on leave or scheduled) for a time period
 */
const getAvailableEmployees = async (startDate, endDate, role = null) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all employees
    const whereClause = {
      role: role ? role : { in: ['EMPLOYEE', 'MANAGER', 'ADMIN'] }
    };

    const allEmployees = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
            profilePhoto: true
          }
        }
      }
    });

    // Get employees on approved leave
    const employeesOnLeave = await prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: start } }
            ]
          }
        ]
      },
      select: { userId: true }
    });

    const onLeaveIds = new Set(employeesOnLeave.map(l => l.userId));

    // Get employees with scheduled shifts
    const scheduledShifts = await prisma.rosterShift.findMany({
      where: {
        OR: [
          {
            AND: [
              { startTime: { lte: end } },
              { endTime: { gte: start } }
            ]
          }
        ]
      },
      select: { userId: true }
    });

    const scheduledIds = new Set(scheduledShifts.map(s => s.userId));

    // Filter available employees
    const availableEmployees = allEmployees.filter(
      emp => !onLeaveIds.has(emp.id) && !scheduledIds.has(emp.id)
    );

    return {
      available: availableEmployees,
      onLeave: allEmployees.filter(emp => onLeaveIds.has(emp.id)),
      scheduled: allEmployees.filter(emp => scheduledIds.has(emp.id) && !onLeaveIds.has(emp.id))
    };
  } catch (error) {
    logger.error('Error getting available employees:', error);
    throw error;
  }
};

module.exports = {
  createShift,
  getShifts,
  getShiftById,
  updateShift,
  deleteShift,
  getUserShifts,
  getOrganizationRoster,
  getRosterStatistics,
  getAvailableEmployees
};
