require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  db: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecretkey',
    accessExpirationMinutes: parseInt(process.env.JWT_ACCESS_EXPIRATION_MINUTES, 10) || 15, // Default 15 mins
    refreshExpirationDays: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS, 10) || 30,   // Default 30 days
  },
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
    s3BucketName: process.env.AWS_S3_BUCKET_NAME || 'onlymans-media-bucket',
  },
  cloudfront: {
    keyPairId: process.env.CF_KEY_PAIR_ID || '',
    privateKey: process.env.CF_PRIVATE_KEY || '',
    domain: process.env.CF_DOMAIN || 'cdn.onlymans.com',
  },
  cache: {
    dashboardTTL: parseInt(process.env.CACHE_TTL_DASHBOARD, 10) || 300,
    usersListTTL: parseInt(process.env.CACHE_TTL_USERS_LIST, 10) || 120,
    creatorsListTTL: parseInt(process.env.CACHE_TTL_CREATORS_LIST, 10) || 120,
    postsListTTL: parseInt(process.env.CACHE_TTL_POSTS_LIST, 10) || 60,
  },
  admin: {
    rateLimitWindowMs: parseInt(process.env.ADMIN_RATE_LIMIT_WINDOW_MS, 10) || 900000,
    rateLimitMax: parseInt(process.env.ADMIN_RATE_LIMIT_MAX, 10) || 200,
  },
};

module.exports = config;
