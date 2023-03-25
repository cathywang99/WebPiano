<template>
  <div class="StepFirst" ref="piano">
    <audio ref="audio">
      <source :src="musicUrl" />
    </audio>
    <audio ref="virtual">
      <source :src="virtualUrl" />
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
      <p class="title">第{{ stepList[stepIndex - 1] }}题</p>
      <p class="title">弹奏所听到的音阶</p>
      <div>
        <img @click="startStep" src="../assets/StepNine/trumpet.png" />
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
      :name="name + '_' + sex + '_' + age + '_' + '听辨音阶' + '_' + nowtime"
    >
      <button>下载</button>
    </download-excel>
    <keyboard v-on:down="getMyKey" />
  </div>
</template>

<script>
import keyboard from "./keyboard.vue";
import { stepList } from "../stepList/StepNine";
import { setPiano } from "../util/size";
export default {
  components: {
    keyboard,
  },
  data() {
    return {
      musicUrl: "",
      virtualUrl: "",
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
      tone: 0,
      name: "",
      sex: "",
      age: "",
      fields: {
        轮次: "step",
        任务: "tone",
        键号: "key",
        得分: "score",
        // 时刻: "time",
        // 持续时间: "duration",
        // 力度: "strength",
      },
      keyMap: {
        1: 37,
        2: 39,
        3: 41,
        4: 42,
        5: 44,
        6: 46,
        7: 48,
      },
      VirtualkeyMap: {
        1: 40,
        2: 42,
        3: 44,
        4: 45,
        5: 47,
        6: 49,
        7: 51,
      },
      avgForce: "",
      maxForce: "",
      stepList,
      start: false,
      score: 0,
      myKey: 0,
      flag: true,
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
    await this.connect();
  },
  methods: {
    //处理键盘得到的键号逻辑
    getMyKey(e) {
      this.myKey = e;
      console.log(this.myKey);
      //虚拟键盘
      const audio2 = this.$refs.virtual;
      this.virtualUrl = require(`../assets/audio/${this.myKey}.wav`);
      audio2.load();
      audio2.play();
      if (this.tone != 0) {
        //比较逻辑
        if (this.VirtualkeyMap[this.tone] == this.myKey) {
          this.score += 5;
          this.$message.success("恭喜您答对了");
        } else {
          this.$message.error("回答错误，请继续努力");
        }
        this.VirtualNext();
        // this.tone = 0;
      }
    },
    //以下三个函数与网页版无关
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
            if (this.flag) {
              const audio = this.$refs.audio;
              this.musicUrl = require(`../assets/audio/${nowKey + 3}.wav`);
              audio.load();
              audio.play();
            }

            if (this.tone != 0) {
              //比较逻辑
              if (this.keyMap[this.tone] == nowKey) {
                this.score += 5;
                this.$message.success("恭喜您答对了");
              } else {
                this.$message.error("回答错误，请继续努力");
              }
              this.nextStep();
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

    randomNumber(min, max) {
      const randomBuffer = new Uint32Array(1);
      window.crypto.getRandomValues(randomBuffer);
      const number = randomBuffer[0] / (0xffffffff + 1);
      return Math.floor(number * (max - min) + min);
    },

    startStep() {
      this.flag = false;
      const audio = this.$refs.audio;
      if (this.tone == 0) {
        // this.tone = this.randomNumber(1, 7);
        this.tone = Math.floor(Math.random() * 7) + 1;
      }
      console.log("当前音阶是：" + this.tone);
      this.musicUrl = require(`../assets/audio/test/${this.tone}.wav`);
      audio.load();
      audio.play();
    },
    nextStep() {
      let tmp = this.curData.split("\r\n");
      tmp.pop();
      let curStepData = tmp[tmp.length - 1];
      const key = Number(curStepData.trim().split(",")[0]);
      // const timeArr = curStepData
      //   .map((item) => {
      //     return Number(
      //       Number(item.trim().split(",")[2]) +
      //         Number(item.trim().split(",")[1]) * 6
      //     );
      //   })
      //   .join("_");
      // console.log(timeArr);

      // const lastArr = curStepData
      //   .map((item) => {
      //     return Number(item.trim().split(",")[3]);
      //   })
      //   .join("_");

      // const strengthArr = curStepData
      //   .map((item) => {
      //     return Number(item.trim().split(",")[1]);
      //   })
      //   .join("_");

      this.dataArray.push({
        step: this.stepIndex,
        tone: this.keyMap[this.tone],
        key: key,
        score: this.score,
        // time: timeArr,
        // duration: lastArr,
        // strength: strengthArr,
      });
      this.tone = 0;
      this.curData = "";
      if (this.stepIndex < this.stepList.length) {
        this.stepIndex++;
      } else {
        alert("您的得分是" + this.score);
        this.dialogFormVisible = true;
      }
    },

    VirtualNext() {
      this.dataArray.push({
        step: this.stepIndex,
        tone: this.VirtualkeyMap[this.tone],
        key: this.myKey,
        score: this.score,
        // time: timeArr,
        // duration: lastArr,
        // strength: strengthArr,
      });
      this.tone = 0;
      this.curData = "";
      if (this.stepIndex < this.stepList.length) {
        this.stepIndex++;
      } else {
        alert("您的得分是" + this.score);
        this.dialogFormVisible = true;
      }
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
  margin-top: 200px;
}
.title {
  font-size: 25px;
  font-weight: bold;
  margin: 20px 40px;
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