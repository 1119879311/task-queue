# task-queue 是一个可以控制任务(函数)队列并发的库，支持一个并发队列的等待间隔时间

```javascript

//示例：
const TaskQueue = require("task-queue").default;
let queueInstance = new TaskQueue({ maxTask: 5 ,interval:2000});

// 监听任务执行前，要返回原来的参数(可修改执行参数)，返回null 终止任务执行
queueInstance.hooks.taskBefore(function (res) {
  console.log("taskBefore", res);
  if (res.a % 3 == 0) {
    return null;
  }
  if (res.a % 4 == 0) {
    return Promise.reject(null);
  }
  return res;
});

// 监听任务执行完毕后，要返回执行后的结果(可修改后的结果)
queueInstance.hooks.taskAfter(function (res) {
  console.log("taskAfter", res);
  return res * 10;
});

let errcoutTask = 0;
let successcoutTask = 0;
let InterceptTask = 0;

// 监听任务成功回调
queueInstance.hooks.taskSuccess(function (res) {
  successcoutTask++;
  console.log("taskSuccess", res);
});

// 任务失败执行后回调,和拦截回调不一样,拦截回调是任务根本没有执行
queueInstance.hooks.taskError(function (res) {
  errcoutTask++;
  console.log("taskError", res);
});

//监听第一个任务执行完毕
queueInstance.hooks.firstTaskAfter(function (res) {
  console.log(" 第一个任务执行完毕:firstTaskAfter", res);
});

// 任务被拦截后，监听回调
queueInstance.hooks.taskIntercept(function (res) {
  InterceptTask++;
  console.log("任务被终止执行：taskIntercept", res);
});
// 监听最后一个任务执行完毕
queueInstance.hooks.lastTaskAfter(function (res) {
  console.log("成功执行：", successcoutTask);
  console.log("失败执行：", errcoutTask);
  console.log("没有执行(被拦截)：", InterceptTask);
  console.log("最后一个任务执行完毕：lastTaskAfter", res);
});
// 示例1： 
// 创建 [max,min] 范围的随机数
function createRond(max, min) {
  return Math.floor(min + Math.random() * (max - min));
}

// 要调用的目标方法
function asyncAdd(options) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // resolve(a + b[0] + b[1]);
      resolve(options.a + options.b);
    }, createRond(10000, 5000));
  });
}

// 使用队列的目标方法
let queueAsyncAdd = (...args) => {
  return queueInstance.addTask(asyncAdd, ...args);
};

for (let index = 0; index < 20; index++) {

 //没使用队列的，一次性执行完毕
 asyncAdd({ a: index, b: 10 })
    .then((res) => {
      console.log("执行 完第" + index + "个任务:", "结果为：", res);
    })
    .catch((err) => {
      console.log("err", err);
    });

    // 使用队列，控制并发执行个数
  queueAsyncAdd({ a: index, b: 10 })
    .then((res) => {
      console.log("执行 完第" + index + "个任务:", "结果为：", res);
    })
    .catch((err) => {
      console.log("err", err);
    });
}


// 示例2 : axios, fetch 请求控制并发,
let queueInstance2 = new TaskQueue({ maxTask: 5 });

functiono ajax(...args){
     //  return queueInstance.addTask(fetch, ...args);
   return queueInstance2.addTask(axios, ...args);
}


for (let index = 0; index < 20; index++) {

    // 不使用队列控制
    axios("http://120.77.83.15:3003/api/code?index=" + index, {})
      .then((res) => {
        console.log("axios-index", index);
      })
      .catch((err) => {
        console.log("axios-err", err);
      });

    // 使用队列控制
    ajax("http://192.168.0.102:8081/api/code?id=" +index, {})
      .then((res) => {
        console.log("res", res.data, index);
      })
      .catch((err) => {
        console.log("err", err);
      });
}

```
## TaskQueue
- constructor(options) 
  - options.maxTask <null | number> 最大并发任务数,同时最多可执行5个任务
  - options.interval <null | number> 并发任务数的时间间隔,比如有10个任务待执行，最大并发数是5，那么执行完5个任务后，等待interval 毫秒后重新执行下个一个并发任务数5 个任务

### 实例属性: 钩子周期 hooks
 - hooks.taskBefore(res):任务执行前的回调,要返回原来的参数(可修改执行参数)，返回null 终止任务执行
  
 - hooks.taskAfter(res):任务执行后回调,回调参数是原始函数执行后结果，要返回执行后的结果(可修改后的结果)
  
 - hooks.taskError(error):任务执行后失败回调，无论是原始函数执行后的错误，还是hooks.taskAfter 抛出的错误，都会被该回调捕获，无需返回值
  
 - hooks.taskSuccess(res):任务成功执行后的回调，回调参数是有可能是 hooks.taskAfter 的返回值，否则是原始函数执行后结果

 - hooks.firstTaskAfter(res):队列里面第一个任务执行后回调
 - 
 - hooks.lastTaskAfter(res):队列里面最后一个任务执行后回调
 - 
 - hooks.taskIntercept():任务被拦截,终止执行后回调(hooks.taskBefore 返回null),没有执行原始函数
  
### 实例方法
 - addTask(callback,...args): 将一个函数包装成经过队列控制的函数,callback 是原始函数，args 是callback 本身的参数,返回的是一个函数
 - stopTask():停止待执行的任务
 - startTask():开始执行待执行的任务
 - getTaskQueueCount():获取当前待执行任务的个数 
 - getRunTaskCount() : 获取当前正在执行的任务个数
 - limt([],callback): 与addTask 不同,第一个参数是数组，数组每个参数将作为第二callback 回调的参数,回调函数成为队列里面的每个任务