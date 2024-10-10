export enum ChatMessageRole {
  USER = 'USER',
  ASSISTANT = 'MODEL',
  FUNCTION = 'FUNCTION', // OpenAI only
  TOOL = 'TOOL', // OpenAI only
  SYSTEM = 'SYSTEM', // OpenAI only
}

export interface TextChatMessage {
  role: ChatMessageRole.USER | ChatMessageRole.ASSISTANT | ChatMessageRole.SYSTEM;
  text: string;
  image: never;
  functionCall: never;
  functionCallResponse: never;
}

export interface TextImageChatMessage {
  role: ChatMessageRole.USER | ChatMessageRole.ASSISTANT | ChatMessageRole.SYSTEM;
  text: string;
  image: {
    imageUri: string;
    mimeType: string;
  };
  functionCall: never;
  functionCallResponse: never;
}

export interface ImageChatMessage {
  role: ChatMessageRole.USER | ChatMessageRole.ASSISTANT | ChatMessageRole.SYSTEM;
  image: {
    imageUri: string;
    mimeType: string;
  };
  text: never;
  functionCall: never;
  functionCallResponse: never;
}

export interface FunctionCallChatMessage {
  role: ChatMessageRole.ASSISTANT;
  functionCall: {
    id: string;
    name: string;
    args: Record<string, any>;
  };
  functionCallResponse: never;
  text: never;
  image: never;
}

export interface FunctionCallResponseChatMessage {
  role: ChatMessageRole.FUNCTION | ChatMessageRole.TOOL;
  functionCallResponse: {
    id: string;
    name: string;
    args: Record<string, string>;
    response: object;
  };
  functionCall: never;
  text: never;
  image: never;
}

export type ChatMessage =
  | TextChatMessage
  | ImageChatMessage
  | TextImageChatMessage
  | FunctionCallChatMessage
  | FunctionCallResponseChatMessage;

export type UserChatMessage = ChatMessage & { role: ChatMessageRole.USER };

export type AssistantChatMessage = ChatMessage & { role: ChatMessageRole.ASSISTANT };

export type Conversation = [
  UserChatMessage | FunctionCallResponseChatMessage,
  AssistantChatMessage,
];
