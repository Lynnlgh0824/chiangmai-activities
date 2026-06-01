const multer = require('multer');
const path = require('path');

// 配置 multer 文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 降低到2MB，防止DoS攻击
    files: 1 // 限制单次只能上传1个文件
  },
  fileFilter: function (req, file, cb) {
    // 安全性增强：多重验证

    // 1. 检查文件扩展名
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!allowedExts.includes(ext)) {
      return cb(new Error(`不支持的文件扩展名: ${ext}。仅支持: ${allowedExts.join(', ')}`));
    }

    // 2. 验证MIME类型
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error(`不支持的MIME类型: ${file.mimetype}`));
    }

    // 3. 文件名安全检查（防止路径遍历攻击）
    const originalname = file.originalname;
    if (originalname.includes('..') || originalname.includes('/') || originalname.includes('\\')) {
      return cb(new Error('文件名包含非法字符'));
    }

    // 4. 检查文件名长度
    if (originalname.length > 255) {
      return cb(new Error('文件名过长'));
    }

    // 所有检查通过
    cb(null, true);
  }
});

module.exports = {
  upload
};
