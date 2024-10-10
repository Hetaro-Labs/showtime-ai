import { GoogleTextToSpeech } from './google-text-to-speech';
import { TextToSpeechVoice } from './text-to-speech';

describe.skip('GoogleTextToSpeech', () => {
  it('should synthesize speech', async () => {
    const speechClient = new GoogleTextToSpeech();
    const result = await speechClient.synthesizeSpeech(
      'Hello, how are you?',
      TextToSpeechVoice.FEMALE1
    );

    expect(result).toBeInstanceOf(Buffer);
  });
});
