import { FunctionParameter, FunctionParameterType, Tool } from './tool';
import { VertexAIImageDescription } from '../image-description/vertexia';
import type { UserSessionManager } from '../user-session-manager';
import { logger } from '../logger';

export interface ImageDescribeToolFunctionArgs {
  query: string;
  imageId: string;
}

export interface ImageDescribeToolFunctionResponse {
  description: string;
}

const imageDescriptor = new VertexAIImageDescription({
  textModel: 'gemini-1.5-flash-001',
  generationConfig: {
    temperature: 0.5,
  },
});

export class ImageDescribeTool extends Tool<
  ImageDescribeToolFunctionArgs,
  ImageDescribeToolFunctionResponse
> {
  public readonly name = 'get_image_description';

  public readonly description =
    'Get the description of an image with a query, It is useful while the user asking you to review the image, the image is a placeholder, eg: [image#123], the image id will be 123.';

  public readonly parameters: FunctionParameter = {
    type: FunctionParameterType.OBJECT,
    properties: {
      imageId: {
        type: FunctionParameterType.STRING,
      },
      query: {
        type: FunctionParameterType.STRING,
      },
    },
    required: ['query', 'description'],
  };

  constructor(public readonly userSessionManager: UserSessionManager) {
    super();
  }

  public async execute(
    args: ImageDescribeToolFunctionArgs
  ): Promise<ImageDescribeToolFunctionResponse> {
    logger.debug('ImageDescribeTool.execute() -> args', { args });

    // Get the document by id
    const document = this.userSessionManager.getDocumentById(args.imageId);

    logger.debug('ImageDescribeTool.execute() -> document', { document });

    if (!document || !document.mimeType.startsWith('image')) {
      return {
        description: 'Image not found',
      };
    }

    const description = await imageDescriptor.getDescription(
      document.url,
      document.metadata?.query
    );

    return {
      description: `This is what you see in the image:\n${description}`,
    };
  }
}
