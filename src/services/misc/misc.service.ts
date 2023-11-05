import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContactUsInputDto } from '../../models/dto/misc/misc.dto';

@Injectable()
export class MiscService {
  constructor(private prismaService: PrismaService) {}

  async captureContactUsDetails(contactUsInputDto: ContactUsInputDto) {
    return contactUsInputDto;
  }
}
