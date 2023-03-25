<template>
  <div class="StepFirst" ref="piano">
    <!-- <video
      id="video"
      style="display: none; position: fixed; top: 0; left: 0"
      autoplay="autoplay"
    ></video> -->
    <audio ref="audio">
      <source :src="musicUrl" />
    </audio>
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
      <p class="title">{{ stepList[stepIndex - 1] }}</p>
      <p class="description">根据所听音频进行弹奏</p>
      <div>
        <!-- <el-button type="primary" @click="startStep">播放</el-button> -->
        <el-button type="primary" @click="nextStep">下一步</el-button>
      </div>
    </div>
    <el-dialog
      id="information_dialog"
      title="请输入个人信息"
      :visible.sync="dialogFormVisible"
      :show-close="false"
      :close-on-click-modal="false"
      width="30%"
    >
      <el-input v-model="name" placeholder="请输入姓名"></el-input>
      <el-input
        v-model="age"
        placeholder="请输入年龄"
        style="margintop: 15px"
      ></el-input>
      <el-select v-model="sex" placeholder="请选择性别" style="margintop: 15px">
        <el-option key="男" label="男" value="男"> </el-option>
        <el-option key="女" label="女" value="女"> </el-option>
      </el-select>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="saveData">确 定</el-button>
      </div>
    </el-dialog>
    <download-excel
      id="download_excel"
      style="z-index: -2; position: absolute"
      :data="dataArray"
      :fields="fields"
      :name="name + '_' + sex + '_' + age + '_' + '听奏' + '_' + nowtime"
    >
      <button>下载</button>
    </download-excel>
    <keyboard />
  </div>
</template>

<script>
import keyboard from "./keyboard.vue";
import { stepList } from "../stepList/StepEight";
import { setPiano } from "../util/size";
export default {
  components: {
    keyboard,
  },
  data() {
    return {
      musicUrl: "",
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
        轮次: "step",
        键号: "key",
        时刻: "time",
        持续时间: "duration",
        力度: "strength",
      },
      avgForce: "",
      maxForce: "",
      stepList,
      start: false,
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
            const timeArr = curStepData.map((item) => {
              return Number(
                Number(item.trim().split(",")[2]) +
                  Number(item.trim().split(",")[1]) * 6
              );
            });
            const lastArr = curStepData.map((item) => {
              return Number(item.trim().split(",")[3]);
            });
            const strengthArr = curStepData.map((item) => {
              return Number(item.trim().split(",")[1]);
            });
            const nowKey = keyArr[keyArr.length - 1];
            const nowTime = timeArr[timeArr.length - 1];
            const nowDuration = lastArr[lastArr.length - 1];
            const nowStrength = strengthArr[strengthArr.length - 1];
            console.log(nowKey, nowTime, nowDuration, nowStrength);
            const audio = this.$refs.audio;
            this.musicUrl = require(`../assets/audio/${nowKey + 3}.wav`);
            audio.load();
            audio.play();
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
    nextStep() {
      let curStepData = this.curData.split("\r\n");
      curStepData.pop();
      const keyArr = curStepData
        .map((item) => {
          return Number(item.trim().split(",")[0]);
        })
        .join("_");
      const timeArr = curStepData
        .map((item) => {
          return Number(
            Number(item.trim().split(",")[2]) +
              Number(item.trim().split(",")[1]) * 6
          );
        })
        .join("_");
      console.log(timeArr);

      const lastArr = curStepData
        .map((item) => {
          return Number(item.trim().split(",")[3]);
        })
        .join("_");

      const strengthArr = curStepData
        .map((item) => {
          return Number(item.trim().split(",")[1]);
        })
        .join("_");

      this.dataArray.push({
        step: this.stepIndex,
        key: keyArr,
        time: timeArr,
        duration: lastArr,
        strength: strengthArr,
      });
      this.curData = "";
      if (this.stepIndex < this.stepList.length) {
        this.stepIndex++;
      } else {
        this.dialogFormVisible = true;
      }
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
    async saveData() {
      if (!this.name) {
        this.$message.error("姓名为空！");
        return;
      }
      if (!this.age) {
        this.$message.error("年龄为空！");
        return;
      }
      if (!this.sex) {
        this.$message.error("性别为空！");
        return;
      }
      this.dialogFormVisible = false;
      try {
        document.querySelector("#download_excel").click();
        this.reader.cancel();
        this.keepReading = false;
        this.$router.replace("/piano");
      } catch (e) {
        this.$message.error("数据导出失败！", e.toString());
      }
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