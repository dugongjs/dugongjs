import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("user_query_model")
export class UserQueryModelEntity {
    @PrimaryColumn("uuid")
    public id: string;

    @Column()
    public username: string;

    @Column()
    public email: string;
}
