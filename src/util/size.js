export const comps = {
  piano: null,
  keyboard: null,
};

const keyboardWidth = 2081;


export const size = {
  clientWidth: 300,
  scale: 1,
  leftOst: 0,
  leftScale: 0,
};

import store from '../store'

export function resize() {
  const {
    piano, keyboard,
  } = comps;
  if (piano && piano.$refs && piano.$refs.piano) {
    const { clientWidth } = piano.$refs.piano;
    const s = clientWidth / keyboardWidth;
    size.clientWidth = clientWidth;

    const { cacheConf } = store.state;
    const userScale = cacheConf.scale;
    const userLeft = cacheConf.left;

    const changeScale = (userScale + 11) / 12;
    cacheConf.barScale = 1 / changeScale;
    size.leftScale = 1 - cacheConf.barScale;

    const scale = changeScale * s;
    size.scale = scale;

    const keyLeftOffset = size.leftScale * userLeft * keyboardWidth;

    if (keyboard) {
      keyboard.setSize(scale, keyLeftOffset);
    }
  }
}

window.addEventListener('resize', resize);


export function setPiano(pn) {
  comps.piano = pn;
  resize();
}

export function setKeyBoard(kbd) {
  comps.keyboard = kbd;
  resize();
}