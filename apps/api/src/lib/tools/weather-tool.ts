import axios from 'axios';
import { FunctionParameter, FunctionParameterType, Tool } from './tool';
import { logger } from '../logger';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY as string;

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

export class WeatherTool extends Tool<WeatherToolFunctionArgs, WeatherToolFunctionResponse> {
  public readonly name = 'get_current_weather';

  public readonly description = 'Get the real-time weather information for a location';

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
    logger.debug('WeatherTool.execute() -> args:', { args });

    const utils = args.unit === 'celsius' ? 'metric' : 'imperial';
    const response = await axios.get(
      `http://api.openweathermap.org/data/2.5/weather?q=${args.location}&appid=${OPENWEATHER_API_KEY}&units=${utils}`
    );
    const { data } = response;

    return {
      location: args.location,
      temperature: data.main.temp,
      conditions: data.weather?.[0].description || 'unknown',
      unit: args.unit || 'fahrenheit',
    };
  }
}
