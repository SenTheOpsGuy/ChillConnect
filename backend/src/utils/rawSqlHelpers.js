/**
 * Raw SQL helper functions to avoid Prisma enum issues
 */

const logger = require('./logger');

/**
 * Create a new user with raw SQL
 */
async function createUserWithRawSQL(prisma, userData) {
  try {
    const { email, passwordHash, role, phone, firstName, lastName, dateOfBirth, consentGiven } = userData;
    
    // Create user
    const userResult = await prisma.$queryRaw`
      INSERT INTO "User" (id, email, "passwordHash", role, phone, "isVerified", "consentGiven", "isAgeVerified", "createdAt", "updatedAt") 
      VALUES (gen_random_uuid(), ${email}, ${passwordHash}, ${role}, ${phone}, false, ${!!consentGiven}, true, NOW(), NOW())
      RETURNING id, email, phone
    `;
    
    const user = userResult[0];
    const userId = user.id;
    
    // Create profile if provided
    if (firstName && lastName) {
      await prisma.$queryRaw`
        INSERT INTO "UserProfile" (id, "userId", "firstName", "lastName", "dateOfBirth", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${userId}, ${firstName}, ${lastName}, ${dateOfBirth ? new Date(dateOfBirth) : null}, NOW(), NOW())
      `;
    }
    
    // Create token wallet
    await prisma.$queryRaw`
      INSERT INTO "TokenWallet" (id, "userId", balance, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${userId}, 0, NOW(), NOW())
    `;
    
    logger.info(`User created with raw SQL: ${email}`);
    return user;
    
  } catch (error) {
    logger.error('Error in createUserWithRawSQL:', error);
    throw error;
  }
}

/**
 * Find user by email with raw SQL
 */
async function findUserByEmail(prisma, email) {
  try {
    const users = await prisma.$queryRaw`
      SELECT id, email, phone, "passwordHash", "isVerified", "isPhoneVerified", "isEmailVerified" 
      FROM "User" 
      WHERE email = ${email} 
      LIMIT 1
    `;
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    logger.error('Error in findUserByEmail:', error);
    throw error;
  }
}

/**
 * Find user by phone with raw SQL
 */
async function findUserByPhone(prisma, phone) {
  try {
    const users = await prisma.$queryRaw`
      SELECT id, email, phone, "passwordHash", "isVerified", "isPhoneVerified", "isEmailVerified" 
      FROM "User" 
      WHERE phone = ${phone} 
      LIMIT 1
    `;
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    logger.error('Error in findUserByPhone:', error);
    throw error;
  }
}

/**
 * Update user last login with raw SQL
 */
async function updateLastLogin(prisma, userId) {
  try {
    await prisma.$queryRaw`
      UPDATE "User" SET "lastLogin" = ${new Date()} WHERE id = ${userId}
    `;
  } catch (error) {
    logger.error('Error updating last login:', error);
    // Don't throw - login should still succeed
  }
}

module.exports = {
  createUserWithRawSQL,
  findUserByEmail,
  findUserByPhone,
  updateLastLogin
};