import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumberString } from 'class-validator';

export class AddTNCDto {
  @ApiProperty()
  @IsNumberString()
  userId: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  termsAndCondition: string;
}

export class DeleteTNCDto {
  @ApiProperty()
  @IsNumberString()
  userId: number;

  @ApiProperty()
  @IsNumberString()
  termsConditionsId: number;
}
