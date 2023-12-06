import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { EventService } from '../../services/event/event.service';
import {
  AddTNCDto,
  DeleteTNCDto,
  EventScheduleDto,
  GetEventsDto,
} from '../../models/dto/event/event.dto';

@ApiTags('Event APIs')
@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post('terms-and-conditions')
  async addTermsAndConditions(@Body() addTNCDto: AddTNCDto) {
    return await this.eventService.addTermsAndConditions(addTNCDto);
  }

  @Get('terms-and-conditions/:userId')
  async getTermsAndConditions(@Param('userId') userId: string) {
    return await this.eventService.getTermsAndConditions(userId);
  }

  @Delete('terms-and-conditions')
  @ApiQuery({ name: 'termsConditionsId', type: Number, required: true })
  @ApiQuery({ name: 'userId', type: Number, required: true })
  async deleteTermsAndConditions(@Query() params: DeleteTNCDto) {
    return await this.eventService.deleteTermsAndConditions(params);
  }

  @Post('schedule')
  async scheduleEvent(@Body() eventScheduleDto: EventScheduleDto) {
    return await this.eventService.scheduleEvent(eventScheduleDto);
  }

  @Get()
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'status', enum: ['LIVE', 'UPCOMING', 'CLOSED'] })
  @ApiQuery({ name: 'userId', type: Number, required: true })
  async getEvents(@Query() params: GetEventsDto) {
    return await this.eventService.getEvents(params);
  }

  @Get('count/:userId')
  async getEventsCount(@Param('userId') userId: string) {
    return await this.eventService.getEventsCount(userId);
  }

  @Get('count/vendor/:userId')
  async getVendorEventsCount(@Param('userId') userId: string) {
    return await this.eventService.getVendorEventsCount(userId);
  }
}
