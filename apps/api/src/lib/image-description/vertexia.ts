import axios from 'axios';
import { logger } from '../logger';
import {
  ChatCompletionResponseType,
  ChatMessage,
  ChatMessageRole,
  VertexAIChatCompletion,
  VertexAIChatCompletionParams,
} from '../text-models';
import { ImageDescription } from './image-description';

const getMimeType = (url: string): string => {
  const extension = url.split('.').pop();

  switch (extension) {
    case 'png': {
      return 'image/png';
    }

    case 'jpg':
    case 'jpeg': {
      return 'image/jpeg';
    }

    case 'gif': {
      return 'image/gif';
    }

    default: {
      return 'image/jpeg';
    }
  }
};

export class VertexAIImageDescription extends ImageDescription {
  public textModel: VertexAIChatCompletion;

  constructor(params: VertexAIChatCompletionParams) {
    super();

    this.textModel = new VertexAIChatCompletion(params);
  }

  async getDescription(imageUrl: string, query = 'Describe this image'): Promise<string> {
    const mimeType = getMimeType(imageUrl);

    try {
      // download the image and convert it to base64
      const imageBase64 = await axios
        .get(imageUrl, { responseType: 'arraybuffer' })
        .then(response => {
          return Buffer.from(response.data, 'binary').toString('base64');
        });

      const messages = [
        {
          role: ChatMessageRole.USER,
          text: query,
          image: {
            imageUri: imageBase64,
            mimeType,
          },
        },
      ] as ChatMessage[];
      const response = await this.textModel.generate(messages);

      if (response[0].response.type === ChatCompletionResponseType.TEXT) {
        return response[0].response.text;
      }

      return 'Sorry, I could not describe the image';
    } catch (error) {
      logger.error('VertexAIImageDescription.getDescription() -> error:', error);

      return 'Sorry, I could not describe the image';
    }
  }
}
