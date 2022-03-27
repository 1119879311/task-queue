const TaskQueue = require("../dist/index").default;
let queueInstance = new TaskQueue({ maxTask: 5 });

// 监听任务执行前，要返回原来的参数(可修改执行参数)，返回null 终止任务执行
queueInstance.hooks.taskBefore(function (res) {
  console.log("taskBefore", res);
  return res;
});

// 监听任务执行完毕后，要返回执行后的结果(可修改后的结果)
queueInstance.hooks.taskAfter(function (res) {
  console.log("taskAfter", res);
  return res * 10;
});

// 监听任务成功回调
queueInstance.hooks.taskSuccess(function (res) {
  console.log("taskSuccess", res);
});

// 监听第一个任务执行完毕
queueInstance.hooks.firstTaskAfter(function (res) {
  console.log(" 第一个任务执行完毕:firstTaskAfter", res);
});

// 监听最后一个任务执行完毕
queueInstance.hooks.lastTaskAfter(function (res) {
  console.log("最后一个任务执行完毕：lastTaskAfter", res);
});

function createRond(max, min) {
  return Math.floor(min + Math.random() * (max - min));
}

function asyncAdd(options) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // resolve(a + b[0] + b[1]);
      resolve(options.a + options.b);
    }, createRond(10000, 5000));
  });
}

let ajax = (...args) => {
  return queueInstance.addTask(asyncAdd, ...args);
};

for (let index = 0; index < 20; index++) {
  // ajax(index, [10, 11])
  ajax({ a: index, b: 10 })
    .then((res) => {
      console.log("执行 完第" + index + "个任务:", "结果为：", res);
    })
    .catch((err) => {
      console.log("err", err);
    });
  //   ajax("http://192.168.0.102:8081/api/code?id=" + index, {})
  //     .then((res) => {
  //       console.log("res", res.data, index);
  //     })
  //     .catch((err) => {
  //       console.log("err", err);
  //     });
}

console.log("队列总数：", queueInstance.count, queueInstance.queue.length);
