export declare class Logger {
    actor: string;
    color: string;
    static setDefaults(silent: boolean, verbose: boolean): void;
    constructor(actor?: string, color?: string);
    info(msg: string): void;
    success(msg: string): void;
    warn(msg: string, error?: Error): void;
    error(msg: string, error?: Error): void;
    log(msg: string, emoji: string, color?: string): void;
}
declare const _default: Logger;
export default _default;
