import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsArray,
  IsString,
  ValidateNested,
  IsNumberString,
  IsNumber,
  IsOptional,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

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
