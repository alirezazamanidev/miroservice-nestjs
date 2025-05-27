import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('file')
export class FileEntity {
    @PrimaryGeneratedColumn('uuid')
    id:string

    @Index()
    @Column({type: 'uuid'})
    userId:string
    @Column()
    originalName:string
    @Column({unique:true})
    storageName:string
    @Column()
    description:string
    @Column({type: 'bigint'})
    size:number
    @Column({default:false})
    isPublic:boolean 
    @Column({nullable:true})
    expiresAt:Date // expires time for file
    @Column()
    mimeType:string
    @Column()
    path:string
    @CreateDateColumn()
    created_at: Date
    @UpdateDateColumn()
    updated_at: Date
    @DeleteDateColumn()
    deleted_at: Date | null
}