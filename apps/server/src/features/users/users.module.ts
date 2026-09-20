import { Module } from "@nestjs/common";

import { CreateUser } from "@/features/users/application/create-user";
import { ListUsers } from "@/features/users/application/list-users";
import { UsersController } from "@/features/users/controller";
import { InMemoryUserRepository } from "@/features/users/infrastructure/in-memory-user-repository";
import { UserRepository } from "@/features/users/ports/user-repository";

@Module({
  controllers: [UsersController],
  providers: [
    CreateUser,
    ListUsers,
    // Bind the port to an adapter. Swapping to a database is a one-line change.
    { provide: UserRepository, useClass: InMemoryUserRepository },
  ],
})
export class UsersModule {}
