import chalk from 'chalk';
import * as moment from 'moment';
import { Stopwatch } from './Stopwatch';

export class Logger {
    /**
     * A string with whitespace used for indenting all messages
     */
    private indent = '';

    constructor(logLevel?: LogLevel) {
        this.logLevel = logLevel;
    }

    public get logLevel() {
        return this._logLevel;
    }

    public set logLevel(value: LogLevel) {
        //cast the string version to the numberic version
        if (typeof (value) === 'string') {
            value = LogLevel[value] as any;
        }
        this._logLevel = value ?? LogLevel.log;
    }

    private _logLevel = LogLevel.log;

    private getTimestamp() {
        return '[' + chalk.grey(moment().format(`hh:mm:ss:SSSS A`)) + ']';
    }

    private writeToLog(method: (...consoleArgs: any[]) => void, ...args: any[]) {
        if (this._logLevel === LogLevel.trace) {
            method = console.trace;
        }
        let finalArgs = [];
        for (let arg of args) {
            finalArgs.push(arg);
        }
        method.call(console, this.getTimestamp(), this.indent, ...finalArgs);
    }

    /**
     * Log an error message to the console
     */
    error(...messages) {
        if (this._logLevel >= LogLevel.error) {
            this.writeToLog(console.error, ...messages);
        }
    }

    /**
     * Log a warning message to the console
     */
    warn(...messages) {
        if (this._logLevel >= LogLevel.warn) {
            this.writeToLog(console.warn, ...messages);
        }
    }

    /**
     * Log a standard log message to the console
     */
    log(...messages) {
        if (this._logLevel >= LogLevel.log) {
            this.writeToLog(console.log, ...messages);
        }
    }

    /**
     * Log an info message to the console
     */
    info(...messages) {
        if (this._logLevel >= LogLevel.info) {
            this.writeToLog(console.info, ...messages);
        }
    }

    /**
     * Log a debug message to the console
     */
    debug(...messages) {
        if (this._logLevel >= LogLevel.debug) {
            this.writeToLog(console.debug, ...messages);
        }
    }

    /**
     * Log a debug message to the console
     */
    trace(...messages) {
        if (this._logLevel >= LogLevel.trace) {
            this.writeToLog(console.trace, ...messages);
        }
    }

    /**
     * Writes to the log (if logLevel matches), and also times how long the action took to occur.
     * `action` is called regardless of logLevel, so this function can be used to nicely wrap
     * pieces of functionality.
     * The action function also includes two parameters, `pause` and `resume`, which can be used to improve timings by focusing only on
     * the actual logic of that action.
     */
    time<T>(logLevel: LogLevel, messages: any[], action: (pause: () => void, resume: () => void) => T): T {
        //call the log if loglevel is in range
        if (this._logLevel >= logLevel) {
            let stopwatch = new Stopwatch();
            let logLevelString = LogLevel[logLevel];

            //write the initial log
            this[logLevelString](...messages);
            this.indent += '  ';

            stopwatch.start();
            //execute the action
            let result = action(stopwatch.stop.bind(stopwatch), stopwatch.start.bind(stopwatch)) as any;
            stopwatch.stop();

            //return a function to call when the timer is complete
            let done = () => {
                this.indent = this.indent.substring(2);
                this[logLevelString](...messages ?? [], `finished. (${chalk.blue(stopwatch.getDurationText())})`);
            };

            //if this is a promise, wait for it to resolve and then return the original result
            if (typeof result?.then === 'function') {
                return Promise.resolve(result).then(done).then(() => {
                    return result;
                }) as any;
            } else {
                //this was not a promise. finish the timer now
                done();
                return result;
            }
        } else {
            return action(noop, noop);
        }
    }
}

export function noop() {

}

export enum LogLevel {
    off = 0,
    error = 1,
    warn = 2,
    log = 3,
    info = 4,
    debug = 5,
    trace = 6
}
