# Template-Based Chat System - Deployment Steps

## Backend Deployment

### 1. Apply Database Migration

```bash
cd backend
npx prisma migrate dev --name add-template-chat-system
```

This will:
- Add `TemplateCategory` enum
- Create `chat_templates` table
- Add `templateId` and `templateVariables` fields to `messages` table

### 2. Seed Chat Templates

```bash
npm run db:seed
```

This will:
- Create a system admin user if one doesn't exist
- Populate the database with 35+ pre-defined message templates across all categories

### 3. Verify API Routes

The following new endpoints are available:

**User Endpoints:**
- `GET /api/templates` - Get all active templates
- `GET /api/templates/categories` - Get templates grouped by category
- `POST /api/templates/send` - Send a template message

**Admin Endpoints:**
- `GET /api/templates/admin/all` - Get all templates (including inactive)
- `POST /api/templates/admin` - Create new template
- `PUT /api/templates/admin/:id` - Update template
- `DELETE /api/templates/admin/:id` - Deactivate template
- `GET /api/templates/admin/stats` - Get template usage statistics

### 4. Environment Variables

No new environment variables required.

## Frontend Implementation

### Components to Build:

1. **TemplateSelector Component** - Template picker UI for chat
2. **TemplateChatWindow Component** - Chat interface using templates only
3. **AdminTemplateManager Component** - Admin CRUD for templates
4. **TemplateVariableInput Component** - Dynamic form for template variables

## Testing

### Backend API Testing:

```bash
# Get templates (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/templates

# Get templates by category
curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:5000/api/templates?category=BOOKING_COORDINATION"

# Send template message
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BOOKING_ID",
    "templateId": "TEMPLATE_ID",
    "variables": {"time": "3:00 PM", "date": "Jan 15"}
  }' \
  http://localhost:5000/api/templates/send
```

### Database Verification:

```sql
-- Check templates were seeded
SELECT category, COUNT(*) as count
FROM chat_templates
WHERE "isActive" = true
GROUP BY category;

-- Check template usage
SELECT id, "templateText", "usageCount"
FROM chat_templates
ORDER BY "usageCount" DESC
LIMIT 10;
```

## Migration Rollback (if needed)

```bash
# If migration fails, rollback with:
npx prisma migrate resolve --rolled-back add-template-chat-system
```

## Production Checklist

- [ ] Database migration applied successfully
- [ ] Templates seeded (35+ templates)
- [ ] API endpoints responding correctly
- [ ] Admin can create/edit/delete templates
- [ ] Users can see and select templates
- [ ] Template variables are properly replaced
- [ ] Socket.IO real-time delivery works with template messages
- [ ] Analytics tracking template usage
- [ ] Old free-text chat removed/disabled

## Notes

- **Breaking Change**: This replaces free-text chat with template-only messaging
- Users will ONLY be able to send predefined messages
- Admins can add new templates as needed
- Template variables allow dynamic content (time, location, rates, etc.)
- System templates are hidden from regular users
- Template usage is tracked for analytics

## Support

If issues occur:
1. Check Prisma client is generated: `npx prisma generate`
2. Verify database connection: `curl http://localhost:5000/api/db-test`
3. Check logs: `backend/logs/` directory
4. Test auth: Ensure JWT tokens are valid
