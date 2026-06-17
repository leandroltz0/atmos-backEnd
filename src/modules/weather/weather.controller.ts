import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { CityService } from './city.service';
import { WeatherQueryDto } from './dto/weather-query.dto';
import { CitySearchQueryDto } from './dto/city-search-query.dto';

@Controller('cities')
export class CitiesController {
  constructor(private readonly cityService: CityService) {}

  @Get('search')
  async searchCities(@Query() query: CitySearchQueryDto) {
    const cities = await this.cityService.searchCities(query.q);
    return { cities };
  }
}

@Controller('weather')
export class WeatherController {
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
