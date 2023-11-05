import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContactUsInputDto } from '../../models/dto/misc/misc.dto';

@Injectable()
export class MiscService {
  constructor(private prismaService: PrismaService) {}

  async captureContactUsDetails(contactUsInputDto: ContactUsInputDto) {
    const contactRequestData =
      await this.prismaService.contactrequests.findFirst({
        where: {
          emailid: contactUsInputDto.emailId,
          mobilenumber: contactUsInputDto.mobileNumber.toString(),
        },
      });

    if (contactRequestData) {
      await this.prismaService.contactrequests.update({
        data: {
          counter: contactRequestData.counter + 1,
        },
        where: {
          id: contactRequestData.id,
        },
      });
    } else {
      await this.prismaService.contactrequests.create({
        data: {
          emailid: contactUsInputDto.emailId,
          fullname: contactUsInputDto.fullname,
          organisationname: contactUsInputDto.organisationName,
          mobilenumber: contactUsInputDto.mobileNumber.toString(),
          counter: 1,
          createdat: new Date().toISOString(),
        },
      });
    }
    return { data: { statusCode: 200, message: 'success' } };
  }
}
