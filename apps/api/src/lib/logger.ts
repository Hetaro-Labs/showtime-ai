import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

const GOOGLE_APPLICATION_CREDENTIALS_BASE64 = process.env
  .GOOGLE_APPLICATION_CREDENTIALS_BASE64 as string;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDevelopment = NODE_ENV === 'development';
let credentials: any;

if (GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
  try {
    credentials = JSON.parse(
      Buffer.from(GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString()
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing GOOGLE_APPLICATION_CREDENTIALS_BASE64', error);
  }
}

const createLogger = (label: string): winston.Logger => {
  const loggingWinston = new LoggingWinston({
    credentials,
  });

  return winston.createLogger({
    level: 'debug',
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.label({ label, message: true }),
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      ...(isDevelopment ? [] : [loggingWinston]),
    ],
  });
};

export const logger = createLogger('showtime-api');
