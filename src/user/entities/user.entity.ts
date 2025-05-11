import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column()
  password: string;
}
