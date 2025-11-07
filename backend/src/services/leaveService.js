const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Get all active leave types
 */
const getLeaveTypes = async () => {
  try {
    const leaveTypes = await prisma.leaveType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    return leaveTypes;
  } catch (error) {
    logger.error('Error getting leave types:', error);
    throw error;
  }
};

/**
 * Create a new leave request
 */
const createLeaveRequest = async (userId, leaveData) => {
  try {
    const { leaveTypeId, startDate, endDate, reason, notes, attachments } = leaveData;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new Error('Start date must be before end date');
    }

    // Calculate total days (including partial days)
    const timeDiff = end.getTime() - start.getTime();
    const totalDays = timeDiff / (1000 * 3600 * 24) + 1; // +1 to include both start and end dates

    // Check for overlapping leave requests
    const overlapping = await prisma.leaveRequest.findMany({
      where: {
        userId,
        status: {
          in: ['PENDING', 'APPROVED']
        },
        OR: [
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: start } }
            ]
          }
        ]
      }
    });

    if (overlapping.length > 0) {
      throw new Error('You already have a leave request for this period');
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        notes: notes || null,
        attachments: attachments || [],
        status: 'PENDING'
      },
      include: {
        leaveType: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    logger.info(`Leave request created: ${leaveRequest.id} by user ${userId}`);

    return leaveRequest;
  } catch (error) {
    logger.error('Error creating leave request:', error);
    throw error;
  }
};

/**
 * Get leave requests for a user
 */
const getUserLeaveRequests = async (userId, status = null) => {
  try {
    const whereClause = {
      userId
    };

    if (status) {
      whereClause.status = status;
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        leaveType: true,
        reviewedByUser: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return leaveRequests;
  } catch (error) {
    logger.error('Error getting user leave requests:', error);
    throw error;
  }
};

/**
 * Get all leave requests for managers/admins
 */
const getAllLeaveRequests = async (filters = {}) => {
  try {
    const { status, startDate, endDate, userId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    if (startDate || endDate) {
      whereClause.AND = [];
      if (startDate) {
        whereClause.AND.push({
          startDate: {
            gte: new Date(startDate)
          }
        });
      }
      if (endDate) {
        whereClause.AND.push({
          endDate: {
            lte: new Date(endDate)
          }
        });
      }
    }

    const [leaveRequests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          leaveType: true,
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
          },
          reviewedByUser: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.leaveRequest.count({ where: whereClause })
    ]);

    return {
      leaveRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error getting all leave requests:', error);
    throw error;
  }
};

/**
 * Get a single leave request by ID
 */
const getLeaveRequestById = async (leaveRequestId) => {
  try {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        leaveType: true,
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
        },
        reviewedByUser: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    return leaveRequest;
  } catch (error) {
    logger.error('Error getting leave request by ID:', error);
    throw error;
  }
};

/**
 * Approve leave request
 */
const approveLeaveRequest = async (leaveRequestId, reviewerId, adminNotes = null) => {
  try {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId }
    });

    if (!leaveRequest) {
      throw new Error('Leave request not found');
    }

    if (leaveRequest.status !== 'PENDING') {
      throw new Error('Only pending leave requests can be approved');
    }

    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: 'APPROVED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        adminNotes
      },
      include: {
        leaveType: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        reviewedByUser: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    logger.info(`Leave request ${leaveRequestId} approved by ${reviewerId}`);

    return updatedLeaveRequest;
  } catch (error) {
    logger.error('Error approving leave request:', error);
    throw error;
  }
};

/**
 * Reject leave request
 */
const rejectLeaveRequest = async (leaveRequestId, reviewerId, rejectionReason, adminNotes = null) => {
  try {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId }
    });

    if (!leaveRequest) {
      throw new Error('Leave request not found');
    }

    if (leaveRequest.status !== 'PENDING') {
      throw new Error('Only pending leave requests can be rejected');
    }

    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: 'REJECTED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason,
        adminNotes
      },
      include: {
        leaveType: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        reviewedByUser: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    logger.info(`Leave request ${leaveRequestId} rejected by ${reviewerId}`);

    return updatedLeaveRequest;
  } catch (error) {
    logger.error('Error rejecting leave request:', error);
    throw error;
  }
};

/**
 * Cancel leave request (by employee)
 */
const cancelLeaveRequest = async (leaveRequestId, userId) => {
  try {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId }
    });

    if (!leaveRequest) {
      throw new Error('Leave request not found');
    }

    if (leaveRequest.userId !== userId) {
      throw new Error('You can only cancel your own leave requests');
    }

    if (!['PENDING', 'APPROVED'].includes(leaveRequest.status)) {
      throw new Error('Only pending or approved leave requests can be cancelled');
    }

    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: 'CANCELLED'
      },
      include: {
        leaveType: true
      }
    });

    logger.info(`Leave request ${leaveRequestId} cancelled by user ${userId}`);

    return updatedLeaveRequest;
  } catch (error) {
    logger.error('Error cancelling leave request:', error);
    throw error;
  }
};

/**
 * Get leave statistics for a user
 */
const getUserLeaveStatistics = async (userId, year = new Date().getFullYear()) => {
  try {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userId,
        status: 'APPROVED',
        startDate: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      include: {
        leaveType: true
      }
    });

    // Calculate statistics by leave type
    const statsByType = {};
    let totalLeaveTaken = 0;

    leaveRequests.forEach(leave => {
      const typeName = leave.leaveType.name;
      if (!statsByType[typeName]) {
        statsByType[typeName] = {
          days: 0,
          count: 0,
          maxDays: leave.leaveType.maxDaysPerYear
        };
      }
      statsByType[typeName].days += leave.totalDays;
      statsByType[typeName].count += 1;
      totalLeaveTaken += leave.totalDays;
    });

    return {
      year,
      totalLeaveTaken,
      byType: statsByType,
      leaveRequests: leaveRequests.length
    };
  } catch (error) {
    logger.error('Error getting user leave statistics:', error);
    throw error;
  }
};

/**
 * Get organization-wide leave calendar
 */
const getOrganizationLeaveCalendar = async (startDate, endDate) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const leaveRequests = await prisma.leaveRequest.findMany({
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
      include: {
        leaveType: true,
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
      },
      orderBy: { startDate: 'asc' }
    });

    return leaveRequests;
  } catch (error) {
    logger.error('Error getting organization leave calendar:', error);
    throw error;
  }
};

module.exports = {
  getLeaveTypes,
  createLeaveRequest,
  getUserLeaveRequests,
  getAllLeaveRequests,
  getLeaveRequestById,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  getUserLeaveStatistics,
  getOrganizationLeaveCalendar
};
