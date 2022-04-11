interface IOption {
  maxTask?: null | number;
  interval?: null | number;
}

type IhookEMUN =
  | "taskBefore"
  | "taskAfter"
  | "taskError"
  | "taskSuccess"
  | "firstTaskAfter"
  | "lastTaskAfter"
  | "taskIntercept";

const isFun = (val: unknown): val is Function => typeof val === "function";
const isObj = (val: unknown): val is Record<any, any> =>
  typeof val !== null && typeof val === "object";
const isPromise = <T = any>(val: unknown): val is Promise<T> => {
  return isObj(val) && isFun(val.then) && isFun(val.catch);
};
class TaskQueue {
  private config: Required<IOption>;

  private count: number = 0;

  private queue: Array<Function> = [];

  private isFirstTask: boolean = true;

  private callbacks: Partial<Record<IhookEMUN, () => Function>> = {};

  private isRuning?: boolean = true;

  public hooks: Record<IhookEMUN, (cb: Function) => void>;

  constructor(option: IOption) {
    this.config = Object.assign(
      {},
      {
        maxTask: 8,
        interval: null,
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
      taskIntercept: (cb) => {
        this.callbacks.taskIntercept = () => cb;
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
    this.pushTask(caller, true, ...args);
  }
  /**
   *
   */
  private pushTask<T = any>(
    caller: Function,
    isRunTask: boolean = true,
    ...args: Array<T>
  ) {
    if (typeof caller !== "function") {
      throw new Error("caller type mush Function");
    }
    return new Promise((resolve, reject) => {
      let task = this.createTask(caller, resolve, reject, args);
      this.queue.push(task);
      isRunTask && this.actionTask();
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

      let resultTaskBefore: any;
      let isBeforeError: boolean | undefined;
      try {
        resultTaskBefore = this.handleHooksCallBack("taskBefore", args, true);
        if (isPromise(resultTaskBefore)) {
          resultTaskBefore = await resultTaskBefore;
        }
        resultTaskBefore === null && (isBeforeError = true);
      } catch (error) {
        isBeforeError = true;
      }
      // 中断任务执行
      if (isBeforeError) {
        // this.handleTask(args, true);
        this.handleHooksCallBack("taskIntercept", args);
        reject({ type: "Intercept", data: null, options: args });
        this.count--;
        return this.actionTask();
      }

      let resultTask;
      let isTaskType: boolean;
      try {
        //开始正式执行任务
        if (resultTaskBefore !== undefined) {
          resultTaskBefore = Array.isArray(resultTaskBefore)
            ? resultTaskBefore
            : [resultTaskBefore];
        } else {
          resultTaskBefore = args;
        }
        //这里是缺点,把原始函数当成异步执行了，产生了副作用
        resultTask = await caller(...resultTaskBefore);
        // if (isPromise(resultTask)) {
        //   resultTask = await resultTask;
        // }
        isTaskType = true;
      } catch (error) {
        resultTask = error;
        isTaskType = false;
      } finally {
        // 执行后的
        // taskAfter 这个有可能是同步或者异步
        // 异步的话有可能是resolve 或者 reject，
        // 三种情况，如果用awiat 必须的用trycatch 才能捕获reject
        let result = this.handleHooksCallBack("taskAfter", resultTask);

        this.handleTaskCallBack((data: any, isType: boolean) => {
          let isResult = isTaskType && isType;
          let taskCbType: IhookEMUN = isResult ? "taskSuccess" : "taskError";
          let taskCb: Function = isResult ? resolve : reject;

          if (this.isFirstTask) {
            this.isFirstTask = false;
            this.handleHooksCallBack("firstTaskAfter", result);
          }
          // 成功或者失败回调
          this.handleHooksCallBack(taskCbType, data);

          //处理任务
          if (this.count === 1 && this.queue.length === 0) {
            this.isFirstTask = true;
            this.handleHooksCallBack("lastTaskAfter", data);
          }
          taskCb(data);
          this.count--;
          this.actionTask();
        }, result);
      }
    };
  }

  /**
   * 处理回调
   * @param whenTimer 回调时机
   * @param resulType 回调类型，成功，失败
   * @param data 数据
   */
  private handleTaskCallBack(cb: Function, data: any) {
    if (isPromise(data)) {
      data
        .then((res) => {
          cb(res, true);
        })
        .catch((err) => {
          cb(err, false);
        });
    } else {
      cb(data, true);
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

  /**
   * 任务队列执行任务
   */
  private actionTask() {
    let { maxTask, interval } = this.config;
    //全部待执行任务总数 :this.queue.length
    //正在执行任务个数: this.count
    //最大同时可执行任务个数(并发): this.config.maxTask
    //并发间隔时间多久开始执行:this.config.interval
    let run = () => {
      if (this.queue.length <= 0 || !this.isRuning) {
        return;
      }
      //情况：存在并发最大个数
      let waitTaskArr: Function[] = [];
      if (maxTask !== null) {
        let runIndex = maxTask - this.count;
        if (runIndex > 0) {
          waitTaskArr = this.queue.splice(0, runIndex);
        }
      } else {
        // 没有限制
        waitTaskArr = this.queue.splice(0);
      }
      waitTaskArr.forEach((task) => {
        isFun(task) && task();
      });
    };
    if (interval !== null && !this.isFirstTask) {
      if (this.count === 0) {
        this.awitTimerRun(interval).then(() => {
          //可能等的过程中 队列被中断了
          run();
        });
      }
    } else {
      run();
    }
  }

  awitTimerRun(timer?: number) {
    let timeout: number | undefined;
    return new Promise((resolve) => {
      timeout = setTimeout(() => {
        resolve(true);
        clearTimeout(timeout);
      }, timer);
    });
  }

  /**
   * 停止执行任务
   */
  stopTask() {
    this.isRuning = false;
  }
  /**
   * 重新执行任务
   */
  startTask() {
    this.isRuning = true;
    this.actionTask();
  }
  /**
   * 获取当前正在执行的队列个数
   * @returns
   */
  getRunTaskCount() {
    return this.count;
  }

  /**
   * 获取当前待执行任务队列的总数
   */

  getTaskQueueCount() {
    return this.queue.length;
  }
  /**
   *
   * @param data
   * @param cb
   */
  limit<T>(data: T[], cb: Function) {
    if (Array.isArray(data) && data.length) {
      data.forEach((itme) => {
        this.pushTask(cb, false, itme);
      });
      this.actionTask();
    }
  }
}
export default TaskQueue;
