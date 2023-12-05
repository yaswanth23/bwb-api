import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '../../services/auth/auth.service';
import {
  SignUpDto,
  LoginDto,
  VendorSignUpDto,
} from '../../models/dto/auth/auth.dto';

@ApiTags('Auth APIs')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    return await this.authService.signUp(signUpDto);
  }

  @Post('vendor/signup')
  async vendorSignUp(@Body() vendorSignUpDto: VendorSignUpDto) {
    return await this.authService.vendorSignUp(vendorSignUpDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }
}
