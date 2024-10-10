import fs from 'node:fs';
import { GoogleSpeechToText } from './google-speech-to-text';

const SAMPLE_WAV_FILE = './test/fixtures/brooklyn_bridge.wav';

describe.skip('GoogleSpeechToText', () => {
  it('should recognize speech', async () => {
    const speechClient = new GoogleSpeechToText();
    const SAMPLE_AUDIO = fs.readFileSync(SAMPLE_WAV_FILE); // 16kHz, 16-bit, mono, WAV
    const result = await speechClient.recognize(SAMPLE_AUDIO);

    expect(result.content).toBe('how old is the Brooklyn Bridge');
  });

  it('should recognize speech with streaming', async () => {
    const speechClient = new GoogleSpeechToText();
    const audioStream = fs.createReadStream(SAMPLE_WAV_FILE);
    const stream = await speechClient.recognizeStream(audioStream);
    const results = [];

    for await (const result of stream) {
      results.push(result);
    }

    expect(results.length).toBe(1);
  });
});
