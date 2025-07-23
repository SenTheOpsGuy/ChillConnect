import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

export const auditLog = async (
  userId: string | null,
  action: string,
  resource: string,
  resourceId: string | null = null,
  details: any = {},
  ipAddress: string | undefined = undefined,
  userAgent: string | undefined = undefined
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }
};

export const getAuditLogs = async (filters: {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) => {
  const {
    userId,
    action,
    resource,
    startDate,
    endDate,
    limit = 50,
    offset = 0
  } = filters;

  const where: any = {};

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (resource) where.resource = resource;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  return await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          email: true,
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    skip: offset
  });
};