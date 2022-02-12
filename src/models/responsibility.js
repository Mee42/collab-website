import {BaseEntity,Entity,Column,PrimaryColumn,OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./user";

@Entity()
export class Responsibility extends BaseEntity {
    @PrimaryGeneratedColumn('numeric')
    id;

    @Column('text')
    name = "";

    @OneToMany(type => User)
    users = undefined;
}