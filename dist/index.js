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
                let resultTaskBefore = yield this.handleHooksCallBack("taskBefore", args, true);
                if (resultTaskBefore === null) {
                    return reject(null);
                }
                try {
                    resultTaskBefore = Array.isArray(resultTaskBefore)
                        ? resultTaskBefore
                        : [resultTaskBefore];
                    let resultTask = yield caller(...resultTaskBefore);
                    let result = yield this.handleHooksCallBack("taskAfter", resultTask);
                    this.handleHooksCallBack("taskSuccess", result);
                    resolve(result);
                    this.handleTask(result);
                }
                catch (error) {
                    let erorRes = yield this.handleHooksCallBack("taskAfter", error);
                    this.handleHooksCallBack("taskError", erorRes);
                    reject(erorRes);
                    this.handleTask(erorRes);
                }
            });
        }
        /**
         * 队列任务处理
         * @param {*} result
         */
        handleTask(result) {
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
