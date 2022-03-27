```javascript
const TaskQueue = require("task-queue").default;
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


functiono ajax(...args){
     //  return queueInstance.addTask(fetch, ...args);
   return queueInstance.addTask(axios, ...args);
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
