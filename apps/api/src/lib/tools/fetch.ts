import axios from 'axios';
import { FunctionParameter, FunctionParameterType, Tool } from './tool';
import { logger } from '../logger';

export interface FetchToolFunctionArgs {
  url: string;
}

export interface FetchToolFunctionResponse {
  result: string;
}

export interface FetchToolParams {
  numResults?: number;
}

export class FetchTool extends Tool<FetchToolFunctionArgs, FetchToolFunctionResponse> {
  public name = 'fetch';

  public description = `Fetch data from a given URL. To load any website, use this tool. please load direct files like *.html. load from public sites. only in a row. Returns the fetched website as text.
Needs the url as full string with protocol and params like https://www.google.com/search?q=hello`;

  public parameters: FunctionParameter = {
    type: FunctionParameterType.OBJECT,
    properties: {
      url: {
        type: FunctionParameterType.STRING,
        description: 'The URL to fetch data from',
      },
    },
    required: ['url'],
  };

  public async execute(args: FetchToolFunctionArgs): Promise<FetchToolFunctionResponse> {
    logger.debug('FetchTool.execute() -> args', { args });

    const { url } = args;

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        },
        responseType: 'text',
      });
      const result = response.data;

      logger.debug('FetchTool.execute() -> result', { result });

      return { result };
    } catch (error) {
      logger.debug('FetchTool.execute() -> error', { error });

      return { result: 'No good Google Search Result was found' };
    }
  }
}
