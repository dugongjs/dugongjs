export interface ILogger {
    log(context: any, ...args: any[]): void;
    error(context: any, ...args: any[]): void;
    warn(context: any, ...args: any[]): void;
    verbose(context: any, ...args: any[]): void;
}
