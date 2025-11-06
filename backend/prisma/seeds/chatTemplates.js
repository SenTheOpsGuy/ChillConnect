/**
 * Chat Template Seed Data
 * Initial templates for template-based messaging system
 */

const chatTemplates = [
  // BOOKING_COORDINATION Templates
  {
    category: 'BOOKING_COORDINATION',
    templateText: 'What time works best for you?',
    description: 'Ask about preferred time',
    variables: [],
  },
  {
    category: 'BOOKING_COORDINATION',
    templateText: 'Can we confirm the appointment for {{time}} on {{date}}?',
    description: 'Confirm appointment time',
    variables: ['time', 'date'],
  },
  {
    category: 'BOOKING_COORDINATION',
    templateText: 'I need to reschedule our appointment',
    description: 'Request to reschedule',
    variables: [],
  },
  {
    category: 'BOOKING_COORDINATION',
    templateText: 'Please confirm the location for our meeting',
    description: 'Confirm meeting location',
    variables: [],
  },
  {
    category: 'BOOKING_COORDINATION',
    templateText: 'I\'m running {{minutes}} minutes late',
    description: 'Notify about being late',
    variables: ['minutes'],
  },
  {
    category: 'BOOKING_COORDINATION',
    templateText: 'Are you available for {{duration}} hours starting at {{time}}?',
    description: 'Check availability for specific duration',
    variables: ['duration', 'time'],
  },
  {
    category: 'BOOKING_COORDINATION',
    templateText: 'Appointment confirmed for {{date}} at {{time}}',
    description: 'Confirm appointment details',
    variables: ['date', 'time'],
  },

  // SERVICE_DISCUSSION Templates
  {
    category: 'SERVICE_DISCUSSION',
    templateText: 'What services are you interested in?',
    description: 'Ask about service preferences',
    variables: [],
  },
  {
    category: 'SERVICE_DISCUSSION',
    templateText: 'My rates are {{rate}} tokens per hour',
    description: 'State hourly rate',
    variables: ['rate'],
  },
  {
    category: 'SERVICE_DISCUSSION',
    templateText: 'The session duration will be {{hours}} hours',
    description: 'Specify session duration',
    variables: ['hours'],
  },
  {
    category: 'SERVICE_DISCUSSION',
    templateText: 'Do you have any specific preferences?',
    description: 'Ask about preferences',
    variables: [],
  },
  {
    category: 'SERVICE_DISCUSSION',
    templateText: 'Please review my service menu in my profile',
    description: 'Direct to service menu',
    variables: [],
  },
  {
    category: 'SERVICE_DISCUSSION',
    templateText: 'I offer {{serviceType}} services',
    description: 'Specify service type',
    variables: ['serviceType'],
  },
  {
    category: 'SERVICE_DISCUSSION',
    templateText: 'The total cost will be {{totalTokens}} tokens',
    description: 'State total cost',
    variables: ['totalTokens'],
  },

  // LOGISTICS Templates
  {
    category: 'LOGISTICS',
    templateText: 'I\'ll be arriving at the specified time',
    description: 'Confirm arrival',
    variables: [],
  },
  {
    category: 'LOGISTICS',
    templateText: 'Please share the exact address',
    description: 'Request address',
    variables: [],
  },
  {
    category: 'LOGISTICS',
    templateText: 'I\'m here, please let me know when ready',
    description: 'Notify arrival',
    variables: [],
  },
  {
    category: 'LOGISTICS',
    templateText: 'Thank you for a wonderful time',
    description: 'Express gratitude',
    variables: [],
  },
  {
    category: 'LOGISTICS',
    templateText: 'Session is complete',
    description: 'Confirm session completion',
    variables: [],
  },
  {
    category: 'LOGISTICS',
    templateText: 'I\'m {{distance}} minutes away',
    description: 'Notify estimated arrival',
    variables: ['distance'],
  },
  {
    category: 'LOGISTICS',
    templateText: 'Heading to the location now',
    description: 'Notify departure',
    variables: [],
  },

  // SUPPORT Templates
  {
    category: 'SUPPORT',
    templateText: 'I have a question about the booking',
    description: 'General booking question',
    variables: [],
  },
  {
    category: 'SUPPORT',
    templateText: 'There seems to be an issue',
    description: 'Report issue',
    variables: [],
  },
  {
    category: 'SUPPORT',
    templateText: 'I need to contact support',
    description: 'Request support',
    variables: [],
  },
  {
    category: 'SUPPORT',
    templateText: 'Please help resolve this matter',
    description: 'Request assistance',
    variables: [],
  },
  {
    category: 'SUPPORT',
    templateText: 'I need to file a dispute about this booking',
    description: 'Initiate dispute',
    variables: [],
  },
  {
    category: 'SUPPORT',
    templateText: 'Can we discuss the booking terms?',
    description: 'Discuss terms',
    variables: [],
  },

  // SYSTEM Templates (for automated messages)
  {
    category: 'SYSTEM',
    templateText: 'Your booking has been confirmed',
    description: 'System booking confirmation',
    variables: [],
  },
  {
    category: 'SYSTEM',
    templateText: 'Reminder: Your appointment is in {{hours}} hours',
    description: 'System reminder',
    variables: ['hours'],
  },
  {
    category: 'SYSTEM',
    templateText: 'Payment received: {{amount}} tokens',
    description: 'Payment confirmation',
    variables: ['amount'],
  },
  {
    category: 'SYSTEM',
    templateText: 'Booking cancelled - refund processed',
    description: 'Cancellation notice',
    variables: [],
  },
  {
    category: 'SYSTEM',
    templateText: 'Please rate your experience',
    description: 'Rating request',
    variables: [],
  },
];

module.exports = { chatTemplates };
