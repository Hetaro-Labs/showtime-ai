export enum TextModelFinishReason {
  STOP = 'STOP',
  LENGTH = 'LENGTH',
  FUNCTION_CALL = 'FUNCTION_CALL',
  CONTENT_FILTER = 'CONTENT_FILTER',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN', // for openai stream
}

export interface TextModelResponse<ResponseType> {
  finishReason: TextModelFinishReason;
  response: ResponseType;
}

export class TextModelGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TextModelGenerationError';
  }
}

export abstract class TextModel<InputType, ResponseType> {
  public abstract generate(input: InputType): Promise<TextModelResponse<ResponseType>[]>;
}
