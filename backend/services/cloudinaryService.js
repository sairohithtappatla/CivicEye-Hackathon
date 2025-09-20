const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryService {
  async uploadReportPhoto(base64Image, ticketNumber, reportId) {
    try {
      const result = await cloudinary.uploader.upload(base64Image, {
        folder: 'civiceye-reports',
        public_id: `report-${ticketNumber}-${uuidv4()}`,
        transformation: [
          { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
          { fetch_format: 'auto' }
        ],
        tags: ['report', 'citizen', ticketNumber],
        context: {
          reportId: reportId,
          ticketNumber: ticketNumber,
          uploadedAt: new Date().toISOString()
        }
      });

      console.log(`📸 Photo uploaded to Cloudinary: ${result.public_id}`);

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes
      };
    } catch (error) {
      console.error('❌ Cloudinary upload failed:', error);
      return { success: false, error: error.message };
    }
  }

  async uploadAfterPhoto(base64Image, ticketNumber, reportId) {
    try {
      const result = await cloudinary.uploader.upload(base64Image, {
        folder: 'civiceye-reports/after',
        public_id: `after-${ticketNumber}-${uuidv4()}`,
        transformation: [
          { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }
        ],
        tags: ['after', 'resolved', ticketNumber],
        context: {
          reportId: reportId,
          ticketNumber: ticketNumber,
          type: 'after_resolution',
          uploadedAt: new Date().toISOString()
        }
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id
      };
    } catch (error) {
      console.error('❌ After photo upload failed:', error);
      return { success: false, error: error.message };
    }
  }

  async deletePhoto(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return { success: result.result === 'ok' };
    } catch (error) {
      console.error('❌ Photo deletion failed:', error);
      return { success: false, error: error.message };
    }
  }

  generateThumbnail(publicId, width = 300, height = 300) {
    return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto'
    });
  }
}

module.exports = new CloudinaryService();