import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class SignUpDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  key: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  organisationName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  emailId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  mobileNumber: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  roleId: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  password: string;
}
