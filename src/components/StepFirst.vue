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
        :src="require('../assets/StepFirst/' + stepIndex + '.jpg')"
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
      <span style="white-space: pre-line">{{ curResult }}</span>
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
      id="download_excel1"
      style="z-index: -2; position: absolute"
      :data="dataArray1"
      :fields="fields"
      :name="name + '_' + sex + '_' + age + '_' + '灵敏度' + '_' + nowtime"
    >
      <button>下载</button>
    </download-excel>

    <download-excel
      id="download_excel2"
      style="z-index: -3; position: absolute"
      :data="dataArray2"
      :fields="fields"
      :name="name + '_' + sex + '_' + age + '_' + '音长' + '_' + nowtime"
    >
      <button>下载</button>
    </download-excel>

    <keyboard />
  </div>
</template>

<script>
import keyboard from "./keyboard.vue";
import { setPiano } from "../util/size";
import {
  stepList,
  stepName,
  stepInfo,
  stepInfoAverage,
  stepInfoMin,
  stepInfoDuration,
} from "../stepList/StepFirst";
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
      dataArray1: [],
      dataArray2: [],
      curData: "",
      curResult: "",
      curExcel1Data: {},
      curExcel2Data: {},
      result: "",
      stepIndex: 1,
      name: "",
      sex: "",
      age: "",
      fields: {
        步骤: "stepName",
        灵敏度: "difference",
      },
      excel2StepName: [
        "Sensitive(1)",
        "Sensitive(2)",
        "Sensitive(3)",
        "Sensitive(4)",
        "Sensitive(5)",
        "Sensitive(-1)",
        "Sensitive(-2)",
        "Sensitive(-3)",
        "Sensitive(-4)",
        "Sensitive(-5)",
      ],
      stepList,
      stepName,
      stepInfo,
      stepInfoAverage,
      stepInfoMin,
      stepInfoDuration,
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
      console.log(curStepData);
      if (curStepData.length < 10) {
        this.curData = "";
        return this.$message.warning("按键次数不足～");
      }
      // 按键键号
      let keyData = curStepData.map((item) => {
        return Number(item.trim().split(",")[0]);
      });
      // 按键时间
      let timeData = curStepData.map((item) => {
        return Number(
          Number(item.trim().split(",")[2]) +
            Number(item.trim().split(",")[1]) * 6
        );
      });
      // 音长
      let durationData = curStepData.map((item) => {
        return Number(item.trim().split(",")[3]);
      });
      var count = 1;
      var keyIndex = keyData[0];
      //找到众数
      for (var i = 1; i < keyData.length; i++) {
        if (keyData[i] == keyIndex) count++;
        else count--;
        if (count == 0) {
          keyIndex = keyData[i];
          count++;
        }
      }
      count = 0;
      for (var i = 0; i < keyData.length; i++) {
        if (keyData[i] == keyIndex) count++;
        if (count == 10) break;
      }
      if (count < 10) {
        this.curData = "";
        return this.$message.warning("有效按键次数不足～");
      }
      var tempArr = [];
      var durationArr = [];
      for (var i = 0; i < timeData.length; i++) {
        if (keyData[i] == keyIndex) {
          tempArr.push(timeData[i]);
          durationArr.push(durationData[i]);
        }
      }
      var res = tempArr[9] - tempArr[0];
      var durationIndex = 0;
      if (res < 0) res += 4294967295;
      for (var i = 1; i < tempArr.length - 9; i++) {
        var temp = tempArr[i + 9] - tempArr[i];
        if (temp < 0) temp += 4294967295;
        if (temp < res) {
          durationIndex = i;
        }
        res = Math.min(res, temp);
      }
      durationArr = durationArr.slice(durationIndex, durationIndex + 10);
      durationArr = durationArr.filter((item) => item > 100);
      console.log(durationArr);
      var totalDuration = 0;
      for (let i = 0; i < durationArr.length; i++) {
        totalDuration += durationArr[i];
      }
      var aveDuration = (
        (totalDuration / durationArr.length) *
        31.25 *
        Math.pow(10, -6)
      ).toFixed(6);
      console.log(aveDuration);
      this.curExcel1Data = {
        stepName: this.stepName[this.stepIndex - 1],
        difference: res,
      };
      this.curExcel2Data = {
        stepName: this.excel2StepName[this.stepIndex - 1],
        difference: aveDuration,
      };
      var localStorageItem = "flex" + this.stepIndex;
      if (null == window.localStorage.getItem(localStorageItem + "_num")) {
        window.localStorage.setItem(localStorageItem + "_num", 1);
        window.localStorage.setItem(localStorageItem + "_average", res);
        window.localStorage.setItem(localStorageItem + "_min", res);
        // window.localStorage.setItem(localStorageItem+"_data",JSON.stringify([res]));
      } else {
        window.localStorage.setItem(
          localStorageItem + "_min",
          Math.min(
            Number(window.localStorage.getItem(localStorageItem + "_min")),
            res
          )
        );
        var num = Number(
          window.localStorage.getItem(localStorageItem + "_num")
        );
        var average = Number(
          window.localStorage.getItem(localStorageItem + "_average")
        );
        window.localStorage.setItem(
          localStorageItem + "_average",
          Math.round((average / (num + 1)) * num + res / (num + 1))
        );
        window.localStorage.setItem(localStorageItem + "_num", num + 1);
        // var data= JSON.parse(window.localStorage.getItem(localStorageItem+"_data"));
        // data.push(res);
        // data.sort();
        // var index=binarySearch(data,res);
        // window.localStorage.setItem(localStorageItem+"_data",JSON.stringify(data));
        // console.log(Math.round((index+1)/(num+1)*100));
      }
      this.curResult =
        this.stepInfo[this.stepIndex - 1] +
        res +
        "\n" +
        this.stepInfoAverage[this.stepIndex - 1] +
        window.localStorage.getItem(localStorageItem + "_average") +
        "\n" +
        this.stepInfoMin[this.stepIndex - 1] +
        window.localStorage.getItem(localStorageItem + "_min") +
        "\n" +
        this.stepInfoDuration[this.stepIndex - 1] +
        aveDuration;
      const textarea = document.getElementById("textRight");
      textarea.scrollTop = textarea.scrollHeight;
      this.dialogResVisible = true;
    },
    binarySearch(arr, target) {
      if (arr.length <= 1) return 0;
      // 低位下标
      let lowIndex = 0;
      // 高位下标
      let highIndex = arr.length - 1;

      while (lowIndex <= highIndex) {
        // 中间下标
        const midIndex = Math.floor((lowIndex + highIndex) / 2);
        if (target < arr[midIndex]) {
          highIndex = midIndex - 1;
        } else if (target > arr[midIndex]) {
          lowIndex = midIndex + 1;
        } else {
          // target === arr[midIndex]
          return midIndex;
        }
      }
      return 0;
    },
    next() {
      this.dataArray1.push(this.curExcel1Data);
      this.dataArray2.push(this.curExcel2Data);
      this.result += this.curResult + "\n";
      this.curData = "";
      this.curExcel1Data = {};
      this.curExcel2Data = {};
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
      this.curExcel1Data = {};
      this.curExcel2Data = {};
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
        document.querySelector("#download_excel1").click();
        document.querySelector("#download_excel2").click();
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