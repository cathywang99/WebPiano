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
      <p class="description">根据身手谱提示按照进度条弹奏</p>
      <img
        :src="require('../assets/question/' + stepIndex + '.png')"
        width="400px"
        height="250px"
        class="stepImg"
        style="
          margin-top: 100px;
          font-size: 40px;
          font-weight: bold;
          color: crimson;
          white-space: pre-line;
        "
      />
      <div id="line"></div>
      <div>
        <el-button type="primary" @click="startStep">开 始</el-button>
        <el-button type="primary" @click="nextStep">下 一步</el-button>
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
      :name="name + '_' + sex + '_' + age + '_' + '脑机能测试' + '_' + nowtime"
    >
      <button>下载</button>
    </download-excel>
  </div>
</template>
    
    <script>
import { stepList } from "../stepList/StepSixth";
export default {
  data() {
    return {
      dialogFormVisible: false,
      port: null,
      keepReading: false,
      reader: null,
      dataArray: [],
      tempArray: [],
      curData: "",
      curResult: "",
      curExcelData: {},
      result: "",
      res: "",
      keyIndex: "",
      index: -1,
      dataIndex: 0,
      stepIndex: 1,
      name: "",
      sex: "",
      age: "",
      fields: {
        轮次: "stepIndex",
        键号: "difference",
        时间: "time",
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
    await this.connect();
  },
  destroyed() {},
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
            while (curStepData.length > this.dataIndex) {
              const keyArr = curStepData.map((item) => {
                return Number(item.trim().split(",")[0]);
              });
              const timeArr = curStepData.map((item) => {
                return Number(
                  Number(item.trim().split(",")[2]) +
                    Number(item.trim().split(",")[1]) * 6
                );
              });
              const strengthArr = curStepData.map((item) => {
                return Number(item.trim().split(",")[1]);
              });
              this.curExcelData = {
                stepIndex: this.stepIndex,
                difference: keyArr[keyArr.length - 1],
                time: timeArr[timeArr.length - 1],
                strength: strengthArr[strengthArr.length - 1],
              };
              if (this.start) this.tempArray.push(this.curExcelData);
              this.dataIndex++;
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
    startStep() {
      this.start = true;
      var line = document.getElementById("line");
      line.animate([{ left: "500px" }, { left: "1000px" }], 5000);
    },
    nextStep() {
      this.start = false;
      this.dataArray = this.dataArray.concat(this.tempArray);
      this.tempArray = [];
      if (this.stepIndex == this.stepList.length) {
        this.dialogFormVisible = true;
      } else {
        this.stepIndex++;
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
#line {
  width: 1px;
  background: red;
  border-radius: 10px;
  display: inline-block;
  position: absolute;
  height: 250px;
  left: 500px;
  top: 200px;
  /* animation-name: myanima;
    animation-iteration-count:1;
     animation-fill-mode: backwards; 
    animation-play-state: paused;
    animation-duration: 4s;
    animation-timing-function:linear; */
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