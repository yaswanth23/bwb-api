import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MiscService } from '../../services/misc/misc.service';
import {
  ContactUsInputDto,
  GenerateRegisterUrlDto,
} from '../../models/dto/misc/misc.dto';

@ApiTags('Misc APIs')
@Controller('misc')
export class MiscController {
  constructor(private readonly miscService: MiscService) {}

  @Post('contact-us')
  async captureContactUsDetails(@Body() contactUsInputDto: ContactUsInputDto) {
    return await this.miscService.captureContactUsDetails(contactUsInputDto);
  }

  @Post('generate/register-url')
  async generateRegistrationUrl(
    @Body() generateRegisterUrlDto: GenerateRegisterUrlDto,
  ) {
    return await this.miscService.generateRegistrationUrl(
      generateRegisterUrlDto,
    );
  }

  @Get('verify-key/:uniqueKey')
  async verifyKey(@Param('uniqueKey') uniqueKey: string) {
    return await this.miscService.verifyKey(uniqueKey);
  }
}
