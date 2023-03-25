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
      <p class="title">第{{ stepIndex }}轮</p>
      <p class="description">{{ stepList[stepIndex - 1] }}</p>
      <img
        :src="require('../assets/StepSecond/' + stepIndex + '.jpg')"
        width="200px"
        height="150px"
      />
    </div>
    <div class="btns">
      <el-button type="primary" plain @click="retest">重新测试</el-button>
      <el-button type="success" plain @click="forward">下一步</el-button>
    </div>
    <div class="showArea">
      <el-input
        class="showLeft"
        id="textLeft"
        type="textarea"
        :rows="10"
        v-model="dataShowLeft"
        disabled
      >
      </el-input>
      <el-input
        class="showRight"
        id="textRight"
        type="textarea"
        :rows="10"
        v-model="dataShowRight"
        disabled
      >
      </el-input>
    </div>
    <el-dialog
      id="result_dialog"
      title="本轮测试结果"
      :visible.sync="dialogResVisible"
      :show-close="false"
      :close-on-click-modal="false"
      width="30%"
    >
      <span>{{ curResult }}</span>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" plain @click="retest">重新测试</el-button>
        <el-button
          type="success"
          plain
          @click="next"
          v-if="stepIndex == stepList.length"
          >完成</el-button
        >
        <el-button type="success" plain @click="next" v-else>下一步</el-button>
      </span>
    </el-dialog>
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
      :name="name + '_' + sex + '_' + age + '_' + '力度' + '_' + nowtime"
    >
      <button>下载</button>
    </download-excel>
    <keyboard />
  </div>
</template>

<script>
import keyboard from "./keyboard.vue";
import { setPiano } from "../util/size";
import { stepList, stepName, stepInfo } from "../stepList/StepSecond";
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
      stepIndex: 1,
      name: "",
      sex: "",
      age: "",
      fields: {
        步骤: "stepName",
        力度: "difference",
      },
      stepList,
      stepName,
      stepInfo,
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
    dataShowLeft() {
      return "本轮数据\n" + this.curData;
    },
    dataShowRight() {
      return "测试结果\n" + this.result;
    },
  },
  async mounted() {
    setPiano(this);
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
            const textarea = document.getElementById("textLeft");
            textarea.scrollTop = textarea.scrollHeight;
          }
        } catch (error) {
          this.$message.error("串口断开连接！");
        } finally {
          this.reader.releaseLock();
        }
      }
      await this.port.close();
      this.$message.success("串口成功关闭！");
    },
    forward() {
      if (!this.curData) {
        return this.$message.warning("请按指引完成操作后再进入下一步～");
      }
      let curStepData = this.curData.split("\r\n");
      curStepData.pop();
      curStepData = curStepData.map((item) => {
        return Number(item.trim().split(",")[1]);
      });
      let res = Math.min(...curStepData);
      this.curExcelData = {
        stepName: this.stepName[this.stepIndex - 1],
        difference: res,
      };
      this.curResult = this.stepInfo[this.stepIndex - 1] + parseInt(res);
      const textarea = document.getElementById("textRight");
      textarea.scrollTop = textarea.scrollHeight;
      this.dialogResVisible = true;
    },
    next() {
      this.dataArray.push(this.curExcelData);
      this.result += this.curResult + "\n";
      this.curData = "";
      this.curExcelData = {};
      this.curResult = "";
      this.dialogResVisible = false;
      if (this.stepIndex == this.stepList.length) {
        this.dialogFormVisible = true;
      } else {
        this.stepIndex++;
      }
    },
    retest() {
      this.curData = "";
      this.curExcelData = {};
      this.curResult = "";
      this.dialogResVisible = false;
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