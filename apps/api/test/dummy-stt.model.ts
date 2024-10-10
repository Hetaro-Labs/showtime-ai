import { Stream } from 'stream';
import { SpeechToText, TranscriptionResult } from '../src/lib/speech/speech-to-text';

export class DummySpeechToText extends SpeechToText {
  public recognizeStream(_input: Stream): Promise<AsyncGenerator<TranscriptionResult>> {
    // Implement your logic here to perform speech-to-text recognition on the input stream
    // and return the recognized text as a Promise<AsyncGenerator<TranscriptionResult, any, unknown>>
    // You can use libraries like Google Cloud Speech-to-Text or IBM Watson Speech-to-Text for actual implementation
    // For now, let's return an empty generator
    return Promise.resolve(
      (async function* generator() {
        yield {
          partial: false,
          content: 'Hello, how are you?',
          startTime: 0,
          endTime: 0,
        };
      })()
    );
  }

  public recognize(_input: Buffer): Promise<TranscriptionResult> {
    // Implement your logic here to perform speech-to-text recognition on the input buffer
    // and return the recognized text as a Promise<string>
    // You can use libraries like Google Cloud Speech-to-Text or IBM Watson Speech-to-Text for actual implementation
    // For now, let's return a static string
    return Promise.resolve({
      partial: false,
      content: 'Hello, how are you?',
      startTime: 0,
      endTime: 0,
    } as TranscriptionResult);
  }
}
