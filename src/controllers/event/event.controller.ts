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
import { AddTNCDto, DeleteTNCDto } from '../../models/dto/event/event.dto';

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
}
