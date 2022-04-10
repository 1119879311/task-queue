const TaskQueue = require("../dist/index").default;
let queueInstance = new TaskQueue({ maxTask: null, interval: null });

// 监听任务执行前，要返回原来的参数(可修改执行参数)，返回null 终止任务执行
queueInstance.hooks.taskBefore(function (res) {
  console.log("hooks-taskBefore", res);
  console.log(
    "--------------当前执行任务个数：",
    queueInstance.getRunTaskCount(),
    queueInstance.getTaskQueueCount()
  );

  //终止待执行的任务(指那些待执行的任务，正在执行的任务不可通过该方法中断)
  if (queueInstance.getRunTaskCount() == 30) {
    console.log("----------等待执行的任务将被中断10 秒");
    queueInstance.stopTask();
    queueInstance.awitTimerRun(9000).then(() => {
      console.log(
        "----------中断的待执行任务重新开始执行",
        queueInstance.getTaskQueueCount()
      );
      queueInstance.runTask();
    });
  }

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
  console.log("hooks-taskAfter", res);

  return res;
  // return Promise.resolve(res * 10);
});

let errcoutTask = 0;
let successcoutTask = 0;
let InterceptTask = 0;

// 监听任务成功回调
queueInstance.hooks.taskSuccess(function (res) {
  successcoutTask++;
  console.log("hooks-taskSuccess", res);
});

queueInstance.hooks.taskError(function (res) {
  errcoutTask++;
  console.log("hooks-taskError", res);
});
// 监听第一个任务执行完毕
queueInstance.hooks.firstTaskAfter(function (res) {
  console.log(" 第一个任务执行完毕:firstTaskAfter", res);
});
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

// 创建 [max,min] 范围的随机数
function createRond(max, min) {
  return Math.floor(min + Math.random() * (max - min));
}

// 示例1：

// 要调用的目标方法
function asyncAdd(options) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // resolve(a + b[0] + b[1]);

      if (options.a % 2 == 0) {
        resolve(options.a + options.b);
      } else {
        reject(options.a + options.b);
      }
    }, createRond(5000, 2000));
  });
}

// 使用队列的目标方法
let queueAsyncAdd = (...args) => {
  return queueInstance.addTask(asyncAdd, ...args);
};

for (let index = 0; index < 8; index++) {
  //没使用队列的，一次性执行完毕
  // asyncAdd({ a: index, b: 10 })
  //   .then((res) => {
  //     console.log("执行 完第" + index + "个任务:", "结果为：", res);
  //   })
  //   .catch((err) => {
  //     console.log("err", err);
  //   });
  // 使用队列，控制并发执行个数
  queueAsyncAdd({ a: index, b: 10 })
    .then((res) => {
      console.log("执行 完第" + index + "个任务:", "成功结果为：", res);
    })
    .catch((err) => {
      console.log("执行 完第" + index + "个任务:", "失败结果为：", err);
    });
}

let arr = Array.from(new Array(8), (_, v) => v + 1);
queueInstance.limit(arr, (data) => {
  console.log("limt--------", data);
  return data;
});

function isPromse(data) {
  return data && typeof data.then == "function";
}

async function A() {
  return 1212;
}

function C() {
  return 789;
}
async function B(Fn) {
  let result = Fn();
  if (isPromse(result)) {
    result = await result;
  }
  console.log("result", result);
}

// B(A);
// B(C);
