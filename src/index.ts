interface IOption {
  maxTask?: null | number;
}

type IhookEMUN =
  | "taskBefore"
  | "taskAfter"
  | "taskError"
  | "taskSuccess"
  | "firstTaskAfter"
  | "lastTaskAfter";

const isFun = (val: unknown): val is Function => typeof val === "function";

class TaskQueue {
  private config: Required<IOption>;

  private count: number = 0;

  private queue: Array<Function> = [];

  private isFirstTask: boolean = true;

  private callbacks: Partial<Record<IhookEMUN, () => Function>> = {};

  public hooks: Record<IhookEMUN, (cb: Function) => void>;

  constructor(option: IOption) {
    this.config = Object.assign(
      {},
      {
        maxTask: 8,
      },
      option
    );
    this.hooks = {
      taskBefore: (cb) => {
        this.callbacks.taskBefore = () => cb;
      },
      taskAfter: (cb) => {
        this.callbacks.taskAfter = () => cb;
      },
      taskError: (cb) => {
        this.callbacks.taskError = () => cb;
      },
      taskSuccess: (cb) => {
        this.callbacks.taskSuccess = () => cb;
      },
      firstTaskAfter: (cb) => {
        this.callbacks.firstTaskAfter = () => cb;
      },
      lastTaskAfter: (cb) => {
        this.callbacks.lastTaskAfter = () => cb;
      },
    };
  }

  /**
   *
   * @param caller
   * @param args
   * @returns
   */
  public addTask<T = any>(caller: Function, ...args: Array<T>) {
    if (typeof caller !== "function") {
      throw new Error("caller type mush Function");
    }
    return new Promise((resolve, reject) => {
      let task = this.createTask(caller, resolve, reject, args);
      if (this.config.maxTask !== null && this.count >= this.config.maxTask) {
        this.queue.push(task);
      } else {
        task();
      }
    });
  }
  /**
   *
   * @param caller
   * @param resolve
   * @param reject
   * @param args
   * @returns
   */
  private createTask<T = any>(
    caller: Function,
    resolve: (value: unknown) => void,
    reject: (reason?: any) => void,
    args: T[]
  ) {
    //创建一个任务，函数
    return async () => {
      this.count++;
      //执行原来的caller

      let resultTaskBefore = await this.handleHooksCallBack(
        "taskBefore",
        args,
        true
      );
      if (resultTaskBefore === null) {
        return reject(null);
      }

      try {
        resultTaskBefore = Array.isArray(resultTaskBefore)
          ? resultTaskBefore
          : [resultTaskBefore];
        let resultTask = await caller(...resultTaskBefore);
        let result = await this.handleHooksCallBack("taskAfter", resultTask);

        this.handleHooksCallBack("taskSuccess", result);
        resolve(result);
        this.handleTask(result);
      } catch (error) {
        let erorRes = await this.handleHooksCallBack("taskAfter", error);
        this.handleHooksCallBack("taskError", erorRes);
        reject(erorRes);
        this.handleTask(erorRes);
      }
    };
  }
  /**
   * 队列任务处理
   * @param {*} result
   */
  private handleTask(result: any) {
    //是否为第一个任务
    if (this.isFirstTask) {
      this.isFirstTask = false;
      this.handleHooksCallBack("firstTaskAfter", result);
    }

    //判断是否是最后一个任务
    if (this.count === 0 && this.queue.length === 0) {
      this.isFirstTask = true;
      this.handleHooksCallBack("lastTaskAfter", result);
      this.callbacks = {};
    }

    if (this.queue.length) {
      this.count--;
      let task = this.queue.shift();
      isFun(task) && task();
    }
  }

  /**
   *  处理钩子回调
   * @param {*} callName
   * @param {*} args
   * @param {*} isExtend
   * @returns
   */
  private handleHooksCallBack(
    callName: IhookEMUN,
    args: Array<any> | any,
    isExtend: boolean = false
  ) {
    if (isFun(this.callbacks[callName])) {
      try {
        let callFn = this.callbacks[callName]!();
        return isExtend ? callFn(...args) : callFn(args);
      } catch (error) {
        console.log("error:", error);
      }
    }

    return args;
  }
}
export default TaskQueue;
