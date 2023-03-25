<template>
  <div ref="keyboardConatiner" class="keyboard-c">
    <div
      ref="keyboard"
      class="keyboard"
      :style="{ transform: `scale(${scale}) translateX(-${left}px)` }"
      :class="{ hidenum: !cacheConf.showKbdNum }"
    >
      <div ref="blacks" class="black" />
      <div ref="whites" class="white" />
      <div ref="centerC" class="center-c" />
    </div>
  </div>
</template>
<script>
import { offset } from "../util/offset";
import { setKeyBoard } from "../util/size";
import { whiteDom, blackDom, getKey } from "../util/keyboard";
import { keypress } from "../util/piano-control";
import store from "../store";

export default {
  data() {
    return {
      scale: 1,
      offsetTop: 0,
      offsetLeft: 0,
      left: 0,
    };
  },

  computed: {
    cacheConf() {
      return store.state.cacheConf;
    },
  },

  mounted() {
    this.init();
    this.initEvent();
    this.$refs.centerC.innerText = "中央C";
    this.keyDoms[40].setAttribute("class", "act");
    setKeyBoard(this);
  },

  methods: {
    init() {
      const { blacks, whites } = this.$refs;
      blacks.innerHTML = blackDom;
      whites.innerHTML = whiteDom;

      const keyDoms = new Array(89);

      function doCache(pdom) {
        for (let i = 0; i < pdom.children.length; i += 1) {
          const item = pdom.children[i];
          const key = parseInt(item.getAttribute("data-key"), 10);
          if (key) {
            keyDoms[key] = item;
          }
        }
      }
      doCache(blacks);
      doCache(whites);
      this.keyDoms = keyDoms;
    },

    initEvent() {
      const { keyboardConatiner } = this.$refs;

      const mouseEvent = () => {
        let isDown = false;
        keyboardConatiner.addEventListener(
          "mousedown",
          (e) => {
            e.stopPropagation();
            e.preventDefault();
            isDown = true;
            const x = e.pageX - this.offsetLeft;
            const y = e.pageY - this.offsetTop;
            const key = getKey(x / this.scale + this.left, y / this.scale);
            if (key) {
              keypress.down([key], true, 1);
              this.$emit("down", key);
            }
          },
          true
        );

        document.addEventListener(
          "mousemove",
          (e) => {
            if (isDown) {
              e.stopPropagation();
              e.preventDefault();
              const x = e.pageX - this.offsetLeft;
              const y = e.pageY - this.offsetTop;
              const key = getKey(x / this.scale + this.left, y / this.scale);
              keypress.down([key], true, 1);
              // console.log(key);
            }
          },
          true
        );
        document.addEventListener(
          "mouseup",
          (e) => {
            if (isDown) {
              e.stopPropagation();
              e.preventDefault();
              isDown = false;
              const x = e.pageX - this.offsetLeft;
              const y = e.pageY - this.offsetTop;
              const key = getKey(x / this.scale + this.left, y / this.scale);
              keypress.up([key], 1);
              // console.log(key);
            }
          },
          true
        );
      };

      const touchEvent = () => {
        let isDown = false;
        keyboardConatiner.addEventListener(
          "touchstart",
          (e) => {
            e.stopPropagation();
            e.preventDefault();
            isDown = true;
            const { touches } = e;
            const keys = [];
            for (let i = 0; i < e.touches.length; i += 1) {
              const pst = touches[i];
              const x = pst.pageX - this.offsetLeft;
              const y = pst.pageY - this.offsetTop;
              const key = getKey(x / this.scale + this.left, y / this.scale);
              if (key) {
                keys.push(key);
              }
            }
            if (keys.length) {
              keypress.down(keys, true, 1);
            }
          },
          true
        );

        document.addEventListener(
          "touchmove",
          (e) => {
            if (isDown) {
              e.stopPropagation();
              e.preventDefault();
              const { touches } = e;
              const keys = [];
              for (let i = 0; i < e.touches.length; i += 1) {
                const pst = touches[i];
                const x = pst.pageX - this.offsetLeft;
                const y = pst.pageY - this.offsetTop;
                const key = getKey(x / this.scale + this.left, y / this.scale);
                if (key) {
                  keys.push(key);
                }
              }
              keypress.down(keys, true, 1);
            }
          },
          true
        );
        document.addEventListener(
          "touchend",
          (e) => {
            if (isDown) {
              e.stopPropagation();
              e.preventDefault();
              if (e.touches.length === 0) {
                isDown = false;
              }
              const { touches } = e;
              const keys = [];
              for (let i = 0; i < e.touches.length; i += 1) {
                const pst = touches[i];
                const x = pst.pageX - this.offsetLeft;
                const y = pst.pageY - this.offsetTop;
                const key = getKey(x / this.scale + this.left, y / this.scale);
                if (key) {
                  keys.push(key);
                }
              }
              keypress.down(keys, true, 1);
              if (touches.length === 0) {
                isDown = false;
              }
            }
          },
          true
        );
      };

      if ("ontouchstart" in window) {
        touchEvent();
      }
      mouseEvent();

      keypress.onDown((keys = []) => {
        keys.forEach((i) => {
          this.keyDoms[i].setAttribute("class", "act");
        });
        console.log(this.keyDoms[i]);
      });

      keypress.onUp((keys = []) => {
        keys.forEach((i) => {
          this.keyDoms[i].setAttribute("class", "");
        });
        console.log(this.keyDoms[i]);
      });
    },

    setSize(scale, left) {
      this.scale = scale;
      this.left = left;
      const offsetValue = offset(this.$refs.keyboard);
      this.offsetTop = offsetValue.top + 200;
      this.offsetLeft = offsetValue.left;
    },
  },
};
</script>
<style lang="stylus">
.keyboard-c {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 0 0 15px;
}

.keyboard {
  position: absolute;
  bottom: 15px;
  height: 200px;
  touch-action: none;
  cursor: default;
  overflow: visible;
  transition: transform 0.2s;
  -webkit-user-select: none;
  -webkit-user-drag: none;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  transform-origin: 0 100%;
  font-size: 12px;
  box-shadow: 0 0 10px #0004;

  >.black {
    position: absolute;
    height: 125px;
    margin: 0 0 0 26px;
    width: 0;
    bottom: 75px;
    z-index: 4;
    pointer-events: none;

    >div {
      position: absolute;
      left: 0;
      top: 0;
      width: 27px;
      height: 100%;
      background-color: #444444;
      border: 1px solid #0008;
      border-radius: 3px;
      color: #fff;
      text-align: center;

      &.act {
        background-color: skyblue;
        border-color: #0008;
      }
    }
  }

  >.white {
    height: 200px;
    white-space: nowrap;
    bottom: 0px;
    margin: 0 0 0 1px;
    z-index: 2;
    pointer-events: none;

    >div {
      position: relative;
      display: inline-block;
      width: 41px;
      height: 100%;
      background-color: #fff;
      border: 1px solid #0004;
      margin: 0 0 0 -1px;
      box-sizing: border-box;
      border-radius: 4px;
      text-align: center;
      color: #000;

      &.act {
        background-color: skyblue;
      }

      >div {
        position: absolute;
        width: 100%;
        bottom: 10px;
        font-size: 12px;
      }
    }
  }

  &.hidenum {
    >div>div>span {
      display: none;
    }
  }

  >.center-c {
    position: absolute;
    bottom: 35px;
    left: 925px;
    font-size: 12px;
    color: #A43983;
    z-index: 5;
    pointer-events: none;
  }
}
</style>
