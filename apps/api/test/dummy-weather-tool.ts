import Debug from 'debug';
import { FunctionParameter, FunctionParameterType, Tool } from '../src/lib/tools/tool';

const debug = Debug('apps:tools:weather-tool');

export interface WeatherToolFunctionArgs {
  location: string;
  unit?: string;
}

export interface WeatherToolFunctionResponse {
  location: string;
  temperature: number;
  conditions: string;
  unit: string;
}

export class DummyWeatherTool extends Tool<WeatherToolFunctionArgs, WeatherToolFunctionResponse> {
  public readonly name = 'get_current_weather';

  public readonly description = 'Get the weather for a location';

  public readonly parameters: FunctionParameter = {
    type: FunctionParameterType.OBJECT,
    properties: {
      location: {
        type: FunctionParameterType.STRING,
      },
      unit: {
        type: FunctionParameterType.STRING,
        enum: ['celsius', 'fahrenheit'],
      },
    },
    required: ['location'],
  };

  public async execute(args: WeatherToolFunctionArgs): Promise<WeatherToolFunctionResponse> {
    debug('WeatherTool.execute() %O', args);

    return {
      location: args.location,
      temperature: 72,
      conditions: 'sunny',
      unit: args.unit || 'fahrenheit',
    };
  }
}
