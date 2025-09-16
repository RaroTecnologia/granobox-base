import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OperatorsService } from '../services/operators.service';
import { CreateOperatorDto, UpdateOperatorDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('operators')
@UseGuards(JwtAuthGuard)
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Post()
  create(@Body() createOperatorDto: CreateOperatorDto) {
    return this.operatorsService.create(createOperatorDto);
  }

  @Get()
  findAll(@Query('clientId') clientId: string) {
    return this.operatorsService.findAll(clientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.operatorsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOperatorDto: UpdateOperatorDto) {
    return this.operatorsService.update(id, updateOperatorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.operatorsService.remove(id);
  }

  @Post(':id/validate-pin')
  validatePin(@Param('id') id: string, @Body() body: { pin: string }) {
    return this.operatorsService.validatePin(id, body.pin);
  }

  @Post('authenticate')
  authenticate(@Body() body: { clientId: string; pin: string }) {
    return this.operatorsService.findByClientAndPin(body.clientId, body.pin);
  }
}
