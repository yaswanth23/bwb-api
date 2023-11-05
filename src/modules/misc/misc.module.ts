import { Module } from '@nestjs/common';
import { MiscController } from '../../controllers/misc/misc.controller';
import { MiscService } from '../../services/misc/misc.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [MiscController],
  providers: [MiscService],
  imports: [PrismaModule],
})
export class MiscModule {}
