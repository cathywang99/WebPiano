import KeyPress from './keypress';
import MidiTimeLine from './miditimeline';
import { noteOn, noteOff } from '../midi';

export const keypress = new KeyPress();

export const miditimeline = new MidiTimeLine();

keypress.onDown((keys) => {
  miditimeline.recordKeyDown(keys);
  noteOn(keys);
});

keypress.onUp((keys) => {
  miditimeline.recordKeyUp(keys);
  noteOff(keys);
});
