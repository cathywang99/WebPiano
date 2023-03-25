<template>
  <div class="StepFirst" ref="piano">
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
      <p class="description">根据声手谱提示按照指定指法正确弹奏</p>
      <div class="show">
        <img :src="imgSrc" width="100%" height="100%" />
        <div id="line"></div>
      </div>
      <div>
        <el-button type="primary" @click="startStep">开始</el-button>
        <el-button type="success" @click="restart">重新测试</el-button>
      </div>
    </div>
    <el-dialog
      id="information_dialog"
      title="请输入姓名"
      :visible.sync="dialogFormVisible"
      :show-close="false"
      :close-on-click-modal="false"
      width="30%"
    >
      <el-input v-model="userName" placeholder="请输入姓名"></el-input>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="validUserName">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      id="compare_dialog"
      title="请比较两种指法的舒适度"
      :visible.sync="dialogCompareVisible"
      :show-close="false"
      :close-on-click-modal="false"
      width="30%"
    >
      <el-select
        v-model="comfort"
        placeholder="请比较两种指法的舒适度"
        style="margintop: 15px"
      >
        <el-option key="指法一更顺手" label="指法一更顺手" value="1">
        </el-option>
        <el-option key="指法二更顺手" label="指法二更顺手" value="2">
        </el-option>
        <el-option key="两种指法差不多" label="两种指法差不多" value="3">
        </el-option>
      </el-select>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="compareFinish">确 定</el-button>
      </div>
    </el-dialog>

    <download-excel
      id="download_excel"
      style="z-index: -2; position: absolute"
      :data="dataArray"
      :fields="fields"
      :name="userName + '_' + '个性化指法弹奏' + '_' + nowtime"
    >
      <button>下载</button>
    </download-excel>
  </div>
</template>
    
    <script>
import { stepList, fingerList, lineStyle } from "../stepList/StepSeven";
export default {
  data() {
    return {
      userName: "",
      dialogFormVisible: false,
      dialogCompareVisible: false,
      port: null,
      keepReading: false,
      reader: null,
      dataArray: [],
      curData: "",
      stepIndex: 1,
      fields: {
        指法一耗时: "time1",
        指法二耗时: "time2",
        评价: "judgement",
      },
      stepList,
      fingerList,
      lineStyle,
      start: false,
      personal_finger1: [],
      personal_finger2: [],
      personal_finger3: [],
      standard_finger1: [2, 3, 4, 5, 2, 3, 1, 2],
      standard_finger2: [3, 4, 1, 2, 3, 4, 2, 3, 1, 5],
      standard_finger3: [4, 3, 5, 4, 3, 2, 4, 1, 4, 3, 5, 4],
      key_list1: [69, 71, 73, 74, 66, 68, 69, 71],
      key_list2: [72, 74, 64, 66, 68, 69, 66, 68, 64, 76],
      key_list3: [74, 72, 76, 74, 72, 71, 74, 72, 81, 80, 83, 81],
      dataIndex: 0,
      keyIndex: 0,
      startTime: "",
      allowNext: false,
      preTime: 0,
      nextTime: 0,
      comfort: "1",
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
    imgSrc() {
      if (this.stepIndex == 1) {
        return require("../assets/finger/standard1.png");
      } else if (this.stepIndex == 2) {
        return require(`../assets/finger/${this.userName}1.png`);
      } else if (this.stepIndex == 3) {
        return require("../assets/finger/standard2.png");
      } else if (this.stepIndex == 4) {
        return require(`../assets/finger/${this.userName}2.png`);
      } else if (this.stepIndex == 5) {
        return require("../assets/finger/standard3.png");
      } else {
        return require(`../assets/finger/${this.userName}3.png`);
      }
    },
  },
  async mounted() {
    this.dialogFormVisible = true;
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
            let keyList = [];
            if (this.stepIndex == 1 || this.stepIndex == 2) {
              keyList = this.key_list1.map((item) => item - 23);
            } else if (this.stepIndex == 3 || this.stepIndex == 4) {
              keyList = this.key_list2.map((item) => item - 23);
            } else {
              keyList = this.key_list3.map((item) => item - 23);
            }
            const data = this.Uint8ArrayToString(value);
            this.curData += data;
            let curStepData = this.curData.split("\r\n");
            curStepData.pop();

            while (curStepData.length > this.dataIndex) {
              const keyArr = curStepData.map((item) => {
                return Number(item.trim().split(",")[0]);
              });
              this.dataIndex++;
              const nowKey = keyArr[keyArr.length - 1];
              const standardKey = keyList[this.keyIndex];

              if (this.start) {
                console.log(nowKey);
                if (nowKey == standardKey) {
                  console.log("准确弹奏");
                  if (this.keyIndex == 0) {
                    this.startTime = new Date().getTime();
                  }
                  this.keyIndex++;
                  document.getElementById("line").style.left =
                    lineStyle[this.stepIndex - 1].split("-")[this.keyIndex] +
                    "px";
                  if (this.keyIndex == keyList.length) {
                    this.nextStep();
                  }
                } else {
                  console.log("错误弹奏");
                  this.$message.error("错误弹奏，请重新开始！");
                  document.getElementById("line").style.left = 0;
                  this.keyIndex = 0;
                  this.start = false;
                  this.startTime = "";
                }
              }
            }
          }
        } catch (error) {
          console.log(error);
          this.$message.error("串口断开连接！");
        } finally {
          this.reader.releaseLock();
        }
      }
      await this.port.close();
      this.$message.success("串口成功关闭！");
    },
    validUserName() {
      const nameList = [
        "陈柏伶",
        "陈楚钧",
        "黄毓敏",
        "梁海峰",
        "梁烨新",
        "林晓聪",
        "龙亭冰",
        "王楚瑜",
        "谢本明",
        "郑梓锴",
        "曹恩丰",
        "陈浩文",
        "方卓",
        "丰永淳",
        "何铮",
        "况倩莹",
        "林柏涛",
        "农彩艳",
        "平璐瑶",
        "苏昱潮",
        "谭杰康",
      ];
      if (!this.userName) {
        this.$message.error("姓名为空！");
        return;
      }
      if (!nameList.includes(this.userName)) {
        this.$message.error("没有匹配的指法！");
        return;
      }
      const personal_finger = fingerList[this.userName].split("_");
      this.personal_finger1 = personal_finger.slice(0, 8);
      this.personal_finger2 = personal_finger.slice(8, 18);
      this.personal_finger3 = personal_finger.slice(18);
      this.dialogFormVisible = false;
    },
    startStep() {
      this.start = true;
      this.$message.success("请开始弹奏~");
    },
    restart() {
      this.keyIndex = 0;
      this.start = false;
      document.getElementById("line").style.left = 0;
    },
    nextStep() {
      if (this.stepIndex == 1 || this.stepIndex == 3 || this.stepIndex == 5) {
        this.$message.success("本轮弹奏完成，已进入下一步~");
        const playTime = new Date().getTime() - this.startTime;
        this.preTime = playTime;
        console.log(this.preTime);
        this.startTime = "";
        this.start = false;
        document.getElementById("line").style.left = 0;
        this.keyIndex = 0;
        this.stepIndex++;
      } else {
        this.$message.success("本轮弹奏完成，已进入下一步~");
        const playTime = new Date().getTime() - this.startTime;
        this.nextTime = playTime;
        console.log(this.nextTime);
        this.startTime = "";
        this.start = false;
        document.getElementById("line").style.left = 0;
        this.keyIndex = 0;
        this.dialogCompareVisible = true;
      }
    },
    compareFinish() {
      this.dataArray.push({
        time1: this.preTime,
        time2: this.nextTime,
        judgement: this.comfort,
      });
      this.preTime = "";
      this.nextTime = "";
      this.dialogCompareVisible = false;
      if (this.stepIndex == 6) {
        try {
          document.querySelector("#download_excel").click();
          this.reader.cancel();
          this.keepReading = false;
          this.$router.replace("/piano");
        } catch (e) {
          this.$message.error("数据导出失败！", e.toString());
        }
      } else {
        this.stepIndex++;
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
.show {
  position: relative;
  width: 800px;
  height: 600px;
  margin: 0 auto 30px auto;
}
#line {
  position: absolute;
  width: 3px;
  height: 600px;
  background-color: red;
  left: 0;
  top: 0;
}
@keyframes myanima {
  0% {
    left: 737px;
  }
  to {
    left: 1137px;
  }
}
</style>