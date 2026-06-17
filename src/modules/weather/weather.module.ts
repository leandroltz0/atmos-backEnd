import { Module } from '@nestjs/common';
import { WeatherController, CitiesController } from './weather.controller';
import { ApiWeatherController } from './api-weather.controller';
import { WeatherService } from './weather.service';
import { CityService } from './city.service';

@Module({
  controllers: [WeatherController, CitiesController, ApiWeatherController],
  providers: [WeatherService, CityService],
})
export class WeatherModule {}
