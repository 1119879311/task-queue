interface IOption {
    maxTask?: null | number;
    interval?: null | number;
}
declare type IhookEMUN = "taskBefore" | "taskAfter" | "taskError" | "taskSuccess" | "firstTaskAfter" | "lastTaskAfter" | "taskIntercept";
declare class TaskQueue {
    private config;
    private count;
    private queue;
    private runEndCount;
    private isFirstTask;
    private callbacks;
    private isRuning?;
    hooks: Record<IhookEMUN, (cb: Function) => void>;
    constructor(option: IOption);
    /**
     * 是否开始执行下个任务
     * @returns
     */
    private isStartRun;
    /**
     *
     * @param caller
     * @param args
     * @returns
     */
    addTask<T = any>(caller: Function, ...args: Array<T>): Promise<unknown>;
    /**
     *
     */
    private pushTask;
    /**
     *
     * @param caller
     * @param resolve
     * @param reject
     * @param args
     * @returns
     */
    private createTask;
    /**
     * 处理回调
     * @param whenTimer 回调时机
     * @param resulType 回调类型，成功，失败
     * @param data 数据
     */
    private handleTaskCallBack;
    /**
     *  处理钩子回调
     * @param {*} callName
     * @param {*} args
     * @param {*} isExtend
     * @returns
     */
    private handleHooksCallBack;
    /**
     * 任务队列执行任务
     */
    private actionTask;
    awitTimerRun(timer?: number): Promise<unknown>;
    /**
     * 停止执行任务
     */
    stopTask(): void;
    /**
     * 重新执行任务
     */
    startTask(): void;
    /**
     * 获取当前正在执行的队列个数
     * @returns
     */
    getRunTaskCount(): number;
    /**
     * 获取当前待执行任务队列的总数
     */
    getTaskQueueCount(): number;
    /**
     *
     * @param data
     * @param cb
     */
    limit<T>(data: T[], cb: Function): void;
}
export default TaskQueue;
