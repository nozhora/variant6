import { ref } from 'process';

export default () => ({
  port: parseInt(process.env.PORT!, 10) || 3000,
  database: {},
  jwt: {
    acceessSecret: process.env.JWT_ACCESS_SECRET!,
    accessExpiresIn: process.env.JWT_EXPIRES_IN!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN!,
  },
});
