import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContactUsInputDto } from '../../models/dto/misc/misc.dto';
const nodemailer = require('nodemailer');

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

      let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAILER_ID,
          pass: process.env.MAILER_PASSWORD,
        },
      });

      const mailOptions = {
        from: 'yaswanth.k23@gmail.com',
        to: contactUsInputDto.emailId,
        subject: 'Thank you for Contacting us',
        text:
          'Hi ' +
          contactUsInputDto.fullname +
          ', Our team will contact you shortly over the provided Mobile Number: ' +
          contactUsInputDto.mobileNumber +
          '. Thanks & Reagards',
      };

      const notifyMailOPtions = {
        from: 'yaswanth.k23@gmail.com',
        to: 'yaswanth.k23@gmail.com',
        subject: contactUsInputDto.fullname + ' contacting us',
        text: 'Hey LGTM!😊, ' + contactUsInputDto.emailId + ' has contacted us',
      };

      transporter.sendMail(mailOptions);
      transporter.sendMail(notifyMailOPtions);
    }
    return { data: { statusCode: 200, message: 'success' } };
  }
}
