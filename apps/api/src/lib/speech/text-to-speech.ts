export enum TextToSpeechVoice {
  MALE1 = 'MALE1',
  FEMALE1 = 'FEMALE1',
}

export abstract class TextToSpeech {
  public abstract synthesizeSpeech(text: string, voice: TextToSpeechVoice): Promise<Buffer>;
}
