import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class ContactUsInputDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  fullname: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  organisationName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  emailId: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  mobileNumber: number;
}

export class GenerateRegisterUrlDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  emailId: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  mobileNumber: number;
}
