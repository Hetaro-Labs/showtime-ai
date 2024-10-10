import { v1 } from '@google-cloud/speech';
import { google } from '@google-cloud/speech/build/protos/protos';
import { Stream } from 'node:stream';
import { ClientOptions } from 'google-gax';
import { GoogleAuth } from 'google-auth-library';
import Debug from 'debug';
import { SpeechLanguage, SpeechToText, TranscriptionResult } from './speech-to-text';
import StreamingRecognizeResponse = google.cloud.speech.v2.StreamingRecognizeResponse;
import AudioEncoding = google.cloud.speech.v1.RecognitionConfig.AudioEncoding;

const debug = Debug('apps:speech:google-speech-to-text');

// This is the GOOGLE_APPLICATION_CREDENTIALS_BASE64 environment variable only for local development
const GOOGLE_APPLICATION_CREDENTIALS_BASE64 = process.env
  .GOOGLE_APPLICATION_CREDENTIALS_BASE64 as string;

const getLanguageCode = (language: SpeechLanguage) => {
  switch (language) {
    case SpeechLanguage.ENGLISH: {
      return 'en-US';
    }

    default: {
      return 'en-US';
    }
  }
};

export class GoogleSpeechToText extends SpeechToText {
  private speechClient: v1.SpeechClient;

  constructor(options?: ClientOptions) {
    super();

    let googleAuth: GoogleAuth | undefined;

    if (GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
      try {
        googleAuth = new GoogleAuth({
          credentials: JSON.parse(
            Buffer.from(GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString()
          ),
        });
      } catch (error) {
        debug('Error parsing GOOGLE_APPLICATION_CREDENTIALS_BASE64', error);
      }
    }

    this.speechClient = new v1.SpeechClient({
      ...options,
      auth: googleAuth,
    });
  }

  public async recognize(input: Buffer): Promise<TranscriptionResult> {
    debug('recognize() -> recognizing speech');

    const audio = {
      content: input.toString('base64'),
    };
    const languageCode = getLanguageCode(this.language);
    const recognizeRequest: Parameters<typeof this.speechClient.recognize>[0] = {
      audio,
      config: {
        encoding: AudioEncoding.WEBM_OPUS,
        sampleRateHertz: 48_000,
        audioChannelCount: 1,
        languageCode, // ISO language code
      },
    };

    const [response] = await this.speechClient.recognize(recognizeRequest);

    debug('recognize() -> response: %s', JSON.stringify(response, null, 2));

    if (!response.results || !response.results?.[0]?.alternatives) {
      return {
        partial: false,
        content: '',
        startTime: 0,
        endTime: 0,
      };
    }

    const result = response.results[0].alternatives[0];

    debug('recognize() -> result: %s', JSON.stringify(result, null, 2));

    return {
      partial: false,
      content: result.transcript || '',
      startTime: 0,
      endTime: 0,
    };
  }

  public async recognizeStream(input: Stream): Promise<AsyncGenerator<TranscriptionResult>> {
    debug('recognizeStream() -> recognizing speech with streaming');

    return new Promise((resolve, reject) => {
      // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
      const self = this;

      try {
        const generator = (async function* generator() {
          const languageCode = getLanguageCode(self.language);
          const streamingConfig: Parameters<typeof self.speechClient.streamingRecognize>[0] = {
            config: {
              encoding: AudioEncoding.WEBM_OPUS,
              sampleRateHertz: 16_000,
              languageCode, // ISO language code
            },
            singleUtterance: true,
          };
          const stream = self.speechClient.streamingRecognize(streamingConfig);

          input.pipe(stream);

          let lastResultEndTime = 0;

          // eslint-disable-next-line @typescript-eslint/naming-convention
          for await (const _data of stream) {
            const data = _data as StreamingRecognizeResponse;
            const result = data.results[0];

            debug('recognizeStream() -> stream: %s', JSON.stringify(data, null, 2));

            if (!result || !result.alternatives?.[0]) {
              // done
              break;
            }

            const out: TranscriptionResult = {
              partial: !result.isFinal,
              content: result.alternatives?.[0].transcript || '',
              startTime: lastResultEndTime,
              endTime:
                (result.resultEndOffset?.seconds as number) * 1000 +
                (result.resultEndOffset?.nanos as number) / 1_000_000,
            };

            if (result.isFinal) {
              lastResultEndTime = out.endTime;
            }

            debug('recognizeStream() -> out: %s', JSON.stringify(out, null, 2));

            yield out;
          }
        })();

        resolve(generator);
      } catch (error) {
        reject(error);
      }
    });
  }
}
