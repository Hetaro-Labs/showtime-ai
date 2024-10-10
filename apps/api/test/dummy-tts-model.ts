import { TextToSpeech, TextToSpeechVoice } from '../src/lib/speech/text-to-speech';

export class DummyTTSModel extends TextToSpeech {
  public synthesizeSpeech(_text: string, _voice: TextToSpeechVoice): Promise<Buffer> {
    return Promise.resolve(Buffer.from('dummy-tts'));
  }
}
