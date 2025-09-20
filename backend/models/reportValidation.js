const Joi = require('joi');

// Report submission validation schema
const reportSchema = Joi.object({
  title: Joi.string().min(5).max(100).optional(),
  description: Joi.string().min(10).max(1000).required(),
  category: Joi.string().valid(
    'pothole', 'garbage', 'streetlight', 'water',
    'traffic', 'drainage', 'construction', 'other'
  ).optional(), // ✅ Make optional since frontend might send issueType
  issueType: Joi.string().valid(  // ✅ Add support for frontend field name
    'pothole', 'garbage', 'streetlight', 'water',
    'traffic', 'drainage', 'construction', 'other'
  ).optional(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    address: Joi.string().max(200).optional(),
    ward: Joi.string().max(50).optional(),
    pincode: Joi.string().pattern(/^\d{6}$/).optional()
  }).required(),
  photo: Joi.string().optional(),
  reportedBy: Joi.string().email().required(),
  reporterName: Joi.string().min(2).max(50).optional(),
  reporterPhone: Joi.string().optional(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  isAnonymous: Joi.boolean().default(false),
  fcmToken: Joi.string().optional()
}).custom((value, helpers) => {
  // ✅ Ensure either category or issueType is provided
  if (!value.category && !value.issueType) {
    return helpers.error('any.required', { label: 'category or issueType' });
  }
  return value;
});

// Status update validation schema
const statusUpdateSchema = Joi.object({
  status: Joi.string().valid(
    'submitted', 'acknowledged', 'in-progress', 'resolved', 'closed', 'rejected'
  ).required(),
  note: Joi.string().max(500).optional(),
  updatedBy: Joi.string().email().optional(),
  assignedTo: Joi.string().max(100).optional(),
  resolution: Joi.string().max(1000).optional(),
  afterPhoto: Joi.string().optional()
});

function validateReport(data) {
  return reportSchema.validate(data, { abortEarly: false });
}

function validateStatusUpdate(data) {
  return statusUpdateSchema.validate(data, { abortEarly: false });
}

module.exports = {
  validateReport,
  validateStatusUpdate,
  reportSchema,
  statusUpdateSchema
};