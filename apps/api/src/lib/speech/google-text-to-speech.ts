import { v1 } from '@google-cloud/text-to-speech';
import { google } from '@google-cloud/text-to-speech/build/protos/protos';
import Debug from 'debug';
import { ClientOptions } from 'google-gax';
import { GoogleAuth } from 'google-auth-library';
import { TextToSpeech, TextToSpeechVoice } from './text-to-speech';
import AudioEncoding = google.cloud.texttospeech.v1.AudioEncoding;

const debug = Debug('apps:speech:google-text-to-speech');

// This is the GOOGLE_APPLICATION_CREDENTIALS_BASE64 environment variable only for local development
const GOOGLE_APPLICATION_CREDENTIALS_BASE64 = process.env
  .GOOGLE_APPLICATION_CREDENTIALS_BASE64 as string;

export class GoogleTextToSpeechError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleTextToSpeechError';
  }
}

const voiceMapping = (voice: TextToSpeechVoice): string => {
  switch (voice) {
    case TextToSpeechVoice.MALE1: {
      return 'en-US-Standard-B';
    }

    case TextToSpeechVoice.FEMALE1: {
      return 'en-US-Standard-C';
    }

    default: {
      throw new GoogleTextToSpeechError(`Voice ${voice} not supported`);
    }
  }
};

export class GoogleTextToSpeech extends TextToSpeech {
  private speechClient: v1.TextToSpeechClient;

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

    this.speechClient = new v1.TextToSpeechClient({
      ...options,
      auth: googleAuth,
    });
  }

  public async synthesizeSpeech(text: string, voice: TextToSpeechVoice): Promise<Buffer> {
    debug('synthesizeSpeech() -> synthesizing speech');

    const myVoice = voiceMapping(voice);

    const [response] = await this.speechClient.synthesizeSpeech({
      input: { text },
      voice: {
        name: myVoice,
        languageCode: 'en-US',
      },
      audioConfig: {
        audioEncoding: AudioEncoding.MP3,
      },
    });

    debug('synthesizeSpeech() -> speech synthesized');

    return response.audioContent as Buffer;
  }
}
