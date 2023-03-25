<template>
  <div ref="piano" class="piano">
    <el-card class="box-card">
      <div slot="header" class="header">
        <span class="captain"
          >测一测你的手指灵敏度<el-button
            type="primary"
            class="btn"
            @click="testFirtPart"
            >进入测试</el-button
          ></span
        >
      </div>
      <div class="body">
        <p>这一部分，我们将测量您的手指灵敏度,请您按照指引完成操作。</p>
      </div>
      <p></p>
    </el-card>

    <el-card class="box-card">
      <div slot="header" class="header">
        <span class="captain"
          >测一测你的手指力度<el-button
            type="primary"
            class="btn"
            @click="testSecondPart"
            >进入测试</el-button
          ></span
        >
      </div>
      <div class="body">
        <p>这一部分，我们将测量您的手指力度,请您按照指引完成操作。</p>
      </div>
      <p></p>
    </el-card>

    <el-card class="box-card">
      <div slot="header" class="header">
        <span class="captain"
          >测一测你的手型<el-button
            type="primary"
            class="btn"
            @click="testThirdPart"
            >进入测试</el-button
          ></span
        >
      </div>
      <div class="body">
        <p>这一部分，我们将测量您的手型,请您按照指引完成操作。</p>
      </div>
      <p></p>
    </el-card>

    <el-card class="box-card">
      <div slot="header" class="header">
        <span class="captain"
          >手指最大力度测试<el-button
            type="primary"
            class="btn"
            @click="testForthPart"
            >进入测试</el-button
          ></span
        >
      </div>
      <div class="body">
        <p>这一部分，我们将测量音强,请您按照指引完成操作。</p>
      </div>
      <p></p>
    </el-card>

    <el-card class="box-card">
      <div slot="header" class="header">
        <span class="captain"
          >钢琴视奏认知检测<el-button
            type="primary"
            class="btn"
            @click="testFifthPart"
            >进入测试</el-button
          ></span
        >
      </div>
      <div class="body">
        <p>这一部分，我们将测量您的认知能力,请您按照指引完成操作。</p>
      </div>
      <p></p>
    </el-card>

    <el-card class="box-card">
      <div slot="header" class="header">
        <span class="captain"
          >钢琴弹奏行为的脑机能测试<el-button
            type="primary"
            class="btn"
            @click="testSixthPart"
            >进入测试</el-button
          ></span
        >
      </div>
      <div class="body">
        <p>这一部分，我们将测量您的脑机能,请您按照指引完成操作。</p>
      </div>
      <p></p>
    </el-card>

    <el-card class="box-card">
      <div slot="header" class="header">
        <span class="captain"
          >个性化指法弹奏<el-button
            type="primary"
            class="btn"
            @click="testSevenPart"
            >进入测试</el-button
          ></span
        >
      </div>
      <div class="body">
        <p>
          这一部分，我们将比较个性化指法与标准指法的舒适度,请您按照指引完成操作。
        </p>
      </div>
      <p></p>
    </el-card>

    <el-card class="box-card">
      <div slot="header" class="header">
        <span class="captain"
          >听奏能力测试<el-button
            type="primary"
            class="btn"
            @click="testEightPart"
            >进入测试</el-button
          ></span
        >
      </div>
      <div class="body">
        <p>这一部分，我们将测试您的听奏能力，请您按照指引完成操作。</p>
      </div>
      <p></p>
    </el-card>

    <el-card class="box-card">
      <div slot="header" class="header">
        <span class="captain"
          >听辨音阶测试<el-button
            type="primary"
            class="btn"
            @click="testNinePart"
            >进入测试</el-button
          ></span
        >
      </div>
      <div class="body">
        <p>这一部分，我们将测试您的听辨音阶能力，请您按照指引完成操作。</p>
      </div>
      <p></p>
    </el-card>

    <el-card class="box-card">
      <div slot="header" class="header">
        <span class="captain"
          >听do音辨别音调测试<el-button
            type="primary"
            class="btn"
            @click="testTenPart"
            >进入测试</el-button
          ></span
        >
      </div>
      <div class="body">
        <p>这一部分，我们将测试您的听辨大调的能力，请您按照指引完成操作。</p>
      </div>
      <p></p>
    </el-card>
  </div>
</template>
<script>
export default {
  methods: {
    testFirtPart() {
      this.$router.replace("/step1");
    },
    testSecondPart() {
      this.$router.replace("/step2");
    },
    testThirdPart() {
      this.$router.replace("/step3");
    },
    testForthPart() {
      this.$router.replace("/step4");
    },
    testFifthPart() {
      this.$router.replace("/step5");
    },
    testSixthPart() {
      this.$router.replace("/step6");
    },
    testSevenPart() {
      this.$router.replace("/step7");
    },
    testEightPart() {
      this.$router.replace("/step8");
    },
    testNinePart() {
      this.$router.replace("/step9");
    },
    testTenPart() {
      this.$router.replace("/step10");
    },
  },
};
</script>
<style scoped>
.box-card {
  margin: 40px auto;
  width: 50%;
}
.captain {
  color: #303133;
  font-size: 23px;
}
.body {
  color: #909399;
  font-size: 18px;
}
.btn {
  padding: 10px 20px;
  float: right;
}
.piano {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("../assets/pianobg.jpg");
  overflow-x: auto;
}
</style>
