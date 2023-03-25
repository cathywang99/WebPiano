<template>
  <div class="StepFirst" ref="piano">
    <video
      id="video"
      style="display: none; position: fixed; top: 0; left: 0"
      autoplay="autoplay"
    ></video>
    <div style="position: absolute; top: 10px; left: 10px">
      <el-button
        type="primary"
        @click="
          reader.cancel();
          keepReading = false;
          $router.replace('/piano');
        "
        >返回首页</el-button
      >
    </div>
    <div class="guide">
      <p class="title">请用任意手指按压琴键，以展示力度信息</p>
      <a id="down" style="opacity: 0"></a>
      <p
        style="
          margin-top: 250px;
          font-size: 40px;
          font-weight: bold;
          color: crimson;
          white-space: pre-line;
        "
      >
        {{ curResult }}
      </p>
    </div>

    <keyboard />
  </div>
</template>

<script>
import keyboard from "./keyboard.vue";
import { setPiano } from "../util/size";
export default {
  components: {
    keyboard,
  },
  data() {
    return {
      dialogResVisible: false,
      dialogFormVisible: false,
      port: null,
      keepReading: false,
      reader: null,
      dataArray: [],
      curData: "",
      curResult: "",
      curExcelData: {},
      result: "",
      res: "",
      keyIndex: "",
      resArr: ["ppp", "pp", "p", "mp", "mf", "f", "ff", "fff"],
      index: -1,
      stepIndex: 1,
      name: "",
      sex: "",
      age: "",
      fields: {
        力度: "strength",
      },
      avgForce: "",
      maxForce: "",
    };
  },
  computed: {
    nowtime() {
      const date = new Date();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      let time = date.toLocaleTimeString();
      time = time.split(":");
      const nowtime =
        month + "月" + day + "日" + time[0] + "时" + time[1] + "分";
      return nowtime;
    },
  },
  async mounted() {
    setPiano(this);
    this.getMedia();
    await this.connect();
  },
  methods: {
    async connect() {
      if ("serial" in navigator) {
        try {
          // const filters = [{ usbVendorId: 6790, usbProductId: 29987 }];
          // this.port = await navigator.serial.requestPort({ filters });
          const ports = await navigator.serial.getPorts();
          for (let port of ports) {
            if (port.getInfo().usbVendorId == 6790) {
              this.port = port;
            }
          }
          if (!this.port) {
            return this.$message.error("串口打开失败！", e.toString());
          }
          await this.port.open({
            baudRate: 115200,
          });
          this.$message.success("串口打开成功！");
          this.keepReading = true;
          await this.readUntilClosed();
        } catch (e) {
          this.$message.error("串口打开失败！", e.toString());
        }
      } else {
        this.$message.error(
          "当前为HTTP模式或者浏览器版本过低，不支持网页连接串口"
        );
      }
    },
    Uint8ArrayToString(fileData) {
      let dataString = "";
      for (let i = 0; i < fileData.length; i++) {
        dataString += String.fromCharCode(fileData[i]);
      }
      return dataString;
    },
    async readUntilClosed() {
      while (this.port.readable && this.keepReading) {
        this.reader = this.port.readable.getReader();
        try {
          while (true) {
            const { value, done } = await this.reader.read();
            if (done) {
              break;
            }
            const data = this.Uint8ArrayToString(value);
            this.curData += data;
            let curStepData = this.curData.split("\r\n");
            curStepData.pop();
            const keyArr = curStepData.map((item) => {
              return Number(item.trim().split(",")[0]);
            });
            const StrengthArr = curStepData.map((item) => {
              return Number(item.trim().split(",")[1]);
            });
            this.keyIndex = keyArr[keyArr.length - 1];
            this.res = StrengthArr[StrengthArr.length - 1];
            var localStorageItem = "strength" + this.keyIndex;
            if (
              null == window.localStorage.getItem(localStorageItem + "_num")
            ) {
              window.localStorage.setItem(localStorageItem + "_num", 1);
              window.localStorage.setItem(
                localStorageItem + "_average",
                this.res
              );
              window.localStorage.setItem(
                localStorageItem + "_maxForce",
                this.res
              );
            }
            var maxStrength = Number(
              window.localStorage.getItem(localStorageItem + "_maxForce")
            );
            var averageStrength = Number(
              window.localStorage.getItem(localStorageItem + "_average")
            );
            var num = Number(
              window.localStorage.getItem(localStorageItem + "_num")
            );
            if (this.res < maxStrength) {
              window.localStorage.setItem(
                localStorageItem + "_maxForce",
                this.res
              );
              maxStrength = this.res;
              this.curResult =
                "键号：" +
                this.keyIndex +
                "\n恭喜您打破目前最高记录" +
                ",\n您的力度为: " +
                this.res +
                "\n平均力度为:" +
                averageStrength +
                "\n最高记录为: " +
                maxStrength;
            } else {
              this.curResult =
                "键号：" +
                this.keyIndex +
                ",\n您的力度为: " +
                this.res +
                "\n平均力度为:" +
                averageStrength +
                "\n最高记录为: " +
                maxStrength;
            }
            window.localStorage.setItem(
              localStorageItem + "_average",
              Math.round(
                (averageStrength / (num + 1)) * num + this.res / (num + 1)
              )
            );
            window.localStorage.setItem(localStorageItem + "_num", num + 1);
            this.avgForce = averageStrength;
            this.maxForce = maxStrength;
            if (this.res > 738) {
              this.index = 0;
            } else if (this.res > 157) {
              this.index = 1;
            } else if (this.res > 112) {
              this.index = 2;
            } else if (this.res > 92) {
              this.index = 3;
            } else if (this.res > 80) {
              this.index = 4;
            } else if (this.res > 71) {
              this.index = 5;
            } else if (this.res > 65) {
              this.index = 6;
            } else {
              this.index = 7;
            }
          }
        } catch (error) {
          console.log(error.toString());
          this.$message.error("串口断开连接！");
        } finally {
          this.reader.releaseLock();
        }
      }
      await this.port.close();
      this.$message.success("串口成功关闭！");
    },
    getMedia() {
      let constraints = {
        audio: true,
        video: { width: 960, height: 680 },
      };
      let video = document.getElementById("video");
      /*
        这里介绍新的方法:H5新媒体接口 navigator.mediaDevices.getUserMedia()
        这个方法会提示用户是否允许媒体输入,(媒体输入主要包括相机,视频采集设备,屏幕共享服务,麦克风,A/D转换器等)
        返回的是一个Promise对象。
        如果用户同意使用权限,则会将 MediaStream对象作为resolve()的参数传给then()
        如果用户拒绝使用权限,或者请求的媒体资源不可用,则会将 PermissionDeniedError作为reject()的参数传给catch()
        */
      let promise = navigator.mediaDevices.getUserMedia(constraints);
      promise
        .then(function (MediaStream) {
          video.srcObject = MediaStream;
          video.play();
        })
        .catch(function (PermissionDeniedError) {
          console.log(PermissionDeniedError);
        });
    },
    takePhoto() {
      //获得Canvas对象
      let canvas = document.createElement("canvas");
      // canvas.width = 400;
      // canvas.height = 400;
      let ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, 500, 500);
      let image = canvas.toDataURL("image/png");
      var img = new Image();
      //设置属性和src
      img.id = "newImg";
      img.src = image;
      console.log(img);
      img.onload = function () {
        let a = document.getElementById("down");
        a.appendChild(img);
        a.href = image;
        a.download = new Date().getTime() + "test"; // 下载的图片的名称
        a.click();
      };
    },
  },
};
</script>

<style>
* {
  padding: 0;
  margin: 0;
}
.StepFirst {
  position: absolute;
  overflow: hidden;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("../assets/pianobg.jpg");
}
.guide {
  margin: 20px auto;
  text-align: center;
}
.title {
  font-size: 25px;
  font-weight: bold;
  font-family: "Helvetica Neue";
  color: #303133;
}
.description {
  margin: 10px auto;
  font-size: 16px;
  font-family: "Helvetica Neue";
  color: #606266;
}
.showArea {
  position: relative;
  width: 100%;
}
.btns {
  margin: 0 auto 30px auto;
  text-align: center;
}
.showLeft {
  position: absolute;
  left: 20%;
  top: 0;
  width: 30%;
}
.showRight {
  position: absolute;
  right: 20%;
  top: 0;
  width: 30%;
}
</style>