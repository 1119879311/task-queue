var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const isFun = (val) => typeof val === "function";
    class TaskQueue {
        constructor(option) {
            this.count = 0;
            this.queue = [];
            this.isFirstTask = true;
            this.callbacks = {};
            this.config = Object.assign({}, {
                maxTask: 8,
            }, option);
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
        addTask(caller, ...args) {
            if (typeof caller !== "function") {
                throw new Error("caller type mush Function");
            }
            return new Promise((resolve, reject) => {
                let task = this.createTask(caller, resolve, reject, args);
                if (this.config.maxTask !== null && this.count >= this.config.maxTask) {
                    this.queue.push(task);
                }
                else {
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
        createTask(caller, resolve, reject, args) {
            //创建一个任务，函数
            return () => __awaiter(this, void 0, void 0, function* () {
                this.count++;
                //执行原来的caller
                let resultTaskBefore;
                try {
                    resultTaskBefore = yield this.handleHooksCallBack("taskBefore", args, true);
                    if (resultTaskBefore === null) {
                        this.handleTask(args, true);
                        return reject({ type: "Intercept", data: null, options: args });
                    }
                }
                catch (error) {
                    this.handleTask(args, true);
                    return reject({ type: "Intercept", data: null, options: args });
                }
                try {
                    resultTaskBefore = Array.isArray(resultTaskBefore)
                        ? resultTaskBefore
                        : [resultTaskBefore];
                    let resultTask = yield caller(...resultTaskBefore);
                    // 执行后的
                    let result = yield this.handleHooksCallBack("taskAfter", resultTask);
                    // 成功
                    this.handleHooksCallBack("taskSuccess", result);
                    //处理任务
                    this.handleTask(result);
                    resolve(result);
                }
                catch (error) {
                    // 执行后的
                    let erorRes = yield this.handleHooksCallBack("taskAfter", error);
                    // 失败
                    this.handleHooksCallBack("taskError", erorRes);
                    //处理任务
                    this.handleTask(erorRes);
                    reject(erorRes);
                }
            });
        }
        /**
         * 队列任务处理
         * @param {*} result
         */
        handleTask(result, isBlock) {
            this.count--;
            //是否为第一个任务
            if (this.isFirstTask) {
                this.isFirstTask = false;
                !isBlock && this.handleHooksCallBack("firstTaskAfter", result);
            }
            //判断是否是最后一个任务
            if (this.count === 0 && this.queue.length === 0) {
                this.isFirstTask = true;
                !isBlock && this.handleHooksCallBack("lastTaskAfter", result);
                this.callbacks = {};
            }
            // 任务被拦截后回调
            isBlock && this.handleHooksCallBack("taskIntercept", result);
            if (this.queue.length) {
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
        handleHooksCallBack(callName, args, isExtend = false) {
            if (isFun(this.callbacks[callName])) {
                try {
                    let callFn = this.callbacks[callName]();
                    return isExtend ? callFn(...args) : callFn(args);
                }
                catch (error) {
                    console.log("error:", error);
                }
            }
            return args;
        }
    }
    exports.default = TaskQueue;
});
