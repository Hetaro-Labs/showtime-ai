import { TextModel, TextModelResponse } from './text-model';
import { AssistantChatMessage, ChatMessage, ChatMessageRole } from './chat-message';
import type { Tool } from '../tools/tool';

export enum ChatCompletionResponseType {
  TEXT = 'text',
  FUNCTION_CALL = 'function',
  IMAGE = 'image',
}

export type ChatCompletionTextResponse = {
  type: ChatCompletionResponseType.TEXT;
  text: string;
};

export type ChatCompletionFunctionCallResponse = {
  id: string;
  type: ChatCompletionResponseType.FUNCTION_CALL;
  name: string;
  args: Record<string, any>;
};

export type ChatCompletionImageResponse = {
  type: ChatCompletionResponseType.IMAGE;
  imageUri: string; // base64 encoded image
  mimeType: string;
};

export type ChatCompletionResponse =
  | ChatCompletionTextResponse
  | ChatCompletionImageResponse
  | ChatCompletionFunctionCallResponse;

export interface ChatCompletionParams {
  systemInstruction?: string;
}

export abstract class ChatCompletion<
  InputType = Array<ChatMessage>,
  ResponseType = ChatCompletionResponse,
> extends TextModel<InputType, ResponseType> {
  public systemInstruction?: string;

  constructor(public params?: ChatCompletionParams) {
    super();

    if (params?.systemInstruction) {
      this.systemInstruction = params.systemInstruction;
    }
  }

  public abstract generate(
    input: InputType,
    tools?: Tool[]
  ): Promise<Array<TextModelResponse<ResponseType>>>;

  public abstract generateStream(
    input: InputType,
    tools?: Tool[]
  ): Promise<AsyncGenerator<Array<TextModelResponse<ResponseType>>>>;

  public setSystemInstruction(systemInstruction: string): void {
    this.systemInstruction = systemInstruction;
  }
}

export const convertResponseToChatMessage = ({
  response,
}: TextModelResponse<ChatCompletionResponse>): AssistantChatMessage => {
  if (response.type === ChatCompletionResponseType.TEXT) {
    return {
      role: ChatMessageRole.ASSISTANT,
      text: response.text,
    } as AssistantChatMessage;
  }

  if (response.type === ChatCompletionResponseType.IMAGE) {
    return {
      role: ChatMessageRole.ASSISTANT,
      image: {
        imageUri: response.imageUri,
        mimeType: response.mimeType,
      },
    } as AssistantChatMessage;
  }

  if (response.type === ChatCompletionResponseType.FUNCTION_CALL) {
    return {
      role: ChatMessageRole.ASSISTANT,
      functionCall: {
        id: response.id,
        name: response.name,
        args: response.args,
      },
    } as AssistantChatMessage;
  }

  throw new Error('Unknown response type');
};
