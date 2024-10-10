export enum FunctionParameterType {
  STRING = 'string',
  NUMBER = 'number',
  INTEGER = 'number',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
}

export interface FunctionParameterProperty {
  type: FunctionParameterType;
  description?: string;
  enum?: string[];
}

export interface FunctionParameter {
  type: FunctionParameterType;
  properties: {
    [key: string]: FunctionParameterProperty;
  };
  required?: string[];
}

export abstract class Tool<Args = any, Response = object> {
  public abstract readonly name: string;

  public abstract readonly description: string;

  public abstract readonly parameters: FunctionParameter;

  public abstract execute(args: Args): Promise<Response>;
}
