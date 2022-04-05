interface IOption {
    maxTask?: null | number;
}
declare type IhookEMUN = "taskBefore" | "taskAfter" | "taskError" | "taskSuccess" | "firstTaskAfter" | "lastTaskAfter" | "taskIntercept";
declare class TaskQueue {
    private config;
    private count;
    private queue;
    private isFirstTask;
    private callbacks;
    hooks: Record<IhookEMUN, (cb: Function) => void>;
    constructor(option: IOption);
    /**
     *
     * @param caller
     * @param args
     * @returns
     */
    addTask<T = any>(caller: Function, ...args: Array<T>): Promise<unknown>;
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
     * 队列任务处理
     * @param {*} result
     */
    private handleTask;
    /**
     *  处理钩子回调
     * @param {*} callName
     * @param {*} args
     * @param {*} isExtend
     * @returns
     */
    private handleHooksCallBack;
}
export default TaskQueue;
