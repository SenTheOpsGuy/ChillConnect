import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

export const assignToEmployee = async (itemId: string, itemType: 'booking' | 'verification') => {
  try {
    // Get all active employees
    const employees = await prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
        isActive: true
      },
      include: {
        assignments: {
          where: {
            status: 'active'
          }
        }
      }
    });

    if (employees.length === 0) {
      logger.warn('No active employees available for assignment');
      return null;
    }

    // Find employee with least active assignments (round-robin)
    const employeeWithLeastLoad = employees.reduce((prev, current) => {
      return prev.assignments.length <= current.assignments.length ? prev : current;
    });

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        employeeId: employeeWithLeastLoad.id,
        itemId,
        itemType,
        status: 'active'
      }
    });

    // Update booking with assigned employee if it's a booking
    if (itemType === 'booking') {
      await prisma.booking.update({
        where: { id: itemId },
        data: { employeeId: employeeWithLeastLoad.id }
      });
    }

    logger.info(`${itemType} ${itemId} assigned to employee ${employeeWithLeastLoad.id}`);
    
    return assignment;
  } catch (error) {
    logger.error('Assignment failed:', error);
    throw error;
  }
};

export const reassignItem = async (assignmentId: string, newEmployeeId: string) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Mark old assignment as reassigned
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { status: 'reassigned' }
    });

    // Create new assignment
    const newAssignment = await prisma.assignment.create({
      data: {
        employeeId: newEmployeeId,
        itemId: assignment.itemId,
        itemType: assignment.itemType,
        status: 'active'
      }
    });

    // Update booking if it's a booking assignment
    if (assignment.itemType === 'booking') {
      await prisma.booking.update({
        where: { id: assignment.itemId },
        data: { employeeId: newEmployeeId }
      });
    }

    logger.info(`${assignment.itemType} ${assignment.itemId} reassigned to employee ${newEmployeeId}`);
    
    return newAssignment;
  } catch (error) {
    logger.error('Reassignment failed:', error);
    throw error;
  }
};

export const completeAssignment = async (assignmentId: string) => {
  try {
    const assignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: { 
        status: 'completed',
        completedAt: new Date()
      }
    });

    logger.info(`Assignment ${assignmentId} completed`);
    
    return assignment;
  } catch (error) {
    logger.error('Assignment completion failed:', error);
    throw error;
  }
};

export const getEmployeeWorkload = async (employeeId?: string) => {
  const where = employeeId ? { employeeId } : {};

  const workload = await prisma.assignment.groupBy({
    by: ['employeeId'],
    where: {
      ...where,
      status: 'active'
    },
    _count: {
      id: true
    }
  });

  const employeeDetails = await prisma.user.findMany({
    where: {
      id: { in: workload.map(w => w.employeeId) },
      role: 'EMPLOYEE'
    },
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
  });

  return workload.map(w => ({
    employeeId: w.employeeId,
    activeAssignments: w._count.id,
    employee: employeeDetails.find(e => e.id === w.employeeId)
  }));
};