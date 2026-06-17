import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherQueryDto } from './dto/weather-query.dto';

@Controller('api/weather')
export class ApiWeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('current')
  async getCurrentWeather(@Query() query: WeatherQueryDto) {
    return this.weatherService.getCurrentWeather(query.lat, query.lon);
  }

  @Get('forecast')
  async getForecastWeather(@Query() query: WeatherQueryDto) {
    return this.weatherService.getForecastWeather(query.lat, query.lon);
  }

  @Get('air-quality')
  async getAirQuality(@Query() query: WeatherQueryDto) {
    return this.weatherService.getAirQuality(query.lat, query.lon);
  }
}
