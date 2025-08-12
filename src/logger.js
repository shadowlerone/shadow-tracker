import winston from 'winston';
import { app } from 'electron'
import path from 'node:path';

import 'winston-daily-rotate-file'
const { combine, timestamp, json, errors } = winston.format;

const COMBINED_FP = 'combined.log'

const fileRotateTransport = new winston.transports.DailyRotateFile({
	filename: 'combined-%DATE%.log',
	datePattern: 'YYYY-MM-DD',
	maxFiles: '14d',
});
const ERROR_FP = 'app-error.log';
const EXCEPTION_FP = 'exception.log';
const REJECTION_FP = 'rejections.log';


const USER_DATA = app.getPath("userData");
const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || 'silly',
	format: combine(errors({ stack: true }), timestamp(), json()),

	transports: [
		new winston.transports.File({
			filename: /* path.join(USER_DATA, COMBINED_FP) || */ COMBINED_FP,
		}),
		new winston.transports.File({
			filename:  /* path.join(USER_DATA, ERROR_FP)||  */ERROR_FP,
			level: 'warn',
		}),
	],

	exceptionHandlers: [
		new winston.transports.File({ filename: /* path.join(USER_DATA, EXCEPTION_FP) ||  */EXCEPTION_FP }),
	],
	rejectionHandlers: [
		new winston.transports.File({ filename: /* path.join(USER_DATA, REJECTION_FP) || */ REJECTION_FP }),
	],
	exitOnError: false
});


function setupLogger(fp) {
	let logger = winston.createLogger({
		level: process.env.LOG_LEVEL || 'silly',
		format: combine(errors({ stack: true }), timestamp(), json()),

		transports: [
			new winston.transports.File({
				filename: path.join(fp, COMBINED_FP) || COMBINED_FP,
			}),
			new winston.transports.File({
				filename:  path.join(fp, ERROR_FP)|| ERROR_FP,
				level: 'warn',
			}),
		],

		exceptionHandlers: [
			new winston.transports.File({ filename: path.join(fp, EXCEPTION_FP) || EXCEPTION_FP }),
		],
		rejectionHandlers: [
			new winston.transports.File({ filename: path.join(fp, REJECTION_FP) || REJECTION_FP }),
		],
		exitOnError: false
	});
	return logger;
}

export default setupLogger;
