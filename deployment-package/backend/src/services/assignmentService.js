const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// Get next employee for round-robin assignment
const getNextEmployee = async (assignmentType) => {
  try {
    // Get all employees eligible for assignment
    const employees = await prisma.user.findMany({
      where: {
        role: {
          in: ['EMPLOYEE', 'MANAGER', 'ADMIN']
        },
        isVerified: true
      },
      orderBy: {
        createdAt: 'asc' // Consistent ordering
      }
    });

    if (employees.length === 0) {
      throw new Error('No employees available for assignment');
    }

    // Get or create round-robin counter
    let counter = await prisma.roundRobinCounter.findUnique({
      where: { type: assignmentType }
    });

    if (!counter) {
      counter = await prisma.roundRobinCounter.create({
        data: {
          type: assignmentType,
          lastAssignedId: null
        }
      });
    }

    // Find next employee
    let nextEmployee;
    if (!counter.lastAssignedId) {
      // First assignment
      nextEmployee = employees[0];
    } else {
      // Find current employee index
      const currentIndex = employees.findIndex(emp => emp.id === counter.lastAssignedId);
      
      if (currentIndex === -1) {
        // Current employee not found (maybe deleted), start from beginning
        nextEmployee = employees[0];
      } else {
        // Get next employee (wrap around if at end)
        const nextIndex = (currentIndex + 1) % employees.length;
        nextEmployee = employees[nextIndex];
      }
    }

    // Update counter
    await prisma.roundRobinCounter.update({
      where: { type: assignmentType },
      data: { lastAssignedId: nextEmployee.id }
    });

    return nextEmployee;
  } catch (error) {
    logger.error(`Error getting next employee for ${assignmentType}:`, error);
    throw error;
  }
};

// Assign employee to verification task
const assignVerification = async (verificationId) => {
  try {
    const employee = await getNextEmployee('verification');
    
    // Create assignment record
    await prisma.assignment.create({
      data: {
        employeeId: employee.id,
        itemId: verificationId,
        itemType: 'VERIFICATION',
        isActive: true
      }
    });

    // Update verification record
    await prisma.verification.update({
      where: { id: verificationId },
      data: {
        employeeId: employee.id,
        assignedAt: new Date(),
        status: 'IN_PROGRESS'
      }
    });

    logger.info(`Verification ${verificationId} assigned to employee ${employee.id}`);
    
    return employee;
  } catch (error) {
    logger.error(`Error assigning verification ${verificationId}:`, error);
    throw error;
  }
};

// Assign employee to booking monitoring
const assignBookingMonitoring = async (bookingId) => {
  try {
    const employee = await getNextEmployee('booking_monitoring');
    
    // Create assignment record
    await prisma.assignment.create({
      data: {
        employeeId: employee.id,
        itemId: bookingId,
        itemType: 'BOOKING_MONITORING',
        isActive: true
      }
    });

    // Update booking record
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        assignedEmployeeId: employee.id
      }
    });

    logger.info(`Booking ${bookingId} assigned to employee ${employee.id} for monitoring`);
    
    return employee;
  } catch (error) {
    logger.error(`Error assigning booking monitoring ${bookingId}:`, error);
    throw error;
  }
};

// Complete assignment
const completeAssignment = async (assignmentId) => {
  try {
    const assignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        isActive: false,
        completedAt: new Date()
      }
    });

    logger.info(`Assignment ${assignmentId} completed`);
    
    return assignment;
  } catch (error) {
    logger.error(`Error completing assignment ${assignmentId}:`, error);
    throw error;
  }
};

// Get employee workload
const getEmployeeWorkload = async (employeeId) => {
  try {
    const activeAssignments = await prisma.assignment.count({
      where: {
        employeeId,
        isActive: true
      }
    });

    const verificationCount = await prisma.assignment.count({
      where: {
        employeeId,
        itemType: 'VERIFICATION',
        isActive: true
      }
    });

    const bookingMonitoringCount = await prisma.assignment.count({
      where: {
        employeeId,
        itemType: 'BOOKING_MONITORING',
        isActive: true
      }
    });

    return {
      total: activeAssignments,
      verifications: verificationCount,
      bookingMonitoring: bookingMonitoringCount
    };
  } catch (error) {
    logger.error(`Error getting workload for employee ${employeeId}:`, error);
    throw error;
  }
};

// Get all employee workloads (for admin dashboard)
const getAllEmployeeWorkloads = async () => {
  try {
    const employees = await prisma.user.findMany({
      where: {
        role: {
          in: ['EMPLOYEE', 'MANAGER', 'ADMIN']
        },
        isVerified: true
      },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    const workloads = await Promise.all(
      employees.map(async (employee) => {
        const workload = await getEmployeeWorkload(employee.id);
        return {
          employeeId: employee.id,
          name: `${employee.profile.firstName} ${employee.profile.lastName}`,
          email: employee.email,
          role: employee.role,
          workload
        };
      })
    );

    return workloads;
  } catch (error) {
    logger.error('Error getting all employee workloads:', error);
    throw error;
  }
};

// Reassign task to different employee
const reassignTask = async (assignmentId, newEmployeeId) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        employee: {
          select: {
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

    if (!assignment || !assignment.isActive) {
      throw new Error('Assignment not found or already completed');
    }

    // Update assignment
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        employeeId: newEmployeeId
      }
    });

    // Update related records
    if (assignment.itemType === 'VERIFICATION') {
      await prisma.verification.update({
        where: { id: assignment.itemId },
        data: {
          employeeId: newEmployeeId,
          assignedAt: new Date()
        }
      });
    } else if (assignment.itemType === 'BOOKING_MONITORING') {
      await prisma.booking.update({
        where: { id: assignment.itemId },
        data: {
          assignedEmployeeId: newEmployeeId
        }
      });
    }

    logger.info(`Assignment ${assignmentId} reassigned from ${assignment.employeeId} to ${newEmployeeId}`);
    
    return assignment;
  } catch (error) {
    logger.error(`Error reassigning assignment ${assignmentId}:`, error);
    throw error;
  }
};

// Get assignment queue for employee
const getAssignmentQueue = async (employeeId) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: {
        employeeId,
        isActive: true
      },
      orderBy: {
        assignedAt: 'asc'
      }
    });

    const queue = await Promise.all(
      assignments.map(async (assignment) => {
        let details = {};
        
        if (assignment.itemType === 'VERIFICATION') {
          const verification = await prisma.verification.findUnique({
            where: { id: assignment.itemId },
            include: {
              user: {
                select: {
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
          
          details = {
            type: 'verification',
            user: verification.user,
            documentType: verification.documentType,
            documentUrl: verification.documentUrl,
            status: verification.status,
            createdAt: verification.createdAt
          };
        } else if (assignment.itemType === 'BOOKING_MONITORING') {
          const booking = await prisma.booking.findUnique({
            where: { id: assignment.itemId },
            include: {
              seeker: {
                select: {
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              },
              provider: {
                select: {
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
          
          details = {
            type: 'booking_monitoring',
            seeker: booking.seeker.profile,
            provider: booking.provider.profile,
            bookingType: booking.type,
            startTime: booking.startTime,
            status: booking.status,
            createdAt: booking.createdAt
          };
        }

        return {
          assignmentId: assignment.id,
          itemId: assignment.itemId,
          itemType: assignment.itemType,
          assignedAt: assignment.assignedAt,
          details
        };
      })
    );

    return queue;
  } catch (error) {
    logger.error(`Error getting assignment queue for employee ${employeeId}:`, error);
    throw error;
  }
};

module.exports = {
  getNextEmployee,
  assignVerification,
  assignBookingMonitoring,
  completeAssignment,
  getEmployeeWorkload,
  getAllEmployeeWorkloads,
  reassignTask,
  getAssignmentQueue
};