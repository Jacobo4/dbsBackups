const CronJob = require('cron').CronJob;

/**
 * Executes a function every day at 4am
 * @param execute The callback function to execute
 * @param message The message to log when the callback function is executed
 */
export function dailyCron(execute: () => void, message: string) {
    const job = new CronJob(
        '0 4 * * *',
        () => {
            try {
                execute();
                console.log(message);
            } catch (error) {
                console.error('Error executing daily cron job', error);
            }
        },
        null, /* This function is executed when the job stops */
        true, /* Start the job right now */
        'America/Bogota' /* Time zone of this job. */
    );
}

/**
 * Executes a function every week on Sunday at 4am
 * @param execute The callback function to execute
 * @param message The message to log when the callback function is executed
 */
export function weeklyCron(execute: () => void, message: string) {
    const job = new CronJob(
        '0 4 * * 0',
        () => {
            try {
                execute();
                console.log(message);
            }
            catch (error) {
                console.error('Error executing weekly cron job', error);
            }
        },
        null, /* This function is executed when the job stops */
        true, /* Start the job right now */
        'America/Bogota' /* Time zone of this job. */
    );
}

/**
 * Executes a function every month on the first day of the month at 4am
 * @param execute The callback function to execute
 * @param message The message to log when the callback function is executed
 */
export function monthlyCron(execute: () => void, message: string) {
    const job = new CronJob(
        '0 4 1 * *',
        () => {
            try {
                execute();
                console.log(message);
            }
            catch (error) {
                console.error('Error executing monthly cron job', error);
            }
        },
        null, /* This function is executed when the job stops */
        true, /* Start the job right now */
        'America/Bogota' /* Time zone of this job. */
    );
}