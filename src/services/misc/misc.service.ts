import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
const nodemailer = require('nodemailer');
import { PrismaService } from '../prisma/prisma.service';
import {
  ContactUsInputDto,
  GenerateRegisterUrlDto,
} from '../../models/dto/misc/misc.dto';

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

  async generateRegistrationUrl(
    generateRegisterUrlDto: GenerateRegisterUrlDto,
  ) {
    const signUpRequestsData =
      await this.prismaService.signupRequests.findFirst({
        where: {
          OR: [
            { emailid: generateRegisterUrlDto.emailId },
            { mobile: generateRegisterUrlDto.mobileNumber },
          ],
          isused: true,
        },
      });

    if (signUpRequestsData) {
      throw new HttpException(
        'Email Id already exists in the system',
        HttpStatus.BAD_REQUEST,
      );
    }

    const uniqueKey = this.generateUUID();
    const deadlineTime = new Date(new Date().getTime() + 48 * 60 * 60 * 1000);

    await this.prismaService.signupRequests.create({
      data: {
        emailid: generateRegisterUrlDto.emailId,
        deadline: deadlineTime,
        mobile: generateRegisterUrlDto.mobileNumber,
        uniquekey: uniqueKey,
        isused: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      },
    });

    const generatedUrl = 'https://app-bwb.netlify.app/signup?key=' + uniqueKey;

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
      to: generateRegisterUrlDto.emailId,
      subject: 'Welcome to Our Service - Complete Your Registration',
      text: `Hello,
    
    Thank you for contacting us! We're excited to have you on board. To complete your registration, please use the following URL. This URL will expire after 48 hours.
    
    Registration URL: ${generatedUrl}
    
    If you have any questions or need assistance, feel free to reach out to our support team.
    
    Best regards,
    BWB`,
    };

    transporter.sendMail(mailOptions);

    return {
      data: { statusCode: 200, message: 'success', generatedUrl: generatedUrl },
    };
  }

  generateUUID(): string {
    return uuidv4();
  }

  async verifyKey(uniqueKey: string) {
    const data = await this.prismaService.signupRequests.findFirst({
      where: {
        uniquekey: uniqueKey,
      },
    });

    if (!data) {
      throw new HttpException('UniqueKey not found', HttpStatus.NOT_FOUND);
    }

    const currentDateTime = new Date();
    const deadlineDateTime = new Date(data.deadline);

    if (deadlineDateTime < currentDateTime) {
      throw new BadRequestException(
        'Signup request has expired',
        'SIGNUP_EXPIRED',
      );
    }

    return {
      data: { statusCode: 200, message: 'success' },
    };
  }
}
