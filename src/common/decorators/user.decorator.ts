import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export interface JwtPayload {
  userId: number;
  email: string;
}

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.user?.userId) {
      throw new UnauthorizedException('Authentication required');
    }
    return request.user as JwtPayload;
  },
);
