import { Body, Controller, Post, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { MiscService } from '../../services/misc/misc.service';
import { ContactUsInputDto } from '../../models/dto/misc/misc.dto';

@ApiTags('Misc APIs')
@Controller('misc')
export class MiscController {
  constructor(private readonly miscService: MiscService) {}

  @Post('contact-us')
  async captureContactUsDetails(@Body() contactUsInputDto: ContactUsInputDto) {
    return await this.miscService.captureContactUsDetails(contactUsInputDto);
  }
}
