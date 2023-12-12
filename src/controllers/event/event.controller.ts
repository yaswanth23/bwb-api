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
  GetEventsListDto,
  VendorPriceSubmitDto,
  CounterPriceSubmitDto,
  CounterPriceStatusChangeDto,
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

  @Get('list')
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'status', enum: ['LIVE', 'CLOSED'] })
  @ApiQuery({ name: 'userId', type: Number, required: true })
  async getEventsList(@Query() params: GetEventsListDto) {
    return await this.eventService.getEventsList(params);
  }

  @Get('details/:userId/:eventId')
  async getEventDetails(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
  ) {
    return await this.eventService.getEventDetails(userId, eventId);
  }

  @Post('post/vendor/comparisions')
  async vendorPriceSubmit(@Body() vendorPriceSubmitDto: VendorPriceSubmitDto) {
    return await this.eventService.vendorPriceSubmit(vendorPriceSubmitDto);
  }

  @Post('post/counter/price')
  async counterPriceSubmit(
    @Body() counterPriceSubmitDto: CounterPriceSubmitDto,
  ) {
    return await this.eventService.counterPriceSubmit(counterPriceSubmitDto);
  }

  @Post('vendor/counter-price/status/change')
  async changeStatusCounterPrice(
    @Body() counterPriceStatusChangeDto: CounterPriceStatusChangeDto,
  ) {
    return await this.eventService.changeStatusCounterPrice(
      counterPriceStatusChangeDto,
    );
  }

  @Get('user/details/:userId/:eventId')
  async getUserEventDetails(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
  ) {
    return await this.eventService.getUserEventDetails(userId, eventId);
  }
}
